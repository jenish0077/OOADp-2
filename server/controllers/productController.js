const Product = require('../models/Product');

// --- Product Controllers ---
exports.getProducts = async (req, res) => {
    try {
        const category = req.query.category || 'All';
        let query = {};
        if (category !== 'All' && category !== 'undefined') {
            // Case-insensitive regex search for category
            query.category = { $regex: new RegExp('^' + category + '$', 'i') };
        }
        // Exclude _id, __v from output optionally, but we depend on our JSON transform.
        const products = await Product.find(query).sort({ id: 1 }).lean();
        // lean() returns plain objects. let's format it for frontend.
        const formatted = products.map(p => {
            const copy = { ...p };
            delete copy._id;
            delete copy.__v;
            return copy;
        });
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, brand, category, subCategory, price, stock, image } = req.body;
        
        // Find max ID logic
        const latest = await Product.findOne().sort({ id: -1 });
        const newId = latest && latest.id ? latest.id + 1 : 101; 

        const product = new Product({
            id: newId,
            name,
            brand,
            category,
            subCategory: subCategory || category,
            price,
            stock,
            image: image || ''
        });

        await product.save();
        res.status(201).json({ id: newId, ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, brand, category, subCategory, price, stock, image } = req.body;
        
        const updated = await Product.findOneAndUpdate(
            { id },
            { name, brand, category, subCategory: subCategory || category, price, stock, image: image || '' },
            { new: true }
        );
        
        if (!updated) return res.status(404).json({ error: 'Product not found' });
        res.json({ updated: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await Product.findOneAndDelete({ id });
        if (!deleted) return res.status(404).json({ error: 'Product not found' });
        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getProductStats = async (req, res) => {
    try {
        const allProducts = await Product.find();
        let lowStock = 0;
        let outOfStock = 0;
        let totalValue = 0;

        allProducts.forEach(p => {
            if (p.stock <= 10 && p.stock > 0) lowStock++;
            if (p.stock === 0) outOfStock++;
            totalValue += p.price * p.stock;
        });

        res.json({
            totalProducts: allProducts.length,
            lowStock,
            outOfStock,
            totalValue
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
