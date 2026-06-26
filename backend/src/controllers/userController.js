const db = require('../config/database');

class UserController {
  static async getAllUsers(req, res) {
    try {
      const [users] = await db.query(`
        SELECT u.id, u.username, u.email, u.full_name, u.status, r.name as role 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        ORDER BY u.created_at DESC
      `);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const [users] = await db.query(`
        SELECT u.id, u.username, u.email, u.full_name, u.status, u.created_at, r.name as role 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.id = ?
      `, [id]);

      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(users[0]);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { full_name, status, role_id } = req.body;

      await db.query(
        'UPDATE users SET full_name = ?, status = ?, role_id = ?, updated_at = NOW() WHERE id = ?',
        [full_name, status, role_id, id]
      );

      res.json({ message: 'User updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM users WHERE id = ?', [id]);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = UserController;
