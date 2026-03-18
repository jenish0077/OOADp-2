const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authMiddleware = require('./middleware/authMiddleware');

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Auth Routes (public)
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Protected Routes (require authentication)
const dashboardRoutes = require('./routes/dashboardRoutes');
const salesRoutes = require('./routes/salesRoutes');
const reportRoutes = require('./routes/reportRoutes');
const productRoutes = require('./routes/productRoutes');
const billRoutes = require('./routes/billRoutes');

app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/sales', authMiddleware, salesRoutes);
app.use('/api/report', authMiddleware, reportRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/bills', authMiddleware, billRoutes);

// Seed basic data on startup if products are empty to simplify demo
const Product = require('./models/Product');
const seedData = async () => {
    const count = await Product.countDocuments();
    if (count === 0) {
        console.log('Seeding initial MongoDB products data...');
        const initialProducts = [
            { id: 101, name: 'Face Wash', brand: 'Himalaya', category: 'Skincare', subCategory: 'Cleanser', price: 250, stock: 50, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmYJBzMq6yblJ94XDchWtjf_jhI1YYRGRa_w&s' },
            { id: 102, name: 'Moisturizing Cream', brand: 'CeraVe', category: 'Skincare', subCategory: 'Moisturizer', price: 2100, stock: 45, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmYJBzMq6yblJ94XDchWtjf_jhI1YYRGRa_w&s' },
            { id: 103, name: 'Lip Balm', brand: 'Nivea', category: 'Makeup', subCategory: 'Lips', price: 150, stock: 100, image: '' },
            { id: 104, name: 'Shampoo', brand: 'Dove', category: 'Haircare', subCategory: 'Shampoo', price: 400, stock: 30, image: '' },
            { id: 105, name: 'Perfume', brand: 'Fogg', category: 'Fragrance', subCategory: 'Deodorant', price: 1200, stock: 15, image: '' },
            { id: 106, name: 'Moisturizer', brand: 'Olay', category: 'Skincare', subCategory: 'Moisturizer', price: 450, stock: 40, image: '' }
        ];
        await Product.insertMany(initialProducts);
        console.log('Seed complete.');
    }
};
seedData();

// Serve frontend
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

// PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
