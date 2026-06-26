const db = require('../config/database');

class SalaryController {
  static async recordPayment(req, res) {
    try {
      const { employee_id, amount, payment_date, payment_type, reason, month_year, created_by } = req.body;

      const [result] = await db.query(
        'INSERT INTO salary_payments (employee_id, amount, payment_date, payment_type, reason, month_year, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [employee_id, amount, payment_date, payment_type, reason, month_year, created_by]
      );

      res.status(201).json({ 
        message: 'Payment recorded',
        id: result.insertId 
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getEmployeeSalaryHistory(req, res) {
    try {
      const { employee_id } = req.params;

      const [payments] = await db.query(`
        SELECT sp.*, u.full_name as recorded_by 
        FROM salary_payments sp 
        LEFT JOIN users u ON sp.created_by = u.id 
        WHERE sp.employee_id = ? 
        ORDER BY sp.payment_date DESC
      `, [employee_id]);

      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getMonthlySalaryStatus(req, res) {
    try {
      const { month_year } = req.query;

      const [status] = await db.query(`
        SELECT 
          e.id,
          e.name,
          e.role,
          e.monthly_salary,
          COALESCE(SUM(sp.amount), 0) as paid_amount,
          (e.monthly_salary - COALESCE(SUM(sp.amount), 0)) as remaining_amount,
          COUNT(CASE WHEN sp.payment_type = 'partial' THEN 1 END) as advance_count
        FROM employees e 
        LEFT JOIN salary_payments sp ON e.id = sp.employee_id AND sp.month_year = ?
        WHERE e.status = 'active'
        GROUP BY e.id, e.name, e.role, e.monthly_salary
      `, [month_year]);

      res.json(status);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getYearlySalaryReport(req, res) {
    try {
      const { employee_id } = req.params;

      const [report] = await db.query(`
        SELECT 
          DATE_FORMAT(sp.payment_date, '%Y-%m') as month,
          SUM(sp.amount) as total_paid,
          COUNT(*) as payment_count
        FROM salary_payments sp 
        WHERE sp.employee_id = ?
        GROUP BY DATE_FORMAT(sp.payment_date, '%Y-%m')
        ORDER BY month DESC
      `, [employee_id]);

      res.json(report);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getTotalSalaryExpense(req, res) {
    try {
      const { date_from, date_to } = req.query;

      let query = 'SELECT SUM(amount) as total_paid FROM salary_payments WHERE 1=1';
      const params = [];

      if (date_from) {
        query += ' AND payment_date >= ?';
        params.push(date_from);
      }

      if (date_to) {
        query += ' AND payment_date <= ?';
        params.push(date_to);
      }

      const [result] = await db.query(query, params);
      res.json({ total_salary_expense: result[0].total_paid || 0 });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getMonthlyPayrollSummary(req, res) {
    try {
      const { month_year } = req.query;

      const [summary] = await db.query(`
        SELECT 
          COUNT(DISTINCT sp.employee_id) as employees_paid,
          SUM(sp.amount) as total_paid,
          AVG(sp.amount) as avg_payment,
          COUNT(*) as total_transactions
        FROM salary_payments sp 
        WHERE sp.month_year = ?
      `, [month_year]);

      res.json(summary[0]);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getRecentLogs(req, res) {
    try {
      const { limit = 50, month_year } = req.query;

      let query = `
        SELECT 
          sp.*,
          e.name as employee_name,
          e.role as employee_role,
          u.full_name as recorded_by
        FROM salary_payments sp
        JOIN employees e ON sp.employee_id = e.id
        LEFT JOIN users u ON sp.created_by = u.id
      `;
      const params = [];

      if (month_year) {
        query += ' WHERE sp.month_year = ?';
        params.push(month_year);
      }

      query += ' ORDER BY sp.payment_date DESC, sp.created_at DESC LIMIT ?';
      params.push(parseInt(limit));

      const [logs] = await db.query(query, params);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = SalaryController;
