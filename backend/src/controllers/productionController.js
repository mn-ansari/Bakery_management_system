const db = require('../config/database');

class ProductionController {
  static async createProduction(req, res) {
    try {
      const { product_id, production_date, quantity_produced, machine_used, notes, produced_by, raw_materials_used } = req.body;

      // Generate batch ID
      const batchId = `PROD-${Date.now()}`;

      // Calculate production cost
      let productionCost = 0;
      if (raw_materials_used && Array.isArray(raw_materials_used)) {
        for (const material of raw_materials_used) {
          productionCost += material.quantity * material.unitPrice;
        }
      }

      // Create production log
      const [result] = await db.query(
        'INSERT INTO production_logs (batch_id, product_id, production_date, quantity_produced, machine_used, production_cost, produced_by, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [batchId, product_id, production_date, quantity_produced, machine_used, productionCost, produced_by, notes]
      );

      const productionLogId = result.insertId;

      // Record raw material usage
      if (raw_materials_used && Array.isArray(raw_materials_used)) {
        for (const material of raw_materials_used) {
          // Find the appropriate batch using FIFO
          const [batches] = await db.query(
            'SELECT * FROM raw_batches WHERE raw_material_id = ? AND remaining_stock > 0 ORDER BY purchase_date ASC LIMIT 1',
            [material.raw_material_id]
          );

          if (batches.length > 0) {
            const batch = batches[0];
            const costOfMaterial = material.quantity * material.unitPrice;

            // Record usage
            await db.query(
              'INSERT INTO raw_material_usage (production_log_id, raw_batch_id, quantity_used, unit, cost) VALUES (?, ?, ?, ?, ?)',
              [productionLogId, batch.id, material.quantity, material.unit, costOfMaterial]
            );

            // Update batch remaining stock
            await db.query(
              'UPDATE raw_batches SET remaining_stock = remaining_stock - ?, updated_at = NOW() WHERE id = ?',
              [material.quantity, batch.id]
            );

            // Update raw material current stock
            await db.query(
              'UPDATE raw_materials SET current_stock = current_stock - ?, updated_at = NOW() WHERE id = ?',
              [material.quantity, material.raw_material_id]
            );
          }
        }
      }

      // Create product batch
      const [productBatch] = await db.query(
        'INSERT INTO product_batches (batch_id, product_id, quantity_produced, remaining_stock, production_date, production_cost) VALUES (?, ?, ?, ?, ?, ?)',
        [batchId, product_id, quantity_produced, quantity_produced, production_date, productionCost]
      );

      res.status(201).json({ 
        message: 'Production logged successfully',
        batchId,
        productionLogId,
        productionCost
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getProductionLogs(req, res) {
    try {
      const { product_id, date_from, date_to } = req.query;

      let query = 'SELECT pl.*, p.name as product_name, u.full_name as produced_by_name FROM production_logs pl JOIN products p ON pl.product_id = p.id LEFT JOIN users u ON pl.produced_by = u.id WHERE 1=1';
      const params = [];

      if (product_id) {
        query += ' AND pl.product_id = ?';
        params.push(product_id);
      }

      if (date_from) {
        query += ' AND pl.production_date >= ?';
        params.push(date_from);
      }

      if (date_to) {
        query += ' AND pl.production_date <= ?';
        params.push(date_to);
      }

      query += ' ORDER BY pl.production_date DESC';

      const [logs] = await db.query(query, params);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getProductionById(req, res) {
    try {
      const { id } = req.params;

      const [logs] = await db.query(
        'SELECT pl.*, p.name as product_name, u.full_name as produced_by_name FROM production_logs pl JOIN products p ON pl.product_id = p.id LEFT JOIN users u ON pl.produced_by = u.id WHERE pl.id = ?',
        [id]
      );

      if (logs.length === 0) {
        return res.status(404).json({ message: 'Production log not found' });
      }

      // Get raw materials used
      const [usage] = await db.query(
        'SELECT rmu.*, rb.batch_id, rm.name as material_name FROM raw_material_usage rmu JOIN raw_batches rb ON rmu.raw_batch_id = rb.id JOIN raw_materials rm ON rb.raw_material_id = rm.id WHERE rmu.production_log_id = ?',
        [id]
      );

      res.json({ ...logs[0], raw_materials_used: usage });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getDailyProductionSummary(req, res) {
    try {
      const { date } = req.query;

      const [summary] = await db.query(`
        SELECT 
          p.name as product_name,
          p.id as product_id,
          COUNT(pl.id) as production_count,
          SUM(pl.quantity_produced) as total_quantity,
          SUM(pl.production_cost) as total_cost
        FROM production_logs pl 
        JOIN products p ON pl.product_id = p.id 
        WHERE pl.production_date = ?
        GROUP BY p.id, p.name
      `, [date || new Date().toISOString().split('T')[0]]);

      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = ProductionController;
