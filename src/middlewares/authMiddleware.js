// Kiểm tra đã đăng nhập chưa
exports.isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
};

exports.isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).send('Quyền truy cập bị từ chối: Chỉ Admin mới có quyền thực hiện thao tác này!');
};

exports.isStaffOrAdmin = (req, res, next) => {
    const role = req.session.user.role;
    if (role === 'admin' || role === 'staff') {
        return next();
    }
    res.status(403).send('Bạn không có quyền xem nội dung này!');
};