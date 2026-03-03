const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    items: [
        {
            productId: mongoose.Schema.Types.ObjectId,
            name: String,
            price: Number,
            quantity: Number
        }
    ],
    totalAmount: Number,

    address: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    paymentMethod: {
        type: String,
        default: "Cash on Delivery"
    },

    status: {
        type: String,
        default: "Order Placed"
    }

}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);