// ── DATE ──
function getToday() {
    return new Date().toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'});
}

function setDates() {
    var d = getToday();
    ['d0','d1','d2','d3'].forEach(function(id) {
        document.getElementById(id).textContent = d;
    });
}

function scheduleMidnight() {
    var now  = new Date();
    var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    setTimeout(function() { setDates(); scheduleMidnight(); }, next - now);
}

// ── PRODUCTS DATA ──
var products = [];
var nextId           = 102;
var currentCategory  = 'skincare';
var currentPage      = 1;
var ITEMS_PER_PAGE   = 5;
var filteredProducts = [];
var deleteTargetId   = null;

// ── INIT ──
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const isAuth = await Auth.verify();
    if (!isAuth) {
        window.location.href = 'index.html';
        return;
    }

    setDates();
    scheduleMidnight();
    fetchProducts().then(() => {
        showCategory('skincare');
        bindEvents();
    });
});

async function fetchProducts() {
    try {
        const res = await fetch('/api/products', {
            headers: {
                'Authorization': `Bearer ${Auth.getSessionId()}`
            },
            credentials: 'include'
        });
        if (res.ok) {
            products = await res.json();
            updateStats();
            populateFilters();
        }
    } catch (e) {
        console.error("Failed to fetch products:", e);
    }
}

// ── SHOW CATEGORY (clicking stat cards) ──
function showCategory(cat) {
    currentCategory = cat;
    currentPage = 1;

    ['all','skincare','makeup','haircare'].forEach(function(c) {
        document.getElementById('card-' + c).classList.remove('active');
    });
    document.getElementById('card-' + cat).classList.add('active');

    document.getElementById('searchInput').value  = '';
    document.getElementById('brandFilter').value  = '';
    document.getElementById('subCatFilter').value = '';

    filterAndRender();
}

// ── FILTER AND RENDER ──
function filterAndRender() {
    var q  = document.getElementById('searchInput').value.toLowerCase().trim();
    var br = document.getElementById('brandFilter').value;
    var sc = document.getElementById('subCatFilter').value;

    filteredProducts = products.filter(function(p) {
        var matchCat = (currentCategory === 'all') || (p.category.toLowerCase() === currentCategory);
        var matchQ   = !q  || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
        var matchBr  = !br || p.brand === br;
        var matchSc  = !sc || p.subCategory === sc;
        return matchCat && matchQ && matchBr && matchSc;
    });

    renderTable();
    updatePagination();
}

// ── RENDER TABLE ──
function renderTable() {
    var tbody   = document.getElementById('tableBody');
    var empty   = document.getElementById('emptyState');
    var table   = document.getElementById('mainTable');
    var pagWrap = document.getElementById('paginationWrap');
    var slice   = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    tbody.innerHTML = '';

    if (!slice.length) {
        table.style.display   = 'none';
        empty.style.display   = 'flex';
        pagWrap.style.display = 'none';
        return;
    }

    table.style.display   = '';
    empty.style.display   = 'none';
    pagWrap.style.display = 'flex';

    slice.forEach(function(p) {
        var ins = p.stock > 0;
        var tr  = document.createElement('tr');
        tr.innerHTML =
            '<td style="color:#94a3b8;font-size:13px">' + p.id + '</td>' +
            '<td style="font-weight:500">' + esc(p.name) + '</td>' +
            '<td>' + esc(p.brand) + '</td>' +
            '<td>' + esc(p.subCategory) + '</td>' +
            '<td style="font-weight:600">' + p.price.toLocaleString() + '</td>' +
            '<td><span class="badge ' + (ins ? 'badge-in' : 'badge-out') + '">' + (ins ? 'In stock' : 'Out of stock') + '</span></td>' +
            '<td><div class="action-btns">' +
            '<button class="btn-edit" onclick="openEditModal(' + p.id + ')">Edit</button>' +
            '<button class="btn-del"  onclick="openDeleteModal(' + p.id + ')">Delete</button>' +
            '</div></td>';
        tbody.appendChild(tr);
    });
}

// ── UPDATE STATS ──
function updateStats() {
    document.getElementById('statTotal').textContent    = products.length;
    document.getElementById('statSkincare').textContent = products.filter(function(p) { return p.category === 'Skincare'; }).length;
    document.getElementById('statMakeup').textContent   = products.filter(function(p) { return p.category === 'Makeup'; }).length;
    document.getElementById('statHaircare').textContent = products.filter(function(p) { return p.category === 'Haircare'; }).length;
}

// ── PAGINATION ──
function updatePagination() {
    var total  = filteredProducts.length;
    var pages  = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
    var start  = total === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
    var end    = Math.min(currentPage * ITEMS_PER_PAGE, total);

    document.getElementById('pageInfo').textContent = start + '-' + end + ' of ' + total;

    var pag = document.getElementById('pagination');
    pag.innerHTML = '';

    var prev = document.createElement('button');
    prev.innerHTML = '&#8249;';
    prev.disabled  = (currentPage <= 1);
    prev.onclick   = function() { if (currentPage > 1) { currentPage--; renderTable(); updatePagination(); } };
    pag.appendChild(prev);

    for (var i = 1; i <= pages; i++) {
        (function(pg) {
            var b = document.createElement('button');
            b.textContent = pg;
            if (pg === currentPage) b.classList.add('active');
            b.onclick = function() { currentPage = pg; renderTable(); updatePagination(); };
            pag.appendChild(b);
        })(i);
    }

    var next = document.createElement('button');
    next.innerHTML = '&#8250;';
    next.disabled  = (currentPage >= pages);
    next.onclick   = function() { if (currentPage < pages) { currentPage++; renderTable(); updatePagination(); } };
    pag.appendChild(next);
}

// ── POPULATE FILTER DROPDOWNS ──
function populateFilters() {
    var brands = [...new Set(products.map(function(p) { return p.brand; }))].sort();
    var bSel = document.getElementById('brandFilter');
    while (bSel.options.length > 1) bSel.remove(1);
    brands.forEach(function(b) {
        var o = document.createElement('option');
        o.value = b; o.textContent = b; bSel.appendChild(o);
    });

    var subcats = [...new Set(products.map(function(p) { return p.subCategory; }))].sort();
    var sSel = document.getElementById('subCatFilter');
    while (sSel.options.length > 1) sSel.remove(1);
    subcats.forEach(function(s) {
        var o = document.createElement('option');
        o.value = s; o.textContent = s; sSel.appendChild(o);
    });
}

// ── ADD MODAL ──
function openAddModal() {
    document.getElementById('modalTitle').textContent  = 'Add New Product';
    document.getElementById('editId').value            = '';
    document.getElementById('fieldName').value         = '';
    document.getElementById('fieldBrand').value        = '';
    document.getElementById('fieldCategory').value     = '';
    document.getElementById('fieldSubCat').value       = '';
    document.getElementById('fieldPrice').value        = '';
    document.getElementById('fieldStock').value        = '';
    document.getElementById('formError').textContent   = '';
    document.getElementById('modalOverlay').classList.add('open');
    setTimeout(function() { document.getElementById('fieldName').focus(); }, 100);
}

// ── EDIT MODAL ──
function openEditModal(id) {
    var p = products.find(function(x) { return x.id === id; });
    if (!p) return;
    document.getElementById('modalTitle').textContent  = 'Edit Product';
    document.getElementById('editId').value            = id;
    document.getElementById('fieldName').value         = p.name;
    document.getElementById('fieldBrand').value        = p.brand;
    document.getElementById('fieldCategory').value     = p.category;
    document.getElementById('fieldSubCat').value       = p.subCategory;
    document.getElementById('fieldPrice').value        = p.price;
    document.getElementById('fieldStock').value        = p.stock;
    document.getElementById('formError').textContent   = '';
    document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
}

// ── SAVE (Add or Edit) ──
async function saveProduct() {
    var name        = document.getElementById('fieldName').value.trim();
    var brand       = document.getElementById('fieldBrand').value.trim();
    var category    = document.getElementById('fieldCategory').value;
    var subCategory = document.getElementById('fieldSubCat').value.trim() || category;
    var price       = parseFloat(document.getElementById('fieldPrice').value);
    var stock       = parseInt(document.getElementById('fieldStock').value);
    var err         = document.getElementById('formError');

    if (!name || !brand || !category || isNaN(price) || isNaN(stock)) {
        err.textContent = 'Please fill in all required fields.'; return;
    }
    if (price < 0 || stock < 0) {
        err.textContent = 'Price and Stock cannot be negative.'; return;
    }
    err.textContent = '';

    var eid = document.getElementById('editId').value;
    const prodData = { name, brand, category, subCategory, price, stock };

    try {
        const sessionId = Auth.getSessionId();
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionId}`
        };

        if (eid) {
            // Editing existing product
            const res = await fetch('/api/products/' + eid, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(prodData),
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to update product');
        } else {
            // Adding new product
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(prodData),
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to add product');
        }
        closeModal();
        await fetchProducts();
        filterAndRender();
    } catch (e) {
        err.textContent = 'Failed to save product: ' + e.message;
    }
}

// ── DELETE MODAL ──
function openDeleteModal(id) {
    var p = products.find(function(x) { return x.id === id; });
    if (!p) return;
    deleteTargetId = id;
    document.getElementById('deleteName').textContent = p.name;
    document.getElementById('deleteOverlay').classList.add('open');
}

function closeDeleteModal() {
    document.getElementById('deleteOverlay').classList.remove('open');
    deleteTargetId = null;
}

function confirmDelete() {
    if (deleteTargetId === null) return;
    const sessionId = Auth.getSessionId();
    fetch('/api/products/' + deleteTargetId, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${sessionId}`
        },
        credentials: 'include'
    })
        .then(res => {
            if (!res.ok) throw new Error('Failed to delete');
            closeDeleteModal();
            return fetchProducts();
        })
        .then(() => filterAndRender())
        .catch(e => {
            console.error("Failed to delete", e);
            alert('Failed to delete product: ' + e.message);
        });
}

// ── BIND ALL EVENTS ──
function bindEvents() {
    document.getElementById('addBtn').addEventListener('click', openAddModal);
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    document.getElementById('saveBtn').addEventListener('click', saveProduct);
    document.getElementById('modalOverlay').addEventListener('click', function(e) {
        if (e.target === e.currentTarget) closeModal();
    });

    document.getElementById('deleteClose').addEventListener('click', closeDeleteModal);
    document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    document.getElementById('deleteOverlay').addEventListener('click', function(e) {
        if (e.target === e.currentTarget) closeDeleteModal();
    });

    document.getElementById('profileBtn').addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('profileDropdown').classList.toggle('open');
    });
    document.addEventListener('click', function() {
        document.getElementById('profileDropdown').classList.remove('open');
    });

    document.getElementById('dropdownLogout').addEventListener('click', function() {
        handleLogout();
    });
    document.getElementById('logoutBtn').addEventListener('click', function() {
        handleLogout();
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') { closeModal(); closeDeleteModal(); }
    });
}

async function handleLogout() {
    try {
        await Auth.logout();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
}

// ── HELPER ──
function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}