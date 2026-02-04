const session = require('express-session');

app.use(session({
    secret: process.env.SESSION_SECRET || 'iuh_fit_secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});