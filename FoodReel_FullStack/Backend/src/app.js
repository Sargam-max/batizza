const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const foodRoutes = require('./routes/food.routes');
const orderRoutes = require('./routes/order.routes');
const socialRoutes = require('./routes/social.routes');
const storeRoutes = require('./routes/store.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();
const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
    origin: isDev ? 'http://localhost:5173' : false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/payment', paymentRoutes);

if (!isDev) {
    const publicPath = path.join(__dirname, '../public');
    app.use(express.static(publicPath));
    app.get('*', (req, res) => res.sendFile(path.join(publicPath, 'index.html')));
} else {
    app.get('/', (req, res) => res.send('FoodReel API 🍕'));
}

module.exports = app;
