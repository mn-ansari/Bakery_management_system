const db = require('../config/database');

class SalesController {
  // ===== SIMPLIFIED SALES TRACKING (Buyer + Amount Model) =====
  
  static async createSale(req, res) {
    try {
      const { buyer_name, amount, payment_status, sale_date, notes } = req.body;
      const userId = req.user?.id;

      if (!buyer_name || !amount) {
        return res.status(400).json({ message: 'Buyer name and amount are required' });
      }

      const [result] = await db.query(
        `INSERT INTO sales (buyer_name, amount, payment_status, sale_date, notes, created_by, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [buyer_name, parseFloat(amount), payment_status || 'Pending', sale_date || new Date().toISOString().split('T')[0], notes || '', userId]
      );

      res.status(201).json({
        message: 'Sale recorded successfully',
        sale_id: result.insertId
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getSalesByDate(req, res) {
    try {
      const { date } = req.params;

      const [sales] = await db.query(
        `SELECT 
          sale_id, buyer_name, amount, payment_status, 
          sale_date, notes, created_at
        FROM sales 
        WHERE DATE(sale_date) = ?
        ORDER BY created_at DESC`,
        [date]
      );

      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async deleteSale(req, res) {
    try {
      const { id } = req.params;

      const [result] = await db.query(
        'DELETE FROM sales WHERE sale_id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Sale not found' });
      }

      res.json({ message: 'Sale deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // ===== ORIGINAL SALES REPORTING METHODS =====

  static async getDailySales(req, res) {
    try {
      const { date } = req.query;

      const [sales] = await db.query(`
        SELECT 
          sale_id, buyer_name, amount, payment_status, 
          sale_date, notes, created_at
        FROM sales 
        WHERE DATE(sale_date) = ?
        ORDER BY created_at DESC
      `, [date || new Date().toISOString().split('T')[0]]);

      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getSalesReport(req, res) {
    try {
      const { date_from, date_to, payment_status } = req.query;

      let query = `
        SELECT 
          sale_id, buyer_name, amount, payment_status, 
          sale_date, notes, created_at
        FROM sales 
        WHERE 1=1
      `;
      const params = [];

      if (date_from) {
        query += ' AND sale_date >= ?';
        params.push(date_from);
      }

      if (date_to) {
        query += ' AND sale_date <= ?';
        params.push(date_to);
      }

      if (payment_status) {
        query += ' AND payment_status = ?';
        params.push(payment_status);
      }

      query += ' ORDER BY sale_date DESC';

      const [sales] = await db.query(query, params);

      // Calculate summary
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_sales,
          SUM(amount) as total_amount,
          SUM(CASE WHEN payment_status = 'Clear' THEN amount ELSE 0 END) as clear_amount,
          SUM(CASE WHEN payment_status = 'Credit' THEN amount ELSE 0 END) as credit_amount
        FROM sales 
        WHERE 1=1
      ` + (date_from ? ` AND sale_date >= ?` : '') 
        + (date_to ? ` AND sale_date <= ?` : '') 
        + (payment_status ? ` AND payment_status = ?` : '');

      const [summary] = await db.query(summaryQuery, params);

      res.json({
        sales,
        summary: summary[0]
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getWeeklySales(req, res) {
    try {
      const [sales] = await db.query(`
        SELECT 
          DATE(sale_date) as date,
          COUNT(*) as transaction_count,
          SUM(amount) as daily_total
        FROM sales 
        WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(sale_date)
        ORDER BY sale_date DESC
      `);

      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getMonthlySales(req, res) {
    try {
      const [sales] = await db.query(`
        SELECT 
          DATE_FORMAT(sale_date, '%Y-%m') as month,
          COUNT(*) as transaction_count,
          SUM(amount) as monthly_total
        FROM sales 
        WHERE sale_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(sale_date, '%Y-%m')
        ORDER BY month DESC
      `);

      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getProductWiseSales(req, res) {
    try {
      // This would be a custom report - for now return total sales grouped by payment status
      const [sales] = await db.query(`
        SELECT 
          payment_status,
          COUNT(*) as total_transactions,
          SUM(amount) as total_amount
        FROM sales 
        GROUP BY payment_status
      `);

      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = SalesController;

