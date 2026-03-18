const Bill = require('../models/Bill');

exports.getSalesStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const thisMonth = today.substring(0, 7);
        
        const todayBills = await Bill.find({ date: today });
        const todaySale = todayBills.reduce((acc, b) => acc + b.total, 0);
        const totalBills = todayBills.length;
        
        const monthlyBills = await Bill.find({ date: { $regex: '^' + thisMonth } });
        const monthlyRevenue = monthlyBills.reduce((acc, b) => acc + b.total, 0);

        res.json({ todaySale, totalBills, monthlyRevenue });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSalesList = async (req, res) => {
    try {
        const bills = await Bill.find().sort({ createdAt: -1 }).lean();
        
        const salesList = bills.map(b => {
             const itemCount = b.items.reduce((sum, item) => sum + item.qty, 0);
             return {
                 billId: b.billId,
                 date: b.date,
                 itemCount,
                 totalAmount: b.total,
                 paymentMethod: 'Cash' // hardcoded or add to schema later
             };
        });
        
        res.json(salesList);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
