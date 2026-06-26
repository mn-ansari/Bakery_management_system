const db = require('../config/database');

class BatchController {
  static async getProductBatches(req, res) {
    try {
      const [batches] = await db.query(`
        SELECT
          pb.batch_id as batch_number,
          pb.bill_id,
          pb.product_id,
          p.name as product_name,
          pb.quantity_produced as quantity,
          pb.cost_per_unit as unit_price,
          pb.production_date as manufacturing_date,
          pb.expiry_date,
          pb.remaining_stock,
          CASE
            WHEN pb.remaining_stock > 0 THEN 'In Stock'
            ELSE 'Depleted'
          END as status
        FROM product_batches pb
        JOIN products p ON pb.product_id = p.id
        ORDER BY pb.production_date DESC
      `);

      res.json(batches);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getRawMaterialBatches(req, res) {
    try {
      const [batches] = await db.query(`
        SELECT
          rb.batch_id as batch_number,
          rb.bill_id,
          rb.raw_material_id,
          rm.name as material_name,
          rb.quantity,
          rb.purchase_price as unit_price,
          rb.purchase_date as received_date,
          rb.expiry_date,
          s.name as supplier_name,
          rb.remaining_stock,
          CASE
            WHEN rb.remaining_stock > 0 THEN 'In Stock'
            ELSE 'Depleted'
          END as status
        FROM raw_batches rb
        JOIN raw_materials rm ON rb.raw_material_id = rm.id
        LEFT JOIN suppliers s ON rb.supplier_id = s.id
        ORDER BY rb.purchase_date DESC
      `);

      res.json(batches);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getProductBatchesByProductId(req, res) {
    try {
      const { productId } = req.params;
      const [batches] = await db.query(`
        SELECT
          pb.batch_id as batch_number,
          pb.product_id,
          p.name as product_name,
          pb.quantity_produced as quantity,
          pb.cost_per_unit as unit_price,
          pb.production_date as manufacturing_date,
          pb.expiry_date,
          pb.remaining_stock,
          CASE
            WHEN pb.remaining_stock > 0 THEN 'In Stock'
            ELSE 'Depleted'
          END as status
        FROM product_batches pb
        JOIN products p ON pb.product_id = p.id
        WHERE pb.product_id = ?
        ORDER BY pb.production_date DESC
      `, [productId]);

      res.json(batches);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getRawMaterialBatchesByMaterialId(req, res) {
    try {
      const { materialId } = req.params;
      const [batches] = await db.query(`
        SELECT
          rb.batch_id as batch_number,
          rb.raw_material_id,
          rm.name as material_name,
          rb.quantity,
          rb.purchase_price as unit_price,
          rb.purchase_date as received_date,
          rb.expiry_date,
          s.name as supplier_name,
          rb.remaining_stock,
          CASE
            WHEN rb.remaining_stock > 0 THEN 'In Stock'
            ELSE 'Depleted'
          END as status
        FROM raw_batches rb
        JOIN raw_materials rm ON rb.raw_material_id = rm.id
        LEFT JOIN suppliers s ON rb.supplier_id = s.id
        WHERE rb.raw_material_id = ?
        ORDER BY rb.purchase_date DESC
      `, [materialId]);

      res.json(batches);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async createRawBatch(req, res) {
    try {
      const { raw_material_id, batch_number, quantity, unit, purchase_price, purchase_date, expiry_date, supplier_id, warehouse_location, bill_id } = req.body;

      // Batch number is required - no auto-generation
      if (!batch_number) {
        return res.status(400).json({ message: 'Batch number is required' });
      }

      const [result] = await db.query(
        'INSERT INTO raw_batches (batch_id, raw_material_id, quantity, unit, purchase_price, purchase_date, expiry_date, supplier_id, warehouse_location, remaining_stock, bill_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [batch_number, raw_material_id, quantity, unit, purchase_price, purchase_date, expiry_date, supplier_id, warehouse_location, quantity, bill_id]
      );

      // Update raw material stock
      await db.query(
        'UPDATE raw_materials SET current_stock = current_stock + ?, updated_at = NOW() WHERE id = ?',
        [quantity, raw_material_id]
      );

      res.status(201).json({ 
        message: 'Batch created',
        batchId: batch_number,
        id: result.insertId 
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async createProductBatch(req, res) {
    try {
      const { product_id, batch_number, quantity_produced, production_date, expiry_date, production_location, cost_per_unit, selling_price, production_cost, bill_id } = req.body;

      // Batch number is required - no auto-generation
      if (!batch_number) {
        return res.status(400).json({ message: 'Batch number is required' });
      }

      const [result] = await db.query(
        'INSERT INTO product_batches (batch_id, product_id, quantity_produced, remaining_stock, production_date, expiry_date, production_location, cost_per_unit, selling_price, production_cost, bill_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [batch_number, product_id, quantity_produced, quantity_produced, production_date, expiry_date, production_location, cost_per_unit, selling_price, production_cost, bill_id]
      );

      res.status(201).json({ 
        message: 'Product batch created',
        batchId: batch_number,
        id: result.insertId 
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getExpiringBatches(req, res) {
    try {
      const days = req.query.days || 7;
      
      const [batches] = await db.query(`
        SELECT 'raw' as type, rb.*, rm.name as material_name 
        FROM raw_batches rb 
        JOIN raw_materials rm ON rb.raw_material_id = rm.id 
        WHERE expiry_date IS NOT NULL AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY) AND remaining_stock > 0
        UNION ALL
        SELECT 'product' as type, pb.*, p.name as product_name 
        FROM product_batches pb 
        JOIN products p ON pb.product_id = p.id 
        WHERE expiry_date IS NOT NULL AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY) AND remaining_stock > 0
        ORDER BY expiry_date ASC
      `, [days, days]);

      res.json(batches);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getBatchDetails(req, res) {
    try {
      const { batchId } = req.params;

      // Try to find in raw_batches
      const [rawBatches] = await db.query('SELECT * FROM raw_batches WHERE batch_id = ?', [batchId]);
      
      if (rawBatches.length > 0) {
        return res.json({ type: 'raw', data: rawBatches[0] });
      }

      // Try to find in product_batches
      const [productBatches] = await db.query('SELECT * FROM product_batches WHERE batch_id = ?', [batchId]);
      
      if (productBatches.length > 0) {
        return res.json({ type: 'product', data: productBatches[0] });
      }

      res.status(404).json({ message: 'Batch not found' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getBatchSalesHistory(req, res) {
    try {
      const { batchId } = req.params;

      const [sales] = await db.query(`
        SELECT s.*, p.name as product_name 
        FROM sales s 
        JOIN products p ON s.product_id = p.id 
        WHERE s.batch_id = ? 
        ORDER BY s.sale_date DESC
      `, [batchId]);

      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async calculateBatchProfit(req, res) {
    try {
      const { batchId } = req.params;

      // Get product batch info
      const [batches] = await db.query('SELECT * FROM product_batches WHERE batch_id = ?', [batchId]);
      
      if (batches.length === 0) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      const batch = batches[0];

      // Get sales for this batch
      const [sales] = await db.query('SELECT SUM(total_amount) as total_revenue FROM sales WHERE batch_id = ?', [batchId]);

      const totalRevenue = sales[0].total_revenue || 0;
      const totalCost = batch.production_cost || 0;
      const profit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0;

      res.json({
        batchId,
        totalCost,
        totalRevenue,
        profit,
        profitMargin: `${profitMargin}%`,
        quantityProduced: batch.quantity_produced,
        remainingStock: batch.remaining_stock
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getProductInventorySummary(req, res) {
    try {
      const [results] = await db.query(`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.category,
          COUNT(pb.id) as total_batches,
          COALESCE(SUM(pb.remaining_stock), 0) as total_quantity,
          AVG(pb.cost_per_unit) as avg_price,
          COALESCE(SUM(pb.remaining_stock * pb.cost_per_unit), 0) as total_value
        FROM products p
        LEFT JOIN product_batches pb ON p.id = pb.product_id
        GROUP BY p.id, p.name, p.category
        ORDER BY p.name
      `);

      res.json(results);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getRawMaterialInventorySummary(req, res) {
    try {
      const [results] = await db.query(`
        SELECT 
          rm.id as raw_material_id,
          rm.name as material_name,
          rm.unit,
          COUNT(rb.id) as total_batches,
          COALESCE(SUM(rb.remaining_stock), 0) as total_quantity,
          AVG(rb.purchase_price) as avg_price,
          COALESCE(SUM(rb.remaining_stock * rb.purchase_price), 0) as total_value
        FROM raw_materials rm
        LEFT JOIN raw_batches rb ON rm.id = rb.raw_material_id
        GROUP BY rm.id, rm.name, rm.unit
        ORDER BY rm.name
      `);

      res.json(results);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateBatchPayment(req, res) {
    try {
      const { batch_id, batch_type, paid_amount, payment_date, payment_status, notes } = req.body;

      if (!batch_id || batch_type === undefined || !paid_amount || !payment_status) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const table = batch_type === 'raw' ? 'raw_batches' : 'product_batches';
      const column = batch_type === 'raw' ? 'batch_id' : 'batch_id';

      // Update the batch with payment information
      const query = `UPDATE ${table} SET 
        paid_amount = paid_amount + ?,
        payment_status = ?,
        payment_date = ?,
        notes = ?,
        updated_at = NOW()
        WHERE ${column} = ?`;

      await db.query(query, [
        parseFloat(paid_amount),
        payment_status,
        payment_date || new Date().toISOString().split('T')[0],
        notes || '',
        batch_id
      ]);

      res.json({ message: 'Payment recorded successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // ===== BILL-BASED PAYMENT METHODS =====

  // Get all bills with their payment status
  static async getAllBills(req, res) {
    try {
      const { status } = req.query;

      // Get raw material bills grouped by bill_id
      let rawBillsQuery = `
        SELECT 
          rb.bill_id,
          'raw_material' as bill_type,
          MIN(rb.purchase_date) as bill_date,
          COUNT(*) as item_count,
          SUM(rb.quantity * rb.purchase_price) as total_amount,
          SUM(COALESCE(rb.paid_amount, 0)) as paid_amount,
          SUM(rb.quantity * rb.purchase_price) - SUM(COALESCE(rb.paid_amount, 0)) as remaining_amount,
          CASE 
            WHEN SUM(COALESCE(rb.paid_amount, 0)) >= SUM(rb.quantity * rb.purchase_price) THEN 'Paid'
            WHEN SUM(COALESCE(rb.paid_amount, 0)) > 0 THEN 'Partial'
            ELSE 'Pending'
          END as payment_status,
          MAX(rb.payment_date) as last_payment_date,
          GROUP_CONCAT(DISTINCT s.name SEPARATOR ', ') as supplier_names
        FROM raw_batches rb
        LEFT JOIN suppliers s ON rb.supplier_id = s.id
        WHERE rb.bill_id IS NOT NULL AND rb.bill_id != ''
        GROUP BY rb.bill_id
      `;

      // Get product bills grouped by bill_id
      let productBillsQuery = `
        SELECT 
          pb.bill_id,
          'product' as bill_type,
          MIN(pb.production_date) as bill_date,
          COUNT(*) as item_count,
          SUM(pb.quantity_produced * pb.cost_per_unit) as total_amount,
          SUM(COALESCE(pb.paid_amount, 0)) as paid_amount,
          SUM(pb.quantity_produced * pb.cost_per_unit) - SUM(COALESCE(pb.paid_amount, 0)) as remaining_amount,
          CASE 
            WHEN SUM(COALESCE(pb.paid_amount, 0)) >= SUM(pb.quantity_produced * pb.cost_per_unit) THEN 'Paid'
            WHEN SUM(COALESCE(pb.paid_amount, 0)) > 0 THEN 'Partial'
            ELSE 'Pending'
          END as payment_status,
          MAX(pb.payment_date) as last_payment_date,
          NULL as supplier_names
        FROM product_batches pb
        WHERE pb.bill_id IS NOT NULL AND pb.bill_id != ''
        GROUP BY pb.bill_id
      `;

      const [rawBills] = await db.query(rawBillsQuery);
      const [productBills] = await db.query(productBillsQuery);

      // Combine and filter by status if provided
      let allBills = [...rawBills, ...productBills];

      if (status && status !== 'all') {
        allBills = allBills.filter(bill => bill.payment_status === status);
      }

      // Sort by bill_date descending
      allBills.sort((a, b) => new Date(b.bill_date) - new Date(a.bill_date));

      res.json(allBills);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get bill details with all items
  static async getBillDetails(req, res) {
    try {
      const { billId } = req.params;

      // Get raw material items for this bill
      const [rawItems] = await db.query(`
        SELECT 
          rb.id,
          rb.batch_id as batch_number,
          rb.bill_id,
          'raw_material' as item_type,
          rm.name as item_name,
          rb.quantity,
          rm.unit,
          rb.purchase_price as unit_price,
          (rb.quantity * rb.purchase_price) as total_value,
          rb.purchase_date as entry_date,
          rb.expiry_date,
          s.name as supplier_name,
          rb.warehouse_location,
          COALESCE(rb.paid_amount, 0) as paid_amount,
          rb.payment_status,
          rb.payment_date
        FROM raw_batches rb
        JOIN raw_materials rm ON rb.raw_material_id = rm.id
        LEFT JOIN suppliers s ON rb.supplier_id = s.id
        WHERE rb.bill_id = ?
        ORDER BY rb.purchase_date DESC
      `, [billId]);

      // Get product items for this bill
      const [productItems] = await db.query(`
        SELECT 
          pb.id,
          pb.batch_id as batch_number,
          pb.bill_id,
          'product' as item_type,
          p.name as item_name,
          pb.quantity_produced as quantity,
          'pcs' as unit,
          pb.cost_per_unit as unit_price,
          (pb.quantity_produced * pb.cost_per_unit) as total_value,
          pb.production_date as entry_date,
          pb.expiry_date,
          NULL as supplier_name,
          pb.production_location as warehouse_location,
          COALESCE(pb.paid_amount, 0) as paid_amount,
          pb.payment_status,
          pb.payment_date
        FROM product_batches pb
        JOIN products p ON pb.product_id = p.id
        WHERE pb.bill_id = ?
        ORDER BY pb.production_date DESC
      `, [billId]);

      const items = [...rawItems, ...productItems];

      if (items.length === 0) {
        return res.status(404).json({ message: 'Bill not found' });
      }

      // Calculate bill summary
      const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.total_value || 0), 0);
      const paidAmount = items.reduce((sum, item) => sum + parseFloat(item.paid_amount || 0), 0);
      const remainingAmount = totalAmount - paidAmount;

      const billSummary = {
        bill_id: billId,
        item_count: items.length,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        payment_status: paidAmount >= totalAmount ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Pending'),
        supplier_names: [...new Set(items.filter(i => i.supplier_name).map(i => i.supplier_name))].join(', ') || 'N/A',
        bill_date: items[0]?.entry_date,
        items: items
      };

      res.json(billSummary);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Update payment for a bill (updates all items in the bill)
  static async updateBillPayment(req, res) {
    try {
      const { bill_id, paid_amount, payment_date, payment_status, payment_method, reference_number, notes } = req.body;

      if (!bill_id || paid_amount === undefined) {
        return res.status(400).json({ message: 'Bill ID and payment amount are required' });
      }

      const paymentDateValue = payment_date || new Date().toISOString().split('T')[0];
      const paidAmountValue = parseFloat(paid_amount);

      // Get all items in this bill
      const [rawItems] = await db.query(
        'SELECT id, batch_id, quantity * purchase_price as total_value, COALESCE(paid_amount, 0) as paid_amount FROM raw_batches WHERE bill_id = ?',
        [bill_id]
      );

      const [productItems] = await db.query(
        'SELECT id, batch_id, quantity_produced * cost_per_unit as total_value, COALESCE(paid_amount, 0) as paid_amount FROM product_batches WHERE bill_id = ?',
        [bill_id]
      );

      const allItems = [
        ...rawItems.map(i => ({ ...i, type: 'raw' })),
        ...productItems.map(i => ({ ...i, type: 'product' }))
      ];

      if (allItems.length === 0) {
        return res.status(404).json({ message: 'Bill not found' });
      }

      // Calculate total bill value
      const totalBillValue = allItems.reduce((sum, item) => sum + parseFloat(item.total_value || 0), 0);
      const currentPaid = allItems.reduce((sum, item) => sum + parseFloat(item.paid_amount || 0), 0);
      const newTotalPaid = currentPaid + paidAmountValue;

      // Distribute payment proportionally across items
      let remainingPayment = paidAmountValue;
      for (const item of allItems) {
        const itemRemaining = parseFloat(item.total_value) - parseFloat(item.paid_amount);
        if (itemRemaining <= 0) continue;

        const itemPayment = Math.min(remainingPayment, itemRemaining);
        const newItemStatus = (parseFloat(item.paid_amount) + itemPayment >= parseFloat(item.total_value)) 
          ? 'Clear' 
          : (parseFloat(item.paid_amount) + itemPayment > 0 ? 'Credit' : 'Pending');

        const table = item.type === 'raw' ? 'raw_batches' : 'product_batches';
        await db.query(
          `UPDATE ${table} SET 
            paid_amount = paid_amount + ?,
            payment_status = ?,
            payment_date = ?,
            payment_notes = ?,
            updated_at = NOW()
          WHERE id = ?`,
          [itemPayment, newItemStatus, paymentDateValue, notes || '', item.id]
        );

        remainingPayment -= itemPayment;
        if (remainingPayment <= 0) break;
      }

      // Record payment history
      try {
        await db.query(
          `INSERT INTO bill_payment_history (bill_payment_id, bill_id, amount_paid, payment_date, payment_method, reference_number, notes) 
           VALUES (0, ?, ?, ?, ?, ?, ?)`,
          [bill_id, paidAmountValue, paymentDateValue, payment_method || 'Cash', reference_number || '', notes || '']
        );
      } catch (historyError) {
        // Table might not exist yet, ignore this error
        console.log('Payment history not recorded (table may not exist):', historyError.message);
      }

      const finalStatus = newTotalPaid >= totalBillValue ? 'Paid' : (newTotalPaid > 0 ? 'Partial' : 'Pending');

      res.json({ 
        message: 'Payment recorded successfully',
        bill_id,
        total_amount: totalBillValue,
        total_paid: newTotalPaid,
        remaining: totalBillValue - newTotalPaid,
        status: finalStatus
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Get payment history for a bill
  static async getBillPaymentHistory(req, res) {
    try {
      const { billId } = req.params;

      const [history] = await db.query(`
        SELECT * FROM bill_payment_history 
        WHERE bill_id = ? 
        ORDER BY payment_date DESC, created_at DESC
      `, [billId]);

      res.json(history);
    } catch (error) {
      // If table doesn't exist, return empty array
      res.json([]);
    }
  }

  // Get payment summary/stats
  static async getPaymentStats(req, res) {
    try {
      // Get raw material totals
      const [rawStats] = await db.query(`
        SELECT 
          COUNT(DISTINCT bill_id) as total_bills,
          SUM(quantity * purchase_price) as total_amount,
          SUM(COALESCE(paid_amount, 0)) as total_paid
        FROM raw_batches
        WHERE bill_id IS NOT NULL AND bill_id != ''
      `);

      // Get product totals
      const [productStats] = await db.query(`
        SELECT 
          COUNT(DISTINCT bill_id) as total_bills,
          SUM(quantity_produced * cost_per_unit) as total_amount,
          SUM(COALESCE(paid_amount, 0)) as total_paid
        FROM product_batches
        WHERE bill_id IS NOT NULL AND bill_id != ''
      `);

      const totalAmount = parseFloat(rawStats[0]?.total_amount || 0) + parseFloat(productStats[0]?.total_amount || 0);
      const totalPaid = parseFloat(rawStats[0]?.total_paid || 0) + parseFloat(productStats[0]?.total_paid || 0);
      const totalBills = parseInt(rawStats[0]?.total_bills || 0) + parseInt(productStats[0]?.total_bills || 0);

      res.json({
        total_bills: totalBills,
        total_amount: totalAmount,
        total_paid: totalPaid,
        total_pending: totalAmount - totalPaid,
        raw_material_amount: parseFloat(rawStats[0]?.total_amount || 0),
        product_amount: parseFloat(productStats[0]?.total_amount || 0)
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = BatchController;

