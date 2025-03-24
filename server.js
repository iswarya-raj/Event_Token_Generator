const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://localhost:27017/accommodation", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

const BookingSchema = new mongoose.Schema({
    name: String,
    email: String,
    roomType: String,
    days: Number,
    amount: Number,
    paymentStatus: String,
    token: String
});
const Booking = mongoose.model("Booking", BookingSchema);

const calculateAmount = (roomType, days) => {
    const rates = { single: 500, double: 800, suite: 1200 };
    return rates[roomType] * days;
};

app.post("/book", async (req, res) => {
    const { name, email, roomType, days } = req.body;
    const amount = calculateAmount(roomType, days);

    const paymentStatus = "Paid";
    const token = crypto.randomBytes(8).toString("hex");

    const newBooking = new Booking({
        name, email, roomType, days, amount, paymentStatus, token
    });
    await newBooking.save();

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Accommodation Booking Confirmation",
        text: `Your payment of Rs.${amount} is successful. Your unique code: ${token}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.status(500).send("Error sending email");
        } else {
            res.status(200).json({ message: "Booking successful! Code sent to email.", token });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
