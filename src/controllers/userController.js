const userRepo = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

exports.renderLogin = (req, res) => {
    res.render('login', { error: null });
};

exports.handleLogin = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await userRepo.findByUsername(username);

        if (user && await bcrypt.compare(password, user.password)) {
            // Lưu thông tin vào session (Không lưu password)
            req.session.user = {
                id: user.userId,
                username: user.username,
                role: user.role
            };
            return res.redirect('/products');
        }

        res.render('login', { error: 'Sai tên đăng nhập hoặc mật khẩu!' });
    } catch (err) {
        res.status(500).send("Lỗi máy chủ");
    }
};

exports.handleRegister = async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const existingUser = await userRepo.findByUsername(username);
        if (existingUser) return res.send("User đã tồn tại!");
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            userId: uuidv4(),
            username,
            password: hashedPassword,
            role: role || 'staff', 
            createdAt: new Date().toISOString()
        };

        await userRepo.create(newUser);
        res.redirect('/login');
    } catch (err) {
        res.status(500).send("Lỗi đăng ký");
    }
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/login');
};