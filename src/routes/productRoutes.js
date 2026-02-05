const express = require('express');
const router = express.Router();
const multer = require('multer');
const multerS3 = require('multer-s3');
const { s3Client } = require('../configs/awsConfig');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');
const productController = require('../controllers/productController');

const upload = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: (process.env.S3_BUCKET_NAME || "").trim(),
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => cb(null, `products/${Date.now()}_${file.originalname}`)
    })
});

router.get('/', isAuthenticated, productController.getAll);
router.get('/search', isAuthenticated, productController.handleSearch);
router.get('/logs', isAuthenticated, isAdmin, productController.viewLogs);
router.get('/add', isAuthenticated, isAdmin, productController.renderAddForm);
router.post('/add', isAuthenticated, isAdmin, upload.single('image'), productController.handleCreate);
router.get('/edit/:id', isAuthenticated, isAdmin, productController.renderEditForm);
router.post('/edit', isAuthenticated, isAdmin, upload.single('image'), productController.handleUpdate);
router.post('/delete', isAuthenticated, isAdmin, productController.handleSoftDelete);
router.post('/buy-now', isAuthenticated, productController.handleBuyNow);
router.get('/cart', isAuthenticated, productController.renderCart);
router.post('/cart/remove', isAuthenticated, productController.removeFromCart);
router.post('/cart/checkout', isAuthenticated, productController.handleCheckout);
router.get('/order-success', isAuthenticated, productController.renderOrderSuccess);

module.exports = router;