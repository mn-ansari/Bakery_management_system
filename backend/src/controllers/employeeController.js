const db = require('../config/database');

class EmployeeController {
  static async createEmployee(req, res) {
    try {
      const { user_id, name, role, join_date, monthly_salary, cnic, contact } = req.body;

      const [result] = await db.query(
        'INSERT INTO employees (user_id, name, role, join_date, monthly_salary, cnic, contact) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user_id, name, role, join_date, monthly_salary, cnic, contact]
      );

      res.status(201).json({ 
        message: 'Employee created',
        id: result.insertId 
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getAllEmployees(req, res) {
    try {
      const [employees] = await db.query(`
        SELECT e.*, u.username, u.email 
        FROM employees e 
        LEFT JOIN users u ON e.user_id = u.id 
        ORDER BY e.name
      `);

      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getEmployeeById(req, res) {
    try {
      const { id } = req.params;

      const [employees] = await db.query(`
        SELECT e.*, u.username, u.email 
        FROM employees e 
        LEFT JOIN users u ON e.user_id = u.id 
        WHERE e.id = ?
      `, [id]);

      if (employees.length === 0) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      // Get salary history
      const [salaries] = await db.query(
        'SELECT * FROM salary_payments WHERE employee_id = ? ORDER BY payment_date DESC',
        [id]
      );

      res.json({ ...employees[0], salary_history: salaries });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateEmployee(req, res) {
    try {
      const { id } = req.params;
      const { name, role, monthly_salary, contact, status } = req.body;

      await db.query(
        'UPDATE employees SET name = ?, role = ?, monthly_salary = ?, contact = ?, status = ?, updated_at = NOW() WHERE id = ?',
        [name, role, monthly_salary, contact, status, id]
      );

      res.json({ message: 'Employee updated' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getEmployeeStats(req, res) {
    try {
      const [stats] = await db.query(`
        SELECT 
          COUNT(*) as total_employees,
          SUM(monthly_salary) as total_monthly_salary,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_employees,
          SUM(CASE WHEN status = 'on-leave' THEN 1 ELSE 0 END) as on_leave_employees
        FROM employees
      `);

      res.json(stats[0]);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = EmployeeController;
