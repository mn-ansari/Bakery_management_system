const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const UtilityController = require('../controllers/utilityController');
const { authMiddleware, authorizePermission } = require('../middleware/authMiddleware');

const router = express.Router();

// Ensure upload directories exist
const billsDir = path.join(__dirname, '../../uploads/bills');
const paymentsDir = path.join(__dirname, '../../uploads/payments');

if (!fs.existsSync(billsDir)) {
  fs.mkdirSync(billsDir, { recursive: true });
}
if (!fs.existsSync(paymentsDir)) {
  fs.mkdirSync(paymentsDir, { recursive: true });
}

// Configure multer for bill image uploads
const billStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, billsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'bill-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer for payment screenshot uploads
const paymentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, paymentsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const uploadBill = multer({ 
  storage: billStorage, 
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const uploadPayment = multer({ 
  storage: paymentStorage, 
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(authMiddleware);

// ==================== BILL ROUTES ====================

// Get all utility bills (with filters)
router.get('/', authorizePermission('manage_utilities'), UtilityController.getAllUtilities);

// Get single bill by ID
router.get('/bill/:id', authorizePermission('manage_utilities'), UtilityController.getUtilityById);

// Create new bill (with image upload)
router.post('/', authorizePermission('manage_utilities'), uploadBill.single('bill_image'), UtilityController.createUtility);

// Update bill (with optional new image)
router.put('/:id', authorizePermission('manage_utilities'), uploadBill.single('bill_image'), UtilityController.updateUtility);

// Delete bill
router.delete('/:id', authorizePermission('manage_utilities'), UtilityController.deleteUtility);

// ==================== OCR ROUTES ====================

// Process bill image with OCR
router.post('/ocr', authorizePermission('manage_utilities'), uploadBill.single('bill_image'), UtilityController.processOCR);

// ==================== PAYMENT ROUTES ====================

// Mark bill as paid (with optional payment screenshot)
router.post('/:id/pay', authorizePermission('manage_utilities'), uploadPayment.single('payment_screenshot'), UtilityController.markAsPaid);

// Get payment history
router.get('/payments/history', authorizePermission('manage_utilities'), UtilityController.getPaymentHistory);

// Get pending payments
router.get('/payments/pending', authorizePermission('manage_utilities'), UtilityController.getPendingPayments);

// ==================== NOTIFICATION ROUTES ====================

// Get utility notifications
router.get('/notifications', authorizePermission('manage_utilities'), UtilityController.getNotifications);

// Get notification summary for dashboard (available to all authenticated users)
router.get('/notifications/summary', UtilityController.getNotificationSummary);

// Dismiss notification
router.put('/notifications/:id/dismiss', authorizePermission('manage_utilities'), UtilityController.dismissNotification);

// ==================== SUMMARY ROUTES ====================

// Get monthly summary
router.get('/summary/monthly', authorizePermission('manage_utilities'), UtilityController.getMonthlySummary);

// Get yearly summary
router.get('/summary/yearly', authorizePermission('manage_utilities'), UtilityController.getYearlySummary);

// Get total expense
router.get('/expense/total', authorizePermission('manage_utilities'), UtilityController.getTotalExpense);

module.exports = router;
