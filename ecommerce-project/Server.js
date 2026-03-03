require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const adminRoutes = require("./routes/adminRoutes");
const connectDB = require("./config/db");

const app = express();

connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.set("view engine", "ejs");

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
  })
);
app.use((req, res, next) => {
    res.locals.user = req.session.userId ? true : false;
    res.locals.cartCount = req.session.cart ? req.session.cart.length : 0;
    next();
});

app.use((req, res, next) => {
    res.locals.search = req.query.search || "";
    next();
});

app.use((req, res, next) => {

    res.locals.search = req.query.search || "";

    // 🔥 Recalculate cart count EVERY request
    res.locals.cartCount = req.session.cart
        ? req.session.cart.reduce((total, item) => total + item.quantity, 0)
        : 0;

    res.locals.message = req.session.message || null;
    req.session.message = null;

    res.locals.role = req.session.role || null;

    next();
});

app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

// Routes
app.use("/", require("./routes/userRoutes"));
app.use("/admin", adminRoutes);

app.listen(process.env.PORT, () =>
  console.log("Server Running 🚀")
);