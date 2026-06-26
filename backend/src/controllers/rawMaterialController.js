const db = require('../config/database');

class RawMaterialController {
  static async getAllRawMaterials(req, res) {
    try {
      const [materials] = await db.query(`
        SELECT rm.*, s.name as supplier_name 
        FROM raw_materials rm 
        LEFT JOIN suppliers s ON rm.supplier_id = s.id 
        ORDER BY rm.name
      `);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async createRawMaterial(req, res) {
    try {
      const { name, unit, supplier_id, purchase_price, minimum_stock, warehouse_location } = req.body;

      const [result] = await db.query(
        'INSERT INTO raw_materials (name, unit, supplier_id, purchase_price, minimum_stock, warehouse_location) VALUES (?, ?, ?, ?, ?, ?)',
        [name, unit, supplier_id, purchase_price, minimum_stock, warehouse_location]
      );

      res.status(201).json({ 
        message: 'Raw material created',
        id: result.insertId 
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getRawMaterialById(req, res) {
    try {
      const { id } = req.params;
      const [materials] = await db.query(
        'SELECT rm.*, s.name as supplier_name FROM raw_materials rm LEFT JOIN suppliers s ON rm.supplier_id = s.id WHERE rm.id = ?',
        [id]
      );

      if (materials.length === 0) {
        return res.status(404).json({ message: 'Raw material not found' });
      }

      res.json(materials[0]);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateRawMaterial(req, res) {
    try {
      const { id } = req.params;
      const { name, unit, supplier_id, purchase_price, minimum_stock, warehouse_location } = req.body;

      await db.query(
        'UPDATE raw_materials SET name = ?, unit = ?, supplier_id = ?, purchase_price = ?, minimum_stock = ?, warehouse_location = ?, updated_at = NOW() WHERE id = ?',
        [name, unit, supplier_id, purchase_price, minimum_stock, warehouse_location, id]
      );

      res.json({ message: 'Raw material updated' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getLowStockAlerts(req, res) {
    try {
      const [alerts] = await db.query(`
        SELECT * FROM raw_materials 
        WHERE current_stock <= minimum_stock 
        ORDER BY current_stock ASC
      `);

      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getBatchHistory(req, res) {
    try {
      const { id } = req.params;
      const [batches] = await db.query(`
        SELECT * FROM raw_batches 
        WHERE raw_material_id = ? 
        ORDER BY purchase_date DESC
      `, [id]);

      res.json(batches);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = RawMaterialController;
