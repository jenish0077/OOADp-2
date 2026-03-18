const Bill = require('../models/Bill');
const Product = require('../models/Product');

exports.createBill = async (req, res) => {
    try {
        const { billId, items, subtotal, tax, total } = req.body;
        const date = new Date().toISOString().split('T')[0];

        const newBill = new Bill({
            billId,
            date,
            subtotal,
            tax,
            total,
            items
        });

        await newBill.save();

        // Update product stock
        for (let item of items) {
            await Product.findOneAndUpdate(
                { id: item.id },
                { $inc: { stock: -item.qty } }
            );
        }

        res.json({ success: true, message: 'Bill saved successfully', billId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
