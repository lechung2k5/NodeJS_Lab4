const userRepo = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

exports.renderLogin = (req, res) => res.render('login', { error: null });

exports.handleLogin = async (req, res) => {
    const { username, password } = req.body;
    const user = await userRepo.findByUsername(username);

    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = {
            id: user.userId,
            username: user.username,
            role: user.role
        };
        return res.redirect('/products');
    }
    res.render('login', { error: 'Sai tài khoản hoặc mật khẩu!' });
};

exports.handleRegister = async (req, res) => {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    await userRepo.create({
        userId: uuidv4(),
        username,
        password: hashedPassword,
        role: role || 'staff',
        createdAt: new Date().toISOString()
    });
    res.redirect('/login');
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/login');
};
exports.renderRegister = (req, res) => {
    res.render('register');
};