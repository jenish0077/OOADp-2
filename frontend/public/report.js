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
    ['Today','Revenue','Profit','Tax'].forEach(function(id) {
        document.getElementById('skel' + id).style.display = show ? 'block' : 'none';
        document.getElementById('val'  + id).style.display = show ? 'none'  : 'block';
        document.getElementById('date' + id).style.display = show ? 'none'  : 'block';
    });
    ['skelD1','skelD2','skelD3','skelD4'].forEach(function(id) {
        document.getElementById(id).style.display = show ? 'block' : 'none';
    });
}

// ── Load stat cards ────────────────────────────────
async function loadStats() {
    try {
        const sessionId = Auth.getSessionId();
        var res = await fetch('/api/report/stats', {
            headers: {
                'Authorization': `Bearer ${sessionId}`
            },
            credentials: 'include'
        });
        if (!res.ok) throw new Error();
        var data = await res.json();
        // Expected: { todaySale, monthlyRevenue, monthlyProfit, monthlyTax }

        showSkeletons(false);
        var today = getToday();
        var range = getMonthRange();
        document.getElementById('valToday').textContent   = fmt(data.todaySale);
        document.getElementById('valRevenue').textContent = fmt(data.monthlyRevenue);
        document.getElementById('valProfit').textContent  = fmt(data.monthlyProfit);
        document.getElementById('valTax').textContent     = fmt(data.monthlyTax);
        document.getElementById('dateToday').textContent   = today;
        document.getElementById('dateRevenue').textContent = range;
        document.getElementById('dateProfit').textContent  = range;
        document.getElementById('dateTax').textContent     = range;

    } catch {
        showSkeletons(false);
        var today = getToday();
        var range = getMonthRange();
        ['Today','Revenue','Profit','Tax'].forEach(function(id) {
            document.getElementById('val'  + id).textContent  = '—';
        });
        document.getElementById('dateToday').textContent   = today;
        document.getElementById('dateRevenue').textContent = range;
        document.getElementById('dateProfit').textContent  = range;
        document.getElementById('dateTax').textContent     = range;
    }
}

// ── Draw bar chart ─────────────────────────────────
function drawBarChart(skincare, makeup, hairCare) {
    if (!skincare && !makeup && !hairCare) {
        document.getElementById('barEmpty').style.display = 'flex';
        document.getElementById('barSvg').style.display   = 'none';
        document.getElementById('barLegend').style.display = 'none';
        return;
    }

    document.getElementById('barEmpty').style.display  = 'none';
    document.getElementById('barSvg').style.display    = 'block';
    document.getElementById('barLegend').style.display = 'flex';

    var max  = Math.max(skincare, makeup, hairCare, 1);
    var step = Math.ceil(max / 4 / 1000) * 1000;

    for (var i = 1; i <= 4; i++) {
        var v = step * i;
        document.getElementById('by' + i).textContent = v >= 1000 ? (v/1000)+'k' : v;
    }

    var chartH = 168; // 220 - 52 = height of chart area
    var barW   = 50;
    var colors = ['#6b8cae', '#d4a574', '#93b4d4'];
    var values = [skincare, makeup, hairCare];
    var xPos   = [110, 210, 310];

    var g = document.getElementById('barGroup');
    g.innerHTML = values.map(function(v, i) {
        var barH = (v / (step * 4)) * chartH;
        var y    = 220 - barH;
        return '<rect x="' + (xPos[i] - barW/2) + '" y="' + y + '" width="' + barW +
               '" height="' + barH + '" rx="4" fill="' + colors[i] + '"/>';
    }).join('');
}

// ── Draw line chart ────────────────────────────────
function drawLineChart(labels, salesData, revenueData) {
    if (!labels || !labels.length) {
        document.getElementById('lineEmpty').style.display = 'flex';
        document.getElementById('lineSvg').style.display   = 'none';
        return;
    }

    document.getElementById('lineEmpty').style.display = 'none';
    document.getElementById('lineSvg').style.display   = 'block';

    var maxVal = Math.max(...salesData, ...revenueData, 1);
    var step   = Math.ceil(maxVal / 4 / 1000) * 1000;

    for (var i = 1; i <= 4; i++) {
        var v = step * i;
        document.getElementById('ly' + i).textContent = v >= 1000 ? (v/1000)+'k' : v;
    }

    var xGroup = document.getElementById('lineXLabels');
    xGroup.innerHTML = '';
    var startX = 60, endX = 720, spanX = endX - startX;
    labels.forEach(function(lbl, idx) {
        var x  = startX + (idx / (labels.length - 1)) * spanX;
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
        return data.map(function(v, i) {
            return (i === 0 ? 'M' : 'L') + ' ' + toX(i) + ',' + toY(v);
        }).join(' ');
    }

    var salesPath = buildPath(salesData);
    document.getElementById('salesLine').setAttribute('d', salesPath);
    document.getElementById('salesFill').setAttribute('d',
        salesPath + ' L ' + toX(salesData.length-1) + ',250 L ' + toX(0) + ',250 Z'
    );
    document.getElementById('revLine').setAttribute('d', buildPath(revenueData));
}

// ── Load bar chart data ────────────────────────────
async function loadBarChart() {
    try {
        const sessionId = Auth.getSessionId();
        var res = await fetch('/api/report/category-sales', {
            headers: {
                'Authorization': `Bearer ${sessionId}`
            },
            credentials: 'include'
        });
        if (!res.ok) throw new Error();
        var data = await res.json();
        // Expected: { skincare, makeup, hairCare }
        drawBarChart(data.skincare, data.makeup, data.hairCare);
    } catch {
        drawBarChart(0, 0, 0);
    }
}

// ── Load line chart data ───────────────────────────
var currentPeriod = 'monthly';

async function loadLineChart(period) {
    currentPeriod = period;
    try {
        const sessionId = Auth.getSessionId();
        var res = await fetch('/api/report/chart?period=' + period, {
            headers: {
                'Authorization': `Bearer ${sessionId}`
            },
            credentials: 'include'
        });
        if (!res.ok) throw new Error();
        var data = await res.json();
        // Expected: { labels: [], sales: [], revenue: [] }
        drawLineChart(data.labels, data.sales, data.revenue);
    } catch {
        drawLineChart([], [], []);
    }
}

function switchTab(period, btn) {
    document.querySelectorAll('.time-tab').forEach(function(t) { t.classList.remove('active'); });
    btn.classList.add('active');
    loadLineChart(period);
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
async function initReport() {
    const isAuth = await Auth.verify();
    if (!isAuth) {
        window.location.href = 'index.html';
        return;
    }
    loadStats();
    loadBarChart();
    loadLineChart('monthly');
}

// Wait for DOM to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReport);
} else {
    initReport();
}