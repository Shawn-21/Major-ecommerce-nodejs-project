const User = require("../models/User");

const isLoggedIn = async (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect("/login");
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
        return res.redirect("/login");
    }

    req.user = user;
    next();
};

const isAdmin = (req, res, next) => {
    if (!req.session.userId || req.session.role !== "admin") {
        return res.redirect("/login");
    }
    next();
};

module.exports = { isLoggedIn, isAdmin };