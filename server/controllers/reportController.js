exports.getReportStats = (req, res) => {
    res.json({
        totalRevenue: 560000,
        totalOrders: 340,
        avgOrderValue: 1647
    });
};

exports.getCategorySales = (req, res) => {
    res.json([
        { category: 'Skincare', sales: 45 },
        { category: 'Makeup', sales: 30 },
        { category: 'Haircare', sales: 15 },
        { category: 'Fragrance', sales: 10 }
    ]);
};

exports.getChart = (req, res) => {
    res.json({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        sales: [120, 150, 180, 130, 200, 250],
        revenue: [150000, 180000, 210000, 160000, 240000, 300000]
    });
};
