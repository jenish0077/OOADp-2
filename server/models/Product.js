const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true }, // We'll manually keep the numeric id for frontend compatibility
    name: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    image: { type: String, default: '' }
}, {
    timestamps: true
});

// Since the frontend uses "id" rather than "_id", let's transform the output to match what the frontend expects.
productSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        // the frontend expects 'id' as the numeric ID we created, not the Mongo ObjectId, 
        // though it might accidentally use '_id'. We'll ensure 'id' is present.
        delete returnedObject.__v;
    }
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
