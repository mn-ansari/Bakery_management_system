const express = require('express');
const UserController = require('../controllers/userController');
const { authMiddleware, authorizePermission } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', authorizePermission('view_users'), UserController.getAllUsers);
router.get('/:id', UserController.getUserById);
router.put('/:id', authorizePermission('edit_user'), UserController.updateUser);
router.delete('/:id', authorizePermission('delete_user'), UserController.deleteUser);

module.exports = router;
