const db = require('../config/database');

class ReportController {
  static async generateInventoryReport(req, res) {
    try {
      const [rawMaterials] = await db.query(`
        SELECT 'raw_material' as type, id, name, current_stock, minimum_stock, 
               CASE WHEN current_stock <= minimum_stock THEN 'low' ELSE 'ok' END as status,
               warehouse_location as location
        FROM raw_materials
        ORDER BY current_stock ASC
      `);

      const [products] = await db.query(`
        SELECT 'product' as type, p.id, p.name, 
               COALESCE(SUM(pb.remaining_stock), 0) as current_stock,
               p.category, p.type
        FROM products p 
        LEFT JOIN product_batches pb ON p.id = pb.product_id
        GROUP BY p.id, p.name, p.category, p.type
        ORDER BY current_stock ASC
      `);

      res.json({
        report_type: 'inventory',
        generated_at: new Date(),
        raw_materials: rawMaterials,
        products: products
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async generateSalesReport(req, res) {
    try {
      const { date_from, date_to } = req.query;

      const [sales] = await db.query(`
        SELECT 
          s.sale_date,
          s.sale_type,
          p.name as product_name,
          p.category,
          COALESCE(SUM(s.quantity_sold), 0) as quantity,
          COALESCE(SUM(s.total_amount), 0) as revenue
        FROM sales s 
        JOIN products p ON s.product_id = p.id 
        WHERE s.sale_date >= ? AND s.sale_date <= ?
        GROUP BY s.sale_date, s.sale_type, p.id, p.name, p.category
        ORDER BY s.sale_date DESC
      `, [date_from || '2024-01-01', date_to || new Date().toISOString().split('T')[0]]);

      const [summary] = await db.query(`
        SELECT 
          COUNT(*) as total_transactions,
          SUM(quantity_sold) as total_items_sold,
          SUM(total_amount) as total_revenue
        FROM sales 
        WHERE sale_date >= ? AND sale_date <= ?
      `, [date_from || '2024-01-01', date_to || new Date().toISOString().split('T')[0]]);

      res.json({
        report_type: 'sales',
        period_from: date_from,
        period_to: date_to,
        generated_at: new Date(),
        summary: summary[0],
        details: sales
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async generateProfitReport(req, res) {
    try {
      const { date_from, date_to } = req.query;
      const queryDateFrom = date_from || '2024-01-01';
      const queryDateTo = date_to || new Date().toISOString().split('T')[0];

      // Total Revenue
      const [revenue] = await db.query(`
        SELECT COALESCE(SUM(total_amount), 0) as total_revenue 
        FROM sales 
        WHERE sale_date >= ? AND sale_date <= ?
      `, [queryDateFrom, queryDateTo]);

      // Total Production Cost
      const [productionCost] = await db.query(`
        SELECT COALESCE(SUM(production_cost), 0) as total_production_cost 
        FROM production_logs 
        WHERE production_date >= ? AND production_date <= ?
      `, [queryDateFrom, queryDateTo]);

      // Total Salary
      const [salary] = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total_salary 
        FROM salary_payments 
        WHERE payment_date >= ? AND payment_date <= ?
      `, [queryDateFrom, queryDateTo]);

      // Total Utilities
      const [utilities] = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total_utilities 
        FROM utilities 
        WHERE bill_month >= ? AND bill_month <= ?
      `, [queryDateFrom, queryDateTo]);

      const totalRevenue = revenue[0].total_revenue;
      const totalCost = productionCost[0].total_production_cost + salary[0].total_salary + utilities[0].total_utilities;
      const profit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0;

      res.json({
        report_type: 'profit',
        period_from: queryDateFrom,
        period_to: queryDateTo,
        generated_at: new Date(),
        revenue: totalRevenue,
        costs: {
          production: productionCost[0].total_production_cost,
          salaries: salary[0].total_salary,
          utilities: utilities[0].total_utilities,
          total: totalCost
        },
        profit: profit,
        profit_margin: `${profitMargin}%`
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async generateWasteReport(req, res) {
    try {
      const { date_from, date_to } = req.query;

      const [waste] = await db.query(`
        SELECT 
          bw.type,
          p.name as product_name,
          p.category,
          SUM(bw.quantity) as total_quantity,
          COUNT(*) as waste_count,
          bw.waste_date
        FROM batch_waste bw 
        JOIN products p ON bw.product_id = p.id 
        WHERE bw.waste_date >= ? AND bw.waste_date <= ?
        GROUP BY bw.type, p.id, p.name, p.category, bw.waste_date
        ORDER BY bw.waste_date DESC
      `, [date_from || '2024-01-01', date_to || new Date().toISOString().split('T')[0]]);

      res.json({
        report_type: 'waste',
        period_from: date_from,
        period_to: date_to,
        generated_at: new Date(),
        waste_records: waste
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async generateExpiryReport(req, res) {
    try {
      const days = req.query.days || 7;

      const [expiring] = await db.query(`
        SELECT 'raw_material' as type, rb.batch_id, rm.name as item_name, rb.remaining_stock as stock, 
               rb.expiry_date, DATEDIFF(rb.expiry_date, CURDATE()) as days_remaining
        FROM raw_batches rb 
        JOIN raw_materials rm ON rb.raw_material_id = rm.id 
        WHERE rb.expiry_date IS NOT NULL AND DATEDIFF(rb.expiry_date, CURDATE()) <= ? AND rb.remaining_stock > 0
        UNION ALL
        SELECT 'product' as type, pb.batch_id, p.name as item_name, pb.remaining_stock as stock, 
               pb.expiry_date, DATEDIFF(pb.expiry_date, CURDATE()) as days_remaining
        FROM product_batches pb 
        JOIN products p ON pb.product_id = p.id 
        WHERE pb.expiry_date IS NOT NULL AND DATEDIFF(pb.expiry_date, CURDATE()) <= ? AND pb.remaining_stock > 0
        ORDER BY expiry_date ASC
      `, [days, days]);

      res.json({
        report_type: 'expiry_alerts',
        expiry_window_days: days,
        generated_at: new Date(),
        expiring_items: expiring
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async generateDashboardSummary(req, res) {
    try {
      // Today's sales
      const [todaySales] = await db.query(`
        SELECT COALESCE(SUM(total_amount), 0) as amount, COUNT(*) as transactions
        FROM sales WHERE sale_date = CURDATE()
      `);

      // Low stock items
      const [lowStock] = await db.query(`
        SELECT COUNT(*) as count FROM raw_materials WHERE current_stock <= minimum_stock
      `);

      // Today's production
      const [todayProduction] = await db.query(`
        SELECT COALESCE(SUM(quantity_produced), 0) as quantity, COUNT(*) as batches
        FROM production_logs WHERE production_date = CURDATE()
      `);

      // Employee stats
      const [employees] = await db.query(`
        SELECT COUNT(*) as total, 
               SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
        FROM employees
      `);

      // Monthly profit
      const [monthProfit] = await db.query(`
        SELECT 
          COALESCE(SUM(s.total_amount), 0) as revenue,
          COALESCE(SUM(pl.production_cost), 0) as prod_cost,
          COALESCE(SUM(sp.amount), 0) as salary_cost,
          COALESCE(SUM(u.amount), 0) as utility_cost
        FROM sales s
        LEFT JOIN production_logs pl ON MONTH(pl.production_date) = MONTH(CURDATE()) AND YEAR(pl.production_date) = YEAR(CURDATE())
        LEFT JOIN salary_payments sp ON MONTH(sp.payment_date) = MONTH(CURDATE()) AND YEAR(sp.payment_date) = YEAR(CURDATE())
        LEFT JOIN utilities u ON MONTH(u.bill_month) = MONTH(CURDATE()) AND YEAR(u.bill_month) = YEAR(CURDATE())
        WHERE MONTH(s.sale_date) = MONTH(CURDATE()) AND YEAR(s.sale_date) = YEAR(CURDATE())
      `);

      const monthData = monthProfit[0];
      const profit = monthData.revenue - (monthData.prod_cost + monthData.salary_cost + monthData.utility_cost);

      res.json({
        dashboard: {
          today: {
            sales: todaySales[0],
            production: todayProduction[0],
            low_stock_alerts: lowStock[0].count
          },
          employees: employees[0],
          this_month: {
            revenue: monthData.revenue,
            production_cost: monthData.prod_cost,
            salary_cost: monthData.salary_cost,
            utility_cost: monthData.utility_cost,
            profit: profit,
            profit_margin: monthData.revenue > 0 ? ((profit / monthData.revenue) * 100).toFixed(2) : 0
          }
        },
        generated_at: new Date()
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = ReportController;
