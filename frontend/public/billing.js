const TAX_RATE = 0.13;
let currentCategory = 'Skincare';
let allProducts = [];
let bill = [];
let editMode = false;

// ── ONE sample product for demo ────────────────────
const sampleProducts = {
    'Skincare': [
        { id: 1, name: 'Moisturizing Cream', size: '50ml', price: 2100, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmYJBzMq6yblJ94XDchWtjf_jhI1YYRGRa_w&s' }
    ],
    'Makeup': [],
    'Hair Care': []
};

// ── Load products ──────────────────────────────────
async function loadProducts(category) {
    const grid = document.getElementById('productGrid');

    grid.innerHTML = [1, 2, 3, 4].map(() => `
        <div class="skel-card">
            <div class="skeleton skel-img"></div>
            <div class="skel-lines">
                <div class="skeleton skel-line" style="width:80%"></div>
                <div class="skeleton skel-line" style="width:50%"></div>
                <div class="skeleton skel-line" style="width:60%"></div>
            </div>
        </div>`).join('');

    try {
        const sessionId = Auth.getSessionId();
        const res = await fetch(`/api/products?category=${encodeURIComponent(category)}&inStock=true`, {
            headers: {
                'Authorization': `Bearer ${sessionId}`
            },
            credentials: 'include'
        });
        if (!res.ok) throw new Error();
        allProducts = await res.json();
        renderProducts(allProducts);
    } catch {
        allProducts = sampleProducts[category] || [];
        renderProducts(allProducts);
    }
}

// ── Render product cards ───────────────────────────
function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    if (!products.length) {
        grid.innerHTML = `<div class="empty-state">
            <div class="empty-icon">🛍️</div>
            <p>No products found in this category.</p>
        </div>`;
        return;
    }
    grid.innerHTML = products.map(p => `
        <div class="product-card">
            <div class="card-top">
                ${p.image
                    ? `<img class="prod-img" src="${p.image}" alt="${p.name}">`
                    : `<div class="prod-img-placeholder">🧴</div>`}
                <div class="prod-info">
                    <div class="prod-name">${p.name}</div>
                    <div class="prod-size">${p.size || ''}</div>
                </div>
            </div>
            <div class="card-bottom">
                <span class="prod-price">RS ${p.price.toLocaleString()}</span>
                <button class="add-btn" onclick='addToBill(${JSON.stringify(p)})'>Add</button>
            </div>
        </div>`).join('');
}

// ── Search filter ──────────────────────────────────
function filterProducts() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    renderProducts(allProducts.filter(p => p.name.toLowerCase().includes(q)));
}

// ── Tab switch ─────────────────────────────────────
function switchTab(category, btn) {
    currentCategory = category;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('searchInput').value = '';
    loadProducts(category);
}

// ── Bill logic ─────────────────────────────────────
function addToBill(product) {
    const existing = bill.find(i => i.id === product.id);
    if (existing) {
        existing.qty++;
    } else {
        bill.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
    }
    renderBill();
}

function removeFromBill(id) {
    bill = bill.filter(i => i.id !== id);
    renderBill();
}

function updateQty(id, val) {
    const item = bill.find(i => i.id === id);
    if (item) {
        item.qty = Math.max(1, parseInt(val) || 1);
        renderBill();
    }
}

function clearBill() {
    bill = [];
    editMode = false;
    document.getElementById('editBtn').style.background = '';
    renderBill();
}

// ── Toggle edit mode — shows quantity inputs ───────
function toggleEdit() {
    if (!bill.length) return;
    editMode = !editMode;
    const editBtn = document.getElementById('editBtn');
    editBtn.style.background = editMode ? '#e0f0ff' : '';
    editBtn.style.borderColor = editMode ? '#6b8cae' : '';
    renderBill();
}

function renderBill() {
    const container = document.getElementById('billItems');

    if (!bill.length) {
        container.innerHTML = `<div class="bill-empty">No items added yet.<br>Click "Add" to start billing.</div>`;
        updateTotals(0);
        document.getElementById('generateBtn').disabled = true;
        return;
    }

    document.getElementById('generateBtn').disabled = false;

    // in normal mode: just show name and price, no inputs
    // in edit mode: show quantity input and remove button
    container.innerHTML = bill.map(item => `
        <div class="bill-item">
            <span class="item-name">${item.name}</span>
            ${editMode ? `
                <input class="item-qty" type="number" min="1" value="${item.qty}"
                    onchange="updateQty(${item.id}, this.value)" />
                <button class="remove-btn" onclick="removeFromBill(${item.id})">✕</button>
            ` : `
                <span class="item-qty-label">${item.qty}x</span>
            `}
            <span class="item-price">Rs ${(item.price * item.qty).toLocaleString()}</span>
        </div>`).join('');

    const subtotal = bill.reduce((s, i) => s + i.price * i.qty, 0);
    updateTotals(subtotal);
}

function updateTotals(subtotal) {
    const total = Math.round(subtotal + subtotal * TAX_RATE);
    document.getElementById('subtotalVal').textContent = 'NRP ' + subtotal.toLocaleString();
    document.getElementById('roundedVal').textContent  = 'NRP ' + total.toLocaleString();
    document.getElementById('totalVal').textContent    = 'NRP ' + total.toLocaleString();
}

// ── Generate Bill — saves to backend then prints ───
async function generateBill() {
    if (!bill.length) return;

    const subtotal = bill.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + tax;
    const billId = 'BILL-' + Date.now();
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    // save to backend
    try {
        const sessionId = Auth.getSessionId();
        const res = await fetch('/api/bills', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionId}`
            },
            body: JSON.stringify({ billId, items: bill, subtotal, tax, total }),
            credentials: 'include'
        });
        if (!res.ok) throw new Error();
    } catch {
        // backend not ready yet — print anyway
    }

    // build print content
    const printContent = `
        <div style="font-family:'Segoe UI',sans-serif; max-width:400px; margin:0 auto; padding:30px;">
            <h2 style="text-align:center; color:#1e293b; margin-bottom:4px;">Velour</h2>
            <p style="text-align:center; color:#94a3b8; font-size:13px; margin-bottom:20px;">${date}</p>
            <p style="font-size:12px; color:#94a3b8; margin-bottom:16px;">Bill ID: ${billId}</p>
            <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
                <thead>
                    <tr style="border-bottom:2px solid #e2e8f0;">
                        <th style="text-align:left; padding:8px 0; font-size:12px; color:#64748b;">Item</th>
                        <th style="text-align:center; padding:8px 0; font-size:12px; color:#64748b;">Qty</th>
                        <th style="text-align:right; padding:8px 0; font-size:12px; color:#64748b;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${bill.map(i => `
                    <tr style="border-bottom:1px solid #f1f5f9;">
                        <td style="padding:8px 0; font-size:14px;">${i.name}</td>
                        <td style="padding:8px 0; font-size:14px; text-align:center;">${i.qty}</td>
                        <td style="padding:8px 0; font-size:14px; text-align:right;">Rs ${(i.price * i.qty).toLocaleString()}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
            <div style="border-top:1px solid #e2e8f0; padding-top:12px;">
                <div style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:6px; color:#374151;">
                    <span>Subtotal</span><span>Rs ${subtotal.toLocaleString()}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:14px; margin-bottom:6px; color:#374151;">
                    <span>Tax (13%)</span><span>Rs ${tax.toLocaleString()}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:700; color:#1e293b; border-top:1px solid #e2e8f0; padding-top:10px; margin-top:6px;">
                    <span>Total</span><span>Rs ${total.toLocaleString()}</span>
                </div>
            </div>
            <p style="text-align:center; margin-top:30px; color:#94a3b8; font-size:12px;">Thank you for your purchase!</p>
        </div>`;

    // open a clean print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bill - ${billId}</title>
            <style>
                body { margin: 0; padding: 0; }
                @media print {
                    .no-print { display: none !important; }
                }
            </style>
        </head>
        <body>
            ${printContent}
            <div class="no-print" style="text-align:center; margin-top:20px;">
                <button onclick="window.print(); window.close();"
                    style="padding:10px 30px; background:#6b8cae; color:white;
                    border:none; border-radius:8px; font-size:15px; cursor:pointer;">
                    🖨️ Print Bill
                </button>
                <button onclick="window.close();"
                    style="padding:10px 30px; background:#f1f5f9; color:#374151;
                    border:none; border-radius:8px; font-size:15px; cursor:pointer; margin-left:10px;">
                    Close
                </button>
            </div>
        </body>
        </html>`);
    printWindow.document.close();
    clearBill();
}

// ── Profile dropdown ───────────────────────────────
document.getElementById('profileBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    document.getElementById('profileDropdown').classList.toggle('open');
});
document.addEventListener('click', function () {
    document.getElementById('profileDropdown').classList.remove('open');
});
document.getElementById('dropdownLogout').addEventListener('click', function () {
    handleLogout();
});
document.getElementById('logoutBtn').addEventListener('click', function () {
    handleLogout();
});

async function handleLogout() {
    try {
        await Auth.logout();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
}

// ── Init ───────────────────────────────────────────
async function initBilling() {
    const isAuth = await Auth.verify();
    if (!isAuth) {
        window.location.href = 'index.html';
        return;
    }
    loadProducts('Skincare');
}

// Wait for DOM to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBilling);
} else {
    initBilling();
}