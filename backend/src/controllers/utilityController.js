const db = require('../config/database');
const path = require('path');
const fs = require('fs');

/**
 * Utility Bills Management Controller
 * Handles bill uploads, OCR extraction, payments, and notifications
 */
class UtilityController {
  
  // ==================== BILL MANAGEMENT ====================

  /**
   * Get all utility bills with filters
   */
  static async getAllUtilities(req, res) {
    try {
      const { status, bill_type, month } = req.query;
      
      let query = `
        SELECT ub.*, 
               up.payment_method, up.payment_date, up.transaction_id, up.screenshot_path as payment_screenshot,
               DATEDIFF(ub.due_date, CURDATE()) as days_until_due
        FROM utility_bills ub 
        LEFT JOIN utility_payments up ON ub.id = up.bill_id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ' AND ub.status = ?';
        params.push(status);
      }
      if (bill_type) {
        query += ' AND ub.bill_type = ?';
        params.push(bill_type);
      }
      if (month) {
        query += ' AND ub.billing_month LIKE ?';
        params.push(`%${month}%`);
      }

      query += ' ORDER BY ub.due_date ASC';

      const [bills] = await db.query(query, params);
      
      // Add notification status to each bill
      const billsWithStatus = bills.map(bill => ({
        ...bill,
        notification_type: UtilityController.getNotificationType(bill.days_until_due, bill.status)
      }));

      res.json(billsWithStatus);
    } catch (error) {
      console.error('Error fetching utilities:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get single utility bill by ID
   */
  static async getUtilityById(req, res) {
    try {
      const { id } = req.params;
      
      const [bills] = await db.query(`
        SELECT ub.*, 
               up.id as payment_id, up.payment_method, up.payment_date, up.transaction_id,
               up.amount_paid, up.screenshot_path as payment_screenshot, up.notes as payment_notes,
               DATEDIFF(ub.due_date, CURDATE()) as days_until_due
        FROM utility_bills ub 
        LEFT JOIN utility_payments up ON ub.id = up.bill_id
        WHERE ub.id = ?
      `, [id]);

      if (bills.length === 0) {
        return res.status(404).json({ message: 'Utility bill not found' });
      }

      const bill = bills[0];
      bill.notification_type = UtilityController.getNotificationType(bill.days_until_due, bill.status);

      res.json(bill);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Create new utility bill (with optional image upload)
   */
  static async createUtility(req, res) {
    try {
      const { 
        bill_type, due_date, total_amount, late_surcharge, 
        billing_month, reference_number, notes 
      } = req.body;
      
      // Image path from multer upload
      const image_path = req.file ? `/uploads/bills/${req.file.filename}` : null;

      const [result] = await db.query(
        `INSERT INTO utility_bills 
         (bill_type, image_path, due_date, total_amount, late_surcharge, billing_month, reference_number, notes, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [bill_type, image_path, due_date, total_amount || 0, late_surcharge || 0, billing_month, reference_number, notes]
      );

      // Create notification for this bill
      await UtilityController.createBillNotification(result.insertId, bill_type, due_date, total_amount);

      res.status(201).json({ 
        message: 'Utility bill created successfully',
        id: result.insertId,
        image_path
      });
    } catch (error) {
      console.error('Error creating utility:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Update utility bill (only if not paid)
   */
  static async updateUtility(req, res) {
    try {
      const { id } = req.params;
      
      // Check if bill is already paid
      const [existing] = await db.query('SELECT status FROM utility_bills WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ message: 'Utility bill not found' });
      }
      if (existing[0].status === 'paid') {
        return res.status(400).json({ message: 'Cannot edit a paid bill' });
      }

      const { due_date, total_amount, late_surcharge, billing_month, reference_number, notes } = req.body;
      
      // Update image if new one uploaded
      const image_path = req.file ? `/uploads/bills/${req.file.filename}` : undefined;

      let query = `
        UPDATE utility_bills 
        SET due_date = ?, total_amount = ?, late_surcharge = ?, 
            billing_month = ?, reference_number = ?, notes = ?
      `;
      const params = [due_date, total_amount, late_surcharge, billing_month, reference_number, notes];

      if (image_path) {
        query += ', image_path = ?';
        params.push(image_path);
      }

      query += ' WHERE id = ?';
      params.push(id);

      await db.query(query, params);

      // Update notification
      await UtilityController.updateBillNotification(id, due_date, total_amount);

      res.json({ message: 'Utility bill updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Delete utility bill (only if not paid)
   */
  static async deleteUtility(req, res) {
    try {
      const { id } = req.params;
      
      const [existing] = await db.query('SELECT status, image_path FROM utility_bills WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ message: 'Utility bill not found' });
      }
      if (existing[0].status === 'paid') {
        return res.status(400).json({ message: 'Cannot delete a paid bill' });
      }

      // Delete associated notifications
      await db.query('DELETE FROM notifications WHERE reference_id = ? AND reference_type = ?', [id, 'utility_bill']);
      
      // Delete the bill
      await db.query('DELETE FROM utility_bills WHERE id = ?', [id]);

      res.json({ message: 'Utility bill deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // ==================== OCR EXTRACTION ====================

  /**
   * Process uploaded bill image with OCR
   * Returns extracted data for user verification
   */
  static async processOCR(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file uploaded' });
      }

      const imagePath = path.join(__dirname, '../../uploads/bills', req.file.filename);
      const processedPath = path.join(__dirname, '../../uploads/bills', `processed_${req.file.filename}`);
      
      // Preprocess image with Sharp for better OCR
      const sharp = require('sharp');
      await sharp(imagePath)
        .resize(2000, null, { withoutEnlargement: false }) // Enlarge for better OCR
        .grayscale() // Convert to grayscale
        .normalize() // Enhance contrast
        .sharpen() // Sharpen text
        .toFile(processedPath);

      console.log('Image preprocessed for OCR');
      
      // Use Tesseract.js for OCR
      const Tesseract = require('tesseract.js');
      
      const { data: { text } } = await Tesseract.recognize(processedPath, 'eng', {
        logger: m => console.log('OCR Progress:', m.status)
      });

      // Clean up processed file
      const fs = require('fs');
      fs.unlink(processedPath, () => {});

      // Extract relevant data from OCR text
      const extractedData = UtilityController.parseOCRText(text);

      res.json({
        message: 'OCR processing completed',
        image_path: `/uploads/bills/${req.file.filename}`,
        raw_text: text,
        extracted_data: extractedData
      });
    } catch (error) {
      console.error('OCR Error:', error);
      res.status(500).json({ message: 'OCR processing failed: ' + error.message });
    }
  }

  /**
   * Parse OCR text to extract bill details
   * Optimized for Pakistani utility bills (SSGC, SNGPL, WAPDA, K-Electric)
   */
  static parseOCRText(text) {
    console.log('=== RAW OCR TEXT ===');
    console.log(text);
    console.log('====================');

    const extractedData = {
      due_date: null,
      total_amount: null,
      late_surcharge: null,
      billing_month: null,
      reference_number: null,
      bill_type: null
    };

    // Detect bill type
    if (/ssgc|sui\s*southern|gas\s*company/i.test(text)) {
      extractedData.bill_type = 'gas';
    } else if (/sngpl|sui\s*northern/i.test(text)) {
      extractedData.bill_type = 'gas';
    } else if (/wapda|lesco|fesco|gepco|mepco|pesco|hesco|qesco|sepco|iesco|k-?electric|ke\s*bill/i.test(text)) {
      extractedData.bill_type = 'electricity';
    }

    // ============ SSGC SPECIFIC PATTERNS ============
    // SSGC bills have a footer section: "Total Amount Due | Due Date | After Due Date"
    // followed by values like: "16,430 | 20-Feb-2026 | 16,680"
    
    // Look for the summary line pattern (bottom of SSGC bill)
    const ssgcSummaryPattern = /(\d{10,})\s*\(?[\d]*\)?\s+([\d,]+)\s+(\d{1,2}[-\/]?\w{3}[-\/]?\d{2,4})\s+([\d,]+)/i;
    const summaryMatch = text.match(ssgcSummaryPattern);
    
    if (summaryMatch) {
      console.log('Found SSGC summary pattern:', summaryMatch);
      extractedData.reference_number = summaryMatch[1];
      extractedData.total_amount = parseFloat(summaryMatch[2].replace(/,/g, ''));
      extractedData.due_date = UtilityController.formatDate(summaryMatch[3]);
      // summaryMatch[4] is the after due date amount (late surcharge total)
      const afterDueAmount = parseFloat(summaryMatch[4].replace(/,/g, ''));
      if (afterDueAmount > extractedData.total_amount) {
        extractedData.late_surcharge = afterDueAmount - extractedData.total_amount;
      }
    }

    // ============ AMOUNT PATTERNS (fallback) ============
    if (!extractedData.total_amount) {
      const amountPatterns = [
        // SSGC summary: "Total Amount Due ... 16,430"
        /total\s*amount\s*due[^0-9]*([\d,]+)/i,
        // Payable within due date
        /payable\s*within\s*due\s*date[^0-9]*([\d,]+)/i,
        // Current Charges
        /(?:current|total)\s*charges[^0-9]*([\d,]+)/i
      ];

      for (const pattern of amountPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const amount = parseFloat(match[1].replace(/,/g, ''));
          if (amount > 100 && amount < 500000) {
            extractedData.total_amount = amount;
            console.log('Found amount (fallback):', amount);
            break;
          }
        }
      }
    }

    // ============ LATE SURCHARGE ============
    if (!extractedData.late_surcharge) {
      // Look for "Late Payment Surcharge (Rs.)" section with value
      const surchargePatterns = [
        /late\s*payment\s*surcharge[^0-9]*([\d,]+)/i,
        /surcharge[^0-9]*([\d,]+)/i
      ];

      for (const pattern of surchargePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const amount = parseFloat(match[1].replace(/,/g, ''));
          if (amount > 0 && amount < 50000) {
            extractedData.late_surcharge = amount;
            console.log('Found surcharge:', amount);
            break;
          }
        }
      }
    }

    // ============ DUE DATE (fallback) ============
    if (!extractedData.due_date) {
      // Look for dates in format: 20-Feb-2026, 20-Feb-26
      const datePatterns = [
        /due\s*date[^0-9]*(\d{1,2}[-\/]\w{3}[-\/]\d{2,4})/i,
        /(\d{1,2}[-\/](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[-\/]\d{2,4})/i
      ];

      for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const formattedDate = UtilityController.formatDate(match[1]);
          // Only accept dates in 2024-2030 range
          if (formattedDate && /202[4-9]|2030/.test(formattedDate)) {
            extractedData.due_date = formattedDate;
            console.log('Found date (fallback):', formattedDate);
            break;
          }
        }
      }
    }

    // ============ BILLING MONTH ============
    // SSGC format: "Billing Month: Jan-2026" or "Jan-2026"
    const monthPatterns = [
      /(?:billing|bill)\s*month[:\s]*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-\s]?\d{4})/i,
      /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-]?\d{4})\b/i
    ];

    for (const pattern of monthPatterns) {
      const matches = text.match(new RegExp(pattern, 'gi'));
      if (matches) {
        // Get the most recent looking month (with 202x year)
        for (const m of matches) {
          if (/202[4-9]/.test(m)) {
            extractedData.billing_month = m.trim();
            console.log('Found billing month:', extractedData.billing_month);
            break;
          }
        }
        if (extractedData.billing_month) break;
      }
    }

    // ============ REFERENCE/CONSUMER NUMBER ============
    if (!extractedData.reference_number) {
      const refPatterns = [
        /customer\s*number[:\s]*(\d{10,})/i,
        /consumer\s*(?:no|number)?[:\s]*(\d{10,})/i,
        /\b(\d{10,})\s*\(\d+\)/  // Pattern like "8011291000 (7)"
      ];

      for (const pattern of refPatterns) {
        const match = text.match(pattern);
        if (match && match[1] && match[1].length >= 6) {
          extractedData.reference_number = match[1].trim();
          console.log('Found reference:', extractedData.reference_number);
          break;
        }
      }
    }

    console.log('=== EXTRACTED DATA ===');
    console.log(extractedData);
    console.log('======================');

    return extractedData;
  }

  /**
   * Format various date strings to YYYY-MM-DD
   */
  static formatDate(dateStr) {
    if (!dateStr) return null;
    
    const monthNames = {
      'jan': '01', 'january': '01', 'feb': '02', 'february': '02',
      'mar': '03', 'march': '03', 'apr': '04', 'april': '04',
      'may': '05', 'jun': '06', 'june': '06', 'jul': '07', 'july': '07',
      'aug': '08', 'august': '08', 'sep': '09', 'september': '09',
      'oct': '10', 'october': '10', 'nov': '11', 'november': '11',
      'dec': '12', 'december': '12'
    };
    
    let parts = dateStr.split(/[-\/\.]/);
    if (parts.length === 3) {
      let [day, month, year] = parts;
      
      if (monthNames[month.toLowerCase()]) {
        month = monthNames[month.toLowerCase()];
      }
      if (year.length === 2) year = '20' + year;
      
      day = day.padStart(2, '0');
      month = month.padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    }
    return null;
  }

  // ==================== PAYMENT PROCESSING ====================

  /**
   * Mark bill as paid with payment details
   */
  static async markAsPaid(req, res) {
    try {
      const { id } = req.params;
      const { payment_method, amount_paid, transaction_id, notes } = req.body;
      
      // Verify bill exists and is not already paid
      const [bills] = await db.query('SELECT * FROM utility_bills WHERE id = ?', [id]);
      if (bills.length === 0) {
        return res.status(404).json({ message: 'Utility bill not found' });
      }
      if (bills[0].status === 'paid') {
        return res.status(400).json({ message: 'Bill is already marked as paid' });
      }

      const bill = bills[0];
      const screenshot_path = req.file ? `/uploads/payments/${req.file.filename}` : null;

      // If online_app payment, screenshot is recommended
      if (payment_method === 'online_app' && !screenshot_path) {
        console.warn('Online app payment without screenshot');
      }

      // Create payment record with transaction_id
      const [paymentResult] = await db.query(
        `INSERT INTO utility_payments 
         (bill_id, payment_method, payment_date, amount_paid, transaction_id, screenshot_path, notes) 
         VALUES (?, ?, CURDATE(), ?, ?, ?, ?)`,
        [id, payment_method, amount_paid || bill.total_amount, transaction_id || null, screenshot_path, notes]
      );

      // Update bill status
      await db.query('UPDATE utility_bills SET status = ? WHERE id = ?', ['paid', id]);

      // Remove active notifications and create paid notification
      await db.query(
        'UPDATE notifications SET is_dismissed = TRUE WHERE reference_id = ? AND reference_type = ?',
        [id, 'utility_bill']
      );

      // Create success notification
      await db.query(
        `INSERT INTO notifications (type, title, message, reference_id, reference_type, severity) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'utility_paid',
          `${bill.bill_type.toUpperCase()} Bill Paid`,
          `Your ${bill.bill_type} bill of Rs. ${amount_paid || bill.total_amount} has been paid successfully via ${payment_method}.`,
          id,
          'utility_bill',
          'success'
        ]
      );

      res.json({ 
        message: 'Bill marked as paid successfully',
        payment_id: paymentResult.insertId
      });
    } catch (error) {
      console.error('Payment error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get payment history for all bills
   */
  static async getPaymentHistory(req, res) {
    try {
      const [payments] = await db.query(`
        SELECT 
          up.*,
          ub.bill_type, ub.billing_month, ub.reference_number, 
          ub.total_amount as bill_amount, ub.image_path as bill_image
        FROM utility_payments up
        JOIN utility_bills ub ON up.bill_id = ub.id
        ORDER BY up.payment_date DESC
      `);

      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // ==================== NOTIFICATIONS ====================

  /**
   * Get all active utility notifications
   */
  static async getNotifications(req, res) {
    try {
      // First, update overdue bills
      await UtilityController.updateOverdueBills();

      const [notifications] = await db.query(`
        SELECT * FROM notifications 
        WHERE type IN ('utility_due', 'utility_overdue', 'utility_paid')
        AND is_dismissed = FALSE
        ORDER BY 
          CASE severity 
            WHEN 'urgent' THEN 1 
            WHEN 'warning' THEN 2 
            WHEN 'success' THEN 3 
            ELSE 4 
          END,
          created_at DESC
      `);

      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get notification summary for dashboard
   */
  static async getNotificationSummary(req, res) {
    try {
      // Update overdue bills first
      await UtilityController.updateOverdueBills();

      const [pending] = await db.query(`
        SELECT 
          COUNT(*) as total_pending,
          SUM(CASE WHEN DATEDIFF(due_date, CURDATE()) <= 0 THEN 1 ELSE 0 END) as overdue_count,
          SUM(CASE WHEN DATEDIFF(due_date, CURDATE()) BETWEEN 1 AND 5 THEN 1 ELSE 0 END) as due_soon_count,
          SUM(total_amount) as total_pending_amount,
          SUM(CASE WHEN DATEDIFF(due_date, CURDATE()) <= 0 THEN total_amount + COALESCE(late_surcharge, 0) ELSE 0 END) as overdue_amount
        FROM utility_bills 
        WHERE status != 'paid'
      `);

      const [upcomingBills] = await db.query(`
        SELECT id, bill_type, due_date, total_amount, late_surcharge, 
               DATEDIFF(due_date, CURDATE()) as days_until_due
        FROM utility_bills 
        WHERE status != 'paid' 
        AND DATEDIFF(due_date, CURDATE()) <= 7
        ORDER BY due_date ASC
        LIMIT 5
      `);

      res.json({
        summary: pending[0],
        upcoming_bills: upcomingBills.map(bill => ({
          ...bill,
          notification_type: UtilityController.getNotificationType(bill.days_until_due, 'pending')
        }))
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Dismiss a notification
   */
  static async dismissNotification(req, res) {
    try {
      const { id } = req.params;
      await db.query('UPDATE notifications SET is_dismissed = TRUE WHERE id = ?', [id]);
      res.json({ message: 'Notification dismissed' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Determine notification type based on days until due
   */
  static getNotificationType(daysUntilDue, status) {
    if (status === 'paid') return 'success';
    if (daysUntilDue <= 0) return 'overdue';
    if (daysUntilDue <= 5) return 'warning';
    return 'info';
  }

  /**
   * Create notification for new bill
   */
  static async createBillNotification(billId, billType, dueDate, amount) {
    const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    let type, title, message, severity;
    
    if (daysUntilDue <= 0) {
      type = 'utility_overdue';
      title = `OVERDUE: ${billType.toUpperCase()} Bill`;
      message = `Your ${billType} bill of Rs. ${amount} is overdue! Late payment charges may apply.`;
      severity = 'urgent';
    } else if (daysUntilDue <= 5) {
      type = 'utility_due';
      title = `${billType.toUpperCase()} Bill Due Soon`;
      message = `Your ${billType} bill of Rs. ${amount} is due in ${daysUntilDue} day(s).`;
      severity = 'warning';
    } else {
      type = 'utility_due';
      title = `New ${billType.toUpperCase()} Bill`;
      message = `${billType} bill of Rs. ${amount} due on ${dueDate}.`;
      severity = 'info';
    }

    await db.query(
      `INSERT INTO notifications (type, title, message, reference_id, reference_type, severity) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [type, title, message, billId, 'utility_bill', severity]
    );
  }

  /**
   * Update notification when bill is modified
   */
  static async updateBillNotification(billId, dueDate, amount) {
    // Remove old notifications
    await db.query(
      'DELETE FROM notifications WHERE reference_id = ? AND reference_type = ? AND type != ?',
      [billId, 'utility_bill', 'utility_paid']
    );
    
    // Get bill type
    const [bills] = await db.query('SELECT bill_type FROM utility_bills WHERE id = ?', [billId]);
    if (bills.length > 0) {
      await UtilityController.createBillNotification(billId, bills[0].bill_type, dueDate, amount);
    }
  }

  /**
   * Update status of overdue bills
   */
  static async updateOverdueBills() {
    // Mark bills as overdue if past due date
    await db.query(`
      UPDATE utility_bills 
      SET status = 'overdue' 
      WHERE status = 'pending' 
      AND due_date < CURDATE()
    `);

    // Update notifications for newly overdue bills
    const [overdueBills] = await db.query(`
      SELECT id, bill_type, total_amount, late_surcharge 
      FROM utility_bills 
      WHERE status = 'overdue'
      AND id NOT IN (
        SELECT reference_id FROM notifications 
        WHERE reference_type = 'utility_bill' AND type = 'utility_overdue' AND is_dismissed = FALSE
      )
    `);

    for (const bill of overdueBills) {
      await db.query(
        `INSERT INTO notifications (type, title, message, reference_id, reference_type, severity) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'utility_overdue',
          `OVERDUE: ${bill.bill_type.toUpperCase()} Bill`,
          `Your ${bill.bill_type} bill of Rs. ${bill.total_amount} is overdue! Late surcharge: Rs. ${bill.late_surcharge || 0}`,
          bill.id,
          'utility_bill',
          'urgent'
        ]
      );
    }
  }

  // ==================== SUMMARY REPORTS ====================

  /**
   * Get monthly utility summary
   */
  static async getMonthlySummary(req, res) {
    try {
      const { month } = req.query;

      const [summary] = await db.query(`
        SELECT 
          bill_type,
          SUM(total_amount) as total_amount,
          COUNT(*) as bill_count,
          SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid_amount,
          SUM(CASE WHEN status != 'paid' THEN total_amount ELSE 0 END) as unpaid_amount
        FROM utility_bills 
        WHERE billing_month LIKE ?
        GROUP BY bill_type
      `, [`%${month || ''}%`]);

      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get yearly utility summary
   */
  static async getYearlySummary(req, res) {
    try {
      const [summary] = await db.query(`
        SELECT 
          billing_month,
          bill_type,
          SUM(total_amount) as total_amount,
          COUNT(*) as bill_count
        FROM utility_bills 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY billing_month, bill_type
        ORDER BY billing_month DESC
      `);

      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get total utility expense
   */
  static async getTotalExpense(req, res) {
    try {
      const { date_from, date_to } = req.query;

      let query = 'SELECT SUM(total_amount) as total_expense FROM utility_bills WHERE status = "paid"';
      const params = [];

      if (date_from) {
        query += ' AND due_date >= ?';
        params.push(date_from);
      }
      if (date_to) {
        query += ' AND due_date <= ?';
        params.push(date_to);
      }

      const [result] = await db.query(query, params);
      res.json({ total_utility_expense: result[0].total_expense || 0 });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get pending payments
   */
  static async getPendingPayments(req, res) {
    try {
      const [pending] = await db.query(`
        SELECT *, DATEDIFF(due_date, CURDATE()) as days_until_due
        FROM utility_bills 
        WHERE status IN ('pending', 'overdue') 
        ORDER BY due_date ASC
      `);

      res.json(pending.map(bill => ({
        ...bill,
        notification_type: UtilityController.getNotificationType(bill.days_until_due, bill.status)
      })));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = UtilityController;
