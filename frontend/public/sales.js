const ROWS_PER_PAGE = 7;
let allSales = [];
let filteredSales = [];
let currentPage = 1;

// ── Format number ──────────────────────────────────
function fmt(n) {
    if (n == null) return '—';
    if (n >= 1000000) return 'RS ' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return 'RS ' + Math.round(n / 1000) + 'k';
    return 'RS ' + n;
}

function getToday() {
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getMonthRange() {
    var now = new Date();
    var start = new Date(now.getFullYear(), now.getMonth(), 1)
        .toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    var end = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return start + ' – ' + end;
}

// ── Skeletons ──────────────────────────────────────
function showSkeletons(show) {
    ['TodaySale', 'TotalBills', 'MonthlyRev'].forEach(function(id) {
        document.getElementById('skel' + id).style.display = show ? 'block' : 'none';
        document.getElementById('val'  + id).style.display = show ? 'none'  : 'block';
        document.getElementById('date' + id).style.display = show ? 'none'  : 'block';
    });
    document.getElementById('skelDate1').style.display = show ? 'block' : 'none';
    document.getElementById('skelDate2').style.display = show ? 'block' : 'none';
    document.getElementById('skelDate3').style.display = show ? 'block' : 'none';
}

// ── Load stat cards ────────────────────────────────
async function loadStats() {
    try {
        const sessionId = Auth.getSessionId();
        var res = await fetch('/api/sales/stats', {
            headers: {
                'Authorization': `Bearer ${sessionId}`
            },
            credentials: 'include'
        });
        if (!res.ok) throw new Error();
        var data = await res.json();
        // Expected: { todaySale, totalBills, monthlyRevenue }

        showSkeletons(false);
        document.getElementById('valTodaySale').textContent  = fmt(data.todaySale);
        document.getElementById('valTotalBills').textContent = data.totalBills ?? '—';
        document.getElementById('valMonthlyRev').textContent = fmt(data.monthlyRevenue);
        document.getElementById('dateTodaySale').textContent  = getToday();
        document.getElementById('dateTotalBills').textContent = getToday();
        document.getElementById('dateMonthlyRev').textContent = getMonthRange();

    } catch {
        showSkeletons(false);
        document.getElementById('valTodaySale').textContent  = '—';
        document.getElementById('valTotalBills').textContent = '—';
        document.getElementById('valMonthlyRev').textContent = '—';
        document.getElementById('dateTodaySale').textContent  = getToday();
        document.getElementById('dateTotalBills').textContent = getToday();
        document.getElementById('dateMonthlyRev').textContent = getMonthRange();
    }
}

// ── Load sales table ───────────────────────────────
async function loadSales() {
    try {
        var res = await fetch('/api/sales');
        if (!res.ok) throw new Error();
        allSales = await res.json();
        // Expected: [{ billId, date, itemCount, totalAmount, paymentMethod }]

        document.getElementById('skeletonTable').style.display = 'none';

        if (!allSales.length) {
            document.getElementById('tableEmpty').style.display = 'block';
            return;
        }

        filteredSales = [...allSales];
        renderTable();

    } catch {
        document.getElementById('skeletonTable').style.display = 'none';
        document.getElementById('tableEmpty').style.display = 'block';
    }
}

// ── Render table rows with pagination ─────────────
function renderTable() {
    var start = (currentPage - 1) * ROWS_PER_PAGE;
    var end   = start + ROWS_PER_PAGE;
    var pageData = filteredSales.slice(start, end);

    if (!filteredSales.length) {
        document.getElementById('realTable').style.display = 'none';
        document.getElementById('tableEmpty').style.display = 'block';
        document.getElementById('pagination').style.display = 'none';
        return;
    }

    document.getElementById('tableEmpty').style.display = 'none';
    document.getElementById('realTable').style.display  = 'table';
    document.getElementById('pagination').style.display = 'flex';

    document.getElementById('tableBody').innerHTML = pageData.map(function(s) {
        return '<tr>' +
            '<td>' + s.billId + '</td>' +
            '<td>' + s.date + '</td>' +
            '<td>' + s.itemCount + '</td>' +
            '<td style="font-weight:600">Rs ' + s.totalAmount.toLocaleString() + '</td>' +
            '<td>' + s.paymentMethod + '</td>' +
            '<td><button class="view-btn" onclick="viewBill(\'' + s.billId + '\')">View</button></td>' +
        '</tr>';
    }).join('');

    var total = filteredSales.length;
    var totalPages = Math.ceil(total / ROWS_PER_PAGE);
    document.getElementById('pageInfo').textContent =
        (start + 1) + '-' + Math.min(end, total) + ' of ' + total;
    document.getElementById('pageNum').textContent  = currentPage;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages;
}

// ── Pagination ─────────────────────────────────────
function changePage(dir) {
    var totalPages = Math.ceil(filteredSales.length / ROWS_PER_PAGE);
    currentPage = Math.max(1, Math.min(currentPage + dir, totalPages));
    renderTable();
}

// ── Filter by bill id and date ─────────────────────
function filterTable() {
    var billQ = document.getElementById('billIdFilter').value.toLowerCase();
    var dateQ = document.getElementById('dateFilter').value.toLowerCase();

    filteredSales = allSales.filter(function(s) {
        var matchBill = !billQ || String(s.billId).toLowerCase().includes(billQ);
        var matchDate = !dateQ || s.date.toLowerCase().includes(dateQ);
        return matchBill && matchDate;
    });

    currentPage = 1;
    renderTable();
}

// ── View individual bill ───────────────────────────
function viewBill(billId) {
    // when backend is ready this will fetch and show bill details
    // for now just alert the bill id
    alert('Bill ID: ' + billId + '\nFull bill details will load from backend.');
}

// ── Profile dropdown ───────────────────────────────
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
async function initSales() {
    const isAuth = await Auth.verify();
    if (!isAuth) {
        window.location.href = 'index.html';
        return;
    }
    loadStats();
    loadSales();
}

// Wait for DOM to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSales);
} else {
    initSales();
}