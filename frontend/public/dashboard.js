// ── Format number: 15000 → "NRP 15k" ──────────────
function fmt(n) {
    if (n == null) return '—';
    if (n >= 1000000) return 'NRP ' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return 'NRP ' + Math.round(n / 1000) + 'k';
    return 'NRP ' + n;
}

function getToday() {
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getMonthRange() {
    var now = new Date();
    var startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    var todayShort = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return startOfMonth + ' – ' + todayShort;
}

function scheduleMidnight() {
    var now = new Date(), next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    setTimeout(function () { loadDashboard(); scheduleMidnight(); }, next - now);
}

// ── Show/hide skeletons ────────────────────────────
function showSkeletons(show) {
    var ids = ['TotalProducts', 'DailySales', 'MonthlyRevenue'];
    ids.forEach(function (id) {
        document.getElementById('skel' + id).style.display = show ? 'block' : 'none';
        document.getElementById('val'  + id).style.display = show ? 'none'  : 'block';
        document.getElementById('date' + id).style.display = show ? 'none'  : 'block';
    });
    document.getElementById('skelDate1').style.display = show ? 'block' : 'none';
    document.getElementById('skelDate2').style.display = show ? 'block' : 'none';
    document.getElementById('skelDate3').style.display = show ? 'block' : 'none';
}

// ── Load stat cards from API ───────────────────────
async function loadStats() {
    try {
        const sessionId = Auth.getSessionId();
        var res = await fetch('/api/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${sessionId}`
            },
            credentials: 'include'
        });
        if (!res.ok) throw new Error();
        var data = await res.json();
        // Expected from backend: { totalProducts, dailySales, monthlyRevenue }

        showSkeletons(false);
        var today = getToday();
        document.getElementById('valTotalProducts').textContent  = data.totalProducts ?? '—';
        document.getElementById('valDailySales').textContent     = fmt(data.dailySales);
        document.getElementById('valMonthlyRevenue').textContent = fmt(data.monthlyRevenue);
        document.getElementById('dateTotalProducts').textContent  = today;
        document.getElementById('dateDailySales').textContent     = today;
        document.getElementById('dateMonthlyRevenue').textContent = getMonthRange();

    } catch (err) {
        showSkeletons(false);
        var today = getToday();
        document.getElementById('valTotalProducts').textContent  = '—';
        document.getElementById('valDailySales').textContent     = '—';
        document.getElementById('valMonthlyRevenue').textContent = '—';
        document.getElementById('dateTotalProducts').textContent  = today;
        document.getElementById('dateDailySales').textContent     = today;
        document.getElementById('dateMonthlyRevenue').textContent = getMonthRange();
    }
}

// ── Load top products table from API ──────────────
async function loadTopProducts() {
    try {
        const sessionId = Auth.getSessionId();
        var res = await fetch('/api/dashboard/top-products', {
            headers: {
                'Authorization': `Bearer ${sessionId}`
            },
            credentials: 'include'
        });
        if (!res.ok) throw new Error();
        var products = await res.json();
        // Expected from backend: [{ name, category, inStock, totalSales }]

        document.getElementById('skeletonTable').style.display = 'none';

        if (!products || products.length === 0) {
            document.getElementById('tableEmpty').style.display = 'block';
            return;
        }

        var tbody = document.getElementById('tableBody');
        tbody.innerHTML = products.map(function (p, i) {
            return '<tr>' +
                '<td>' + (i + 1) + '</td>' +
                '<td style="font-weight:500">' + p.name + '</td>' +
                '<td>' + p.category + '</td>' +
                '<td><span class="stock-status ' + (p.inStock ? 'in-stock' : 'out-stock') + '">' +
                    (p.inStock ? 'In Stock' : 'Out of Stock') + '</span></td>' +
                '<td>' + fmt(p.totalSales) + '</td>' +
            '</tr>';
        }).join('');
        document.getElementById('realTable').style.display = 'table';

    } catch (err) {
        document.getElementById('skeletonTable').style.display = 'none';
        document.getElementById('tableEmpty').style.display = 'block';
    }
}

// ── Draw SVG chart ─────────────────────────────────
function drawChart(labels, salesData, revenueData) {
    if (!labels || !labels.length) {
        document.getElementById('chartEmpty').style.display = 'flex';
        document.getElementById('chartSvg').style.display   = 'none';
        return;
    }

    document.getElementById('chartEmpty').style.display = 'none';
    document.getElementById('chartSvg').style.display   = 'block';

    var maxVal = Math.max(...salesData, ...revenueData, 1);
    var step = Math.ceil(maxVal / 4 / 1000) * 1000;

    for (var i = 1; i <= 4; i++) {
        var v = step * i;
        document.getElementById('yLabel' + i).textContent = v >= 1000 ? (v / 1000) + 'k' : v;
    }

    var xGroup = document.getElementById('xLabels');
    xGroup.innerHTML = '';
    var startX = 60, endX = 720, spanX = endX - startX;
    labels.forEach(function (lbl, idx) {
        var x = startX + (idx / (labels.length - 1)) * spanX;
        var el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        el.setAttribute('x', x);
        el.setAttribute('y', 275);
        el.setAttribute('text-anchor', 'middle');
        el.setAttribute('fill', '#64748b');
        el.setAttribute('font-size', '12');
        el.textContent = lbl;
        xGroup.appendChild(el);
    });

    function toY(val) { return 250 - (val / (step * 4)) * 200; }
    function toX(idx) { return startX + (idx / (labels.length - 1)) * spanX; }
    function buildPath(data) {
        return data.map(function (v, i) {
            return (i === 0 ? 'M' : 'L') + ' ' + toX(i) + ',' + toY(v);
        }).join(' ');
    }

    var salesPath = buildPath(salesData);
    document.getElementById('salesLine').setAttribute('d', salesPath);
    document.getElementById('salesFill').setAttribute('d',
        salesPath + ' L ' + toX(salesData.length - 1) + ',250 L ' + toX(0) + ',250 Z'
    );
    document.getElementById('revenueLine').setAttribute('d', buildPath(revenueData));
}

// ── Load chart data from API ───────────────────────
var currentPeriod = 'monthly';

async function loadChart(period) {
    currentPeriod = period;
    try {
        const sessionId = Auth.getSessionId();
        var res = await fetch('/api/dashboard/chart?period=' + period, {
            headers: {
                'Authorization': `Bearer ${sessionId}`
            },
            credentials: 'include'
        });
        if (!res.ok) throw new Error();
        var data = await res.json();
        // Expected from backend: { labels: [], sales: [], revenue: [] }
        drawChart(data.labels, data.sales, data.revenue);
    } catch (err) {
        drawChart([], [], []);
    }
}

function switchTab(period, btn) {
    document.querySelectorAll('.time-tab').forEach(function (t) { t.classList.remove('active'); });
    btn.classList.add('active');
    loadChart(period);
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

// Handle logout
async function handleLogout() {
    try {
        await Auth.logout();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Force redirect even if logout fails
        window.location.href = 'index.html';
    }
}

// ── Init ───────────────────────────────────────────
async function initializePage() {
    // Check authentication first
    const isAuth = await Auth.verify();
    if (!isAuth) {
        window.location.href = 'index.html';
        return;
    }

    // Set username display
    const username = Auth.getUsername();
    const userDisplays = document.querySelectorAll('[data-username]');
    userDisplays.forEach(el => el.textContent = username);

    loadDashboard();
    scheduleMidnight();
}

function loadDashboard() {
    showSkeletons(true);
    document.getElementById('skeletonTable').style.display = 'table';
    document.getElementById('realTable').style.display     = 'none';
    document.getElementById('tableEmpty').style.display    = 'none';
    loadStats();
    loadTopProducts();
    loadChart('monthly');
}

// Start initialization when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}