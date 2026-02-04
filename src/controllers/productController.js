const productRepo = require('../repositories/productRepository');
const categoryRepo = require('../repositories/categoryRepository');
const logRepo = require('../repositories/logRepository');
const orderRepo = require('../repositories/orderRepository'); // Đã thêm
const { v4: uuidv4 } = require('uuid');

// Lấy danh sách sản phẩm và hiển thị trạng thái tồn kho
exports.getAll = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit; 

        const keyword = req.query.keyword || '';
        const categoryId = req.query.categoryId || '';
        const allFilteredProducts = await productRepo.search(keyword, categoryId);
        const categories = await categoryRepo.getAll();
        const processedProducts = allFilteredProducts.map(p => {
            const cat = categories.find(c => c.categoryId === p.categoryId);
            return {
                ...p,
                categoryName: cat ? cat.name : 'N/A'
            };
        });

        const totalProducts = processedProducts.length;
        const totalPages = Math.ceil(totalProducts / limit);
        const paginatedProducts = processedProducts.slice(skip, skip + limit);

        res.render('index', {
            products: paginatedProducts,
            categories,
            keyword,
            categoryId,
            currentPage: page,
            totalPages: totalPages,
            user: req.session.user
        });
    } catch (err) {
        console.error(err);
        res.render('index', { products: [], categories: [], currentPage: 1, totalPages: 0, keyword: '', categoryId: '' });
    }
};

// Tìm kiếm sản phẩm
exports.handleSearch = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;
    const { keyword, categoryId } = req.query;

    try {
        const results = await productRepo.search(keyword, categoryId);
        const categories = await categoryRepo.getAll();

        const processedProducts = results.map(p => {
            const cat = categories.find(c => c.categoryId === p.categoryId);
            return { ...p, categoryName: cat ? cat.name : 'N/A' };
        });

        const totalPages = Math.ceil(processedProducts.length / limit);
        const paginatedProducts = processedProducts.slice(skip, skip + limit);

        res.render('index', {
            products: paginatedProducts,
            categories,
            keyword,
            categoryId,
            currentPage: page,
            totalPages: totalPages,
            user: req.session.user
        });
    } catch (err) {
        res.redirect('/products');
    }
};

// Hiển thị form thêm sản phẩm mới
exports.renderAddForm = async (req, res) => {
    try {
        const categories = await categoryRepo.getAll();
        res.render('add', { categories });
    } catch (err) {
        res.redirect('/products');
    }
};

// Xử lý thêm sản phẩm và ghi log
exports.handleCreate = async (req, res) => {
    const { name, price, quantity, categoryId } = req.body;
    const imageUrl = req.file ? req.file.location : '';

    const productId = uuidv4();
    const newProduct = {
        id: productId,
        name,
        price: Number(price),
        quantity: Number(quantity),
        categoryId,
        url_image: imageUrl,
        isDeleted: false,
        createdAt: new Date().toISOString()
    };

    try {
        await productRepo.create(newProduct);
        await logRepo.createLog({
            logId: uuidv4(),
            productId: productId,
            action: 'CREATE',
            userId: req.session.user.username,
            time: new Date().toISOString()
        });
        res.redirect('/products');
    } catch (err) {
        res.status(500).send("Lỗi thêm sản phẩm: " + err.message);
    }
};

// Hiển thị form chỉnh sửa
exports.renderEditForm = async (req, res) => {
    try {
        const product = await productRepo.getById(req.params.id);
        const categories = await categoryRepo.getAll();
        res.render('edit', { product, categories });
    } catch (err) {
        res.redirect('/products');
    }
};

// Xử lý cập nhật sản phẩm
exports.handleUpdate = async (req, res) => {
    const { id, name, price, quantity, categoryId, old_url_image } = req.body;
    const imageUrl = req.file ? req.file.location : old_url_image;

    try {
        await productRepo.update({ id, name, price, quantity, categoryId, url_image: imageUrl });
        res.redirect('/products');
    } catch (err) {
        res.status(500).send("Lỗi cập nhật: " + err.message);
    }
};

// Thực hiện xóa mềm sản phẩm và ghi log
exports.handleSoftDelete = async (req, res) => {
    const { id } = req.body;
    try {
        await productRepo.softDelete(id);
        await logRepo.createLog({
            logId: uuidv4(),
            productId: id,
            action: 'DELETE',
            userId: req.session.user.username,
            time: new Date().toISOString()
        });
        res.redirect('/products');
    } catch (err) {
        res.status(500).send("Lỗi xóa sản phẩm");
    }
};

// Xử lý mua hàng (Mở rộng Mini E-commerce)
exports.handleBuyNow = async (req, res) => {
    const { productId } = req.body;
    try {
        const product = await productRepo.getById(productId);
        if (!product || product.quantity <= 0) return res.status(400).send("Hết hàng!");
        if (!req.session.cart) req.session.cart = [];
        const itemIndex = req.session.cart.findIndex(item => item.id === productId);

        if (itemIndex > -1) {
            req.session.cart[itemIndex].cartQuantity += 1;
        } else {

            req.session.cart.push({ ...product, cartQuantity: 1 });
        }

        res.redirect('/products/cart');
    } catch (err) {
        res.redirect('/products');
    }
};
// Render trang giỏ hàng
exports.renderCart = (req, res) => {
    const cart = req.session.cart || [];
    const total = cart.reduce((sum, item) => sum + (Number(item.price) * item.cartQuantity), 0);
    res.render('cart', { cart, total });
};

// Xóa một món khỏi giỏ
exports.removeFromCart = (req, res) => {
    const { index } = req.body;
    if (req.session.cart) {
        req.session.cart.splice(index, 1);
    }
    res.redirect('/products/cart');
};
// Xử lý thanh toán giỏ hàng (Checkout)
exports.handleCheckout = async (req, res) => {
    const cart = req.session.cart || [];
    if (cart.length === 0) return res.redirect('/products');

    try {
        for (const item of cart) {
            await orderRepo.create({
                orderId: uuidv4(),
                userId: req.session.user.userId || req.session.user.id,
                username: req.session.user.username,
                productId: item.id,
                productName: item.name,
                price: item.price * item.cartQuantity,
                quantity: item.cartQuantity,
                status: 'Đã thanh toán'
            });

            const product = await productRepo.getById(item.id);
            await productRepo.update({
                ...product,
                quantity: product.quantity - item.cartQuantity
            });
        }

        req.session.cart = [];

        res.redirect('/products/order-success');
    } catch (err) {
        res.status(500).send("Lỗi thanh toán: " + err.message);
    }
};
exports.renderOrderSuccess = (req, res) => {
    res.render('order-success');
};