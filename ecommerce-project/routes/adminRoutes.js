const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { isAdmin } = require("../middleware/auth");
const Order = require("../models/Order");
const User = require("../models/User");
const upload = require("../middleware/upload");

// Admin Dashboard
router.get("/dashboard", isAdmin, async (req, res) => {

    const products = await Product.find().sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.render("admin/dashboard", {
        products,
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue
    });
});

// Show Add Product Page
router.get("/add-product", isAdmin, (req, res) => {
    res.render("admin/addProduct");
});

// Handle Add Product
router.post(
    "/add-product",
    isAdmin,
    upload.array("images", 6),
    async (req, res) => {

        const { name, price, description, stock } = req.body;

        if (!req.files || req.files.length < 4) {
            req.session.message = "Minimum 4 images required!";
            return res.redirect("/admin/dashboard");
        }

        const imagePaths = req.files.map(file => "/uploads/" + file.filename);

        await Product.create({
            name,
            price,
            description,
            stock,
            images: imagePaths
        });

        req.session.message = "Product added successfully!";
        res.redirect("/admin/dashboard");
    }
);

// DELETE PRODUCT
router.post("/delete-product/:id", isAdmin, async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    req.session.message = "Product deleted successfully!";
    res.redirect("/admin/dashboard");
});


// EDIT PRODUCT
router.post(
  "/edit-product/:id",
  isAdmin,
  upload.array("newImages", 6),
  async (req, res) => {

    const product = await Product.findById(req.params.id);
    if (!product) {
      req.session.message = "Product not found";
      return res.redirect("/admin/dashboard");
    }

    const { name, price, description, stock } = req.body;

    let updatedImages = [...product.images];

    // Remove selected images
    if (req.body.removeImages) {
      const removeList = Array.isArray(req.body.removeImages)
        ? req.body.removeImages
        : [req.body.removeImages];

      updatedImages = updatedImages.filter(
        img => !removeList.includes(img)
      );
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      const newImgs = req.files.map(
        file => "/uploads/" + file.filename
      );
      updatedImages = [...updatedImages, ...newImgs];
    }

    // Validate
    if (updatedImages.length < 4) {
      req.session.message = "Minimum 4 images required";
      return res.redirect("/admin/dashboard");
    }

    if (updatedImages.length > 6) {
      req.session.message = "Maximum 6 images allowed";
      return res.redirect("/admin/dashboard");
    }

    await Product.findByIdAndUpdate(req.params.id, {
      name,
      price,
      description,
      stock,
      images: updatedImages
    });
    req.session.message = "Product updated successfully";
    res.redirect("/admin/dashboard");
  }
);

// View Orders
router.get("/orders", isAdmin, async (req, res) => {
    const orders = await Order.find().populate("user");
    res.render("admin/orders", { orders });
});

// Update Order Status
router.post("/update-order/:id", isAdmin, async (req, res) => {

    await Order.findByIdAndUpdate(req.params.id, {
        status: req.body.status
    });

    res.redirect("/admin/orders");
});

// View Customers
router.get("/customers", isAdmin, async (req, res) => {

    const customers = await User.find({ role: "user" });

    res.render("admin/customers", { customers });
});

module.exports = router;