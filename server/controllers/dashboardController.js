const Product = require('../models/Product');
const Bill = require('../models/Bill');

exports.getDashboardStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = today.substring(0, 7);

        const dailyBills = await Bill.find({ date: today });
        const dailySales = dailyBills.reduce((acc, b) => acc + b.total, 0);

        const monthlyBills = await Bill.find({ date: { $regex: '^' + thisMonth } });
        const monthlyRevenue = monthlyBills.reduce((acc, b) => acc + b.total, 0);

        res.json({ totalProducts, dailySales, monthlyRevenue });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTopProducts = async (req, res) => {
    try {
        const products = await Product.find().lean();
        const bills = await Bill.find().lean();
        
        // Calculate sales per product
        let salesMap = {};
        bills.forEach(b => {
            b.items.forEach(item => {
                if (!salesMap[item.id]) salesMap[item.id] = 0;
                salesMap[item.id] += item.qty * item.price;
            });
        });

        // Map sales to products
        let result = products.map(p => ({
            name: p.name,
            category: p.category,
            inStock: p.stock > 0,
            totalSales: salesMap[p.id] || 0
        }));

        // Sort by sales descending
        result.sort((a, b) => b.totalSales - a.totalSales);
        
        res.json(result.slice(0, 5));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getChart = (req, res) => {
    const period = req.query.period || 'monthly';
    let data;
    if (period === 'monthly') {
        data = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            sales: Array.from({length: 12}, () => 5000 + Math.random() * 10000),
            revenue: Array.from({length: 12}, () => 8000 + Math.random() * 12000)
        };
    } else {
        data = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            sales: Array.from({length: 7}, () => 1000 + Math.random() * 5000),
            revenue: Array.from({length: 7}, () => 2000 + Math.random() * 8000)
        };
    }
    res.json(data);
};
