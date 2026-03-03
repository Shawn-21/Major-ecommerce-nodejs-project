const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

const { isLoggedIn } = require("../middleware/auth");


// =============================
// REGISTER PAGE
// =============================
router.get("/register", (req, res) => {
    res.render("user/register");
});

router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
        name,
        email,
        password: hashedPassword,
        role: "user"
    });

    res.redirect("/login");
});


// =============================
// LOGIN PAGE
// =============================
router.get("/login", (req, res) => {
    res.render("user/login");
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.redirect("/login");

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.redirect("/login");

    req.session.userId = user._id;
    req.session.role = user.role;

    res.redirect("/dashboard");
});


// =============================
// LOGOUT
// =============================
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});


// =============================
// DASHBOARD (Search Enabled)
// =============================
router.get("/dashboard", isLoggedIn, async (req, res) => {

    const search = req.query.search || "";

    const products = await Product.find({
        name: { $regex: search, $options: "i" }
    });

    res.render("user/dashboard", {
        user: req.user,
        products,
        search
    });
});


// =============================
// PRODUCT DETAILS
// =============================
router.get("/product/:id", isLoggedIn, async (req, res) => {

    const product = await Product.findById(req.params.id);

    const alreadyInCart = req.session.cart?.some(
        item => item.productId.toString() === product._id.toString()
    );

    res.render("user/productDetails", {
        product,
        user: req.user,
        alreadyInCart
    });
});


// =============================
// ADD TO CART
// =============================
router.post("/add-to-cart/:id", isLoggedIn, async (req, res) => {

    const product = await Product.findById(req.params.id);

    if (!req.session.cart) {
        req.session.cart = [];
    }

    const existingItem = req.session.cart.find(
        item => item.productId.toString() === product._id.toString()
    );

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        req.session.cart.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    req.session.message = "Product added to cart!";

    res.redirect("/product/" + product._id);
});


// =============================
// BUY NOW (Skip Cart Page)
// =============================
router.post("/buy-now/:id", isLoggedIn, async (req, res) => {

    const product = await Product.findById(req.params.id);

    req.session.cart = [{
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
    }];

    res.redirect("/checkout");
});


// =============================
// REMOVE FROM CART
// =============================
router.get("/remove-from-cart/:id", isLoggedIn, (req, res) => {

    req.session.cart = req.session.cart.filter(
        item => item.productId.toString() !== req.params.id
    );

    res.redirect("/cart");
});


// =============================
// CART PAGE
// =============================
router.get("/cart", isLoggedIn, (req, res) => {

    const cart = req.session.cart || [];

    let total = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
    });

    res.render("user/cart", {
        cart,
        total,
        user: req.user
    });
});


// =============================
// CHECKOUT PAGE
// =============================
router.get("/checkout", isLoggedIn, (req, res) => {

    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.redirect("/dashboard");
    }

    let total = 0;
    cart.forEach(item => total += item.price * item.quantity);

    res.render("user/checkout", {
        cart,
        total,
        user: req.user
    });
});


// =============================
// PLACE ORDER
// =============================
router.post("/place-order", isLoggedIn, async (req, res) => {

    const { address, phone } = req.body;

    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.redirect("/dashboard");
    }

    let total = 0;
    cart.forEach(item => total += item.price * item.quantity);

    const order = await Order.create({
        user: req.session.userId,
        items: cart,
        totalAmount: total,
        address,
        phone
    });

    req.session.cart = [];
    req.session.message = "Order placed successfully!";

    res.redirect("/order/" + order._id);
});


// =============================
// ORDER DETAILS PAGE
// =============================
router.get("/order/:id", isLoggedIn, async (req, res) => {

    const order = await Order.findById(req.params.id);

    res.render("user/orderDetails", {
        order,
        user: req.user
    });
});


// =============================
// MY ORDERS
// =============================
router.get("/my-orders", isLoggedIn, async (req, res) => {

    const orders = await Order.find({
        user: req.session.userId
    }).sort({ createdAt: -1 });

    res.render("user/myOrders", {
        orders,
        user: req.user
    });
});


module.exports = router;