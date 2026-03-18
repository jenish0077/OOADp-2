const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
    id: { type: Number, required: true }, // refers to Product.id
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
});

const billSchema = new mongoose.Schema({
    billId: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    items: [billItemSchema] // Embed bill items directly in the Bill document
}, {
    timestamps: true
});

billSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        delete returnedObject.__v;
    }
});

const Bill = mongoose.model('Bill', billSchema);
module.exports = Bill;
