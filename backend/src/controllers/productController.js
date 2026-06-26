const db = require('../config/database');

class ProductController {
  static async getAllProducts(req, res) {
    try {
      // Get readymade products
      const [products] = await db.query(`
        SELECT 
          p.id as product_id,
          p.name,
          p.category,
          'readymade' as type,
          'pieces' as unit,
          p.selling_price as base_price,
          '' as description,
          p.created_at,
          COUNT(pb.id) as batch_count, 
          SUM(pb.remaining_stock) as total_stock
        FROM products p 
        LEFT JOIN product_batches pb ON p.id = pb.product_id 
        GROUP BY p.id
        ORDER BY p.name
      `);

      // Get raw materials
      const [rawMaterials] = await db.query(`
        SELECT 
          rm.id as raw_material_id,
          rm.name,
          'Raw Material' as category,
          'raw' as type,
          rm.unit,
          rm.purchase_price as base_price,
          '' as description,
          rm.minimum_stock as reorder_level,
          rm.created_at,
          COUNT(rb.id) as batch_count,
          SUM(rb.remaining_stock) as total_stock
        FROM raw_materials rm
        LEFT JOIN raw_batches rb ON rm.id = rb.raw_material_id
        GROUP BY rm.id
        ORDER BY rm.name
      `);

      // Combine both arrays
      const allProducts = [...products, ...rawMaterials];

      res.json(allProducts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async createProduct(req, res) {
    try {
      const { name, category, type, unit, base_price, description } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ message: 'Product name is required' });
      }

      // If type is 'raw', insert into raw_materials table
      if (type === 'raw') {
        if (!unit) {
          return res.status(400).json({ message: 'Unit is required for raw materials' });
        }

        const [result] = await db.query(
          'INSERT INTO raw_materials (name, unit, purchase_price, minimum_stock) VALUES (?, ?, ?, ?)',
          [name, unit || 'kg', parseFloat(base_price) || 0, 10]
        );
        
        return res.status(201).json({ 
          message: 'Raw material created',
          id: result.insertId,
          raw_material_id: result.insertId
        });
      }

      // Otherwise, insert into products table for readymade products
      if (!category) {
        return res.status(400).json({ message: 'Category is required for products' });
      }

      const [result] = await db.query(
        'INSERT INTO products (name, category, type, cost_per_unit, selling_price) VALUES (?, ?, ?, ?, ?)',
        [name, category, 'manufactured', parseFloat(base_price) || 0, parseFloat(base_price) || 0]
      );

      res.status(201).json({ 
        message: 'Product created',
        id: result.insertId,
        product_id: result.insertId
      });
    } catch (error) {
      console.error('Product creation error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  static async getProductById(req, res) {
    try {
      const { id } = req.params;
      const [products] = await db.query('SELECT * FROM products WHERE id = ?', [id]);

      if (products.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Get batches for this product
      const [batches] = await db.query('SELECT * FROM product_batches WHERE product_id = ? ORDER BY production_date DESC', [id]);

      res.json({ ...products[0], batches });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { name, category, type, cost_per_unit, selling_price } = req.body;

      await db.query(
        'UPDATE products SET name = ?, category = ?, type = ?, cost_per_unit = ?, selling_price = ?, updated_at = NOW() WHERE id = ?',
        [name, category, type, cost_per_unit, selling_price, id]
      );

      res.json({ message: 'Product updated' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getProductStock(req, res) {
    try {
      const { id } = req.params;

      const [stock] = await db.query(`
        SELECT 
          p.id,
          p.name,
          SUM(pb.remaining_stock) as total_stock,
          COUNT(DISTINCT pb.id) as batch_count
        FROM products p 
        LEFT JOIN product_batches pb ON p.id = pb.product_id 
        WHERE p.id = ?
        GROUP BY p.id
      `, [id]);

      if (stock.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json(stock[0]);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = ProductController;
