// JHON338xDEVICES - Financial
// Catat pemasukan, pengeluaran, daftar belanja & nota

(function() {
    'use strict';

    // ========== STORAGE ==========
    var STORAGE_KEY = 'jhon338_financial';

    function loadData() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (!parsed.transactions) parsed.transactions = [];
                if (!parsed.items) parsed.items = [];
                if (!parsed.name) parsed.name = 'Jhon338';
                return parsed;
            }
        } catch (e) {}
        return { name: 'Jhon338', transactions: [], items: [] };
    }

    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    var data = loadData();

    // ========== FORMAT RUPIAH ==========
    function formatRupiah(angka) {
        if (isNaN(angka)) return '0';
        return angka.toLocaleString('id-ID');
    }

    function parseRupiah(str) {
        if (typeof str === 'string') {
            return parseInt(str.replace(/\D/g, '')) || 0;
        }
        return parseInt(str) || 0;
    }

    // ========== DOM ELEMENTS ==========
    var nameInput = document.getElementById('nameInput');
    var saveNameBtn = document.getElementById('saveNameBtn');
    var balanceNum = document.getElementById('balanceNum');
    var totalIncome = document.getElementById('totalIncome');
    var totalExpense = document.getElementById('totalExpense');
    var headerBalance = document.getElementById('header-balance');
    var financeInput = document.getElementById('financeInput');
    var addIncomeBtn = document.getElementById('addIncomeBtn');
    var addExpenseBtn = document.getElementById('addExpenseBtn');
    var undoBtn = document.getElementById('undoBtn');
    var itemNameInput = document.getElementById('itemNameInput');
    var itemPriceInput = document.getElementById('itemPriceInput');
    var itemQtyInput = document.getElementById('itemQtyInput');
    var addItemBtn = document.getElementById('addItemBtn');
    var itemList = document.getElementById('itemList');
    var historyList = document.getElementById('historyList');
    var showNotaBtn = document.getElementById('showNotaBtn');
    var clearItemsBtn = document.getElementById('clearItemsBtn');
    var resetBtn = document.getElementById('resetBtn');
    var notaModal = document.getElementById('notaModal');
    var notaContent = document.getElementById('notaContent');
    var closeNotaBtn = document.getElementById('closeNotaBtn');
    var downloadNotaBtn = document.getElementById('downloadNotaBtn');

    // ========== INIT ==========
    nameInput.value = data.name;

    // Format input
    financeInput.addEventListener('input', function() {
        var raw = this.value.replace(/\D/g, '');
        var num = parseInt(raw) || 0;
        this.value = formatRupiah(num);
    });

    itemPriceInput.addEventListener('input', function() {
        var raw = this.value.replace(/\D/g, '');
        var num = parseInt(raw) || 0;
        this.value = formatRupiah(num);
    });

    // ========== RENDER ==========
    function renderAll() {
        var totalMasuk = 0;
        var totalKeluar = 0;

        data.transactions.forEach(function(t) {
            if (t.type === 'income') totalMasuk += t.amount;
            else totalKeluar += t.amount;
        });

        var saldo = totalMasuk - totalKeluar;

        balanceNum.textContent = 'Rp ' + formatRupiah(saldo);
        totalIncome.textContent = 'Rp ' + formatRupiah(totalMasuk);
        totalExpense.textContent = 'Rp ' + formatRupiah(totalKeluar);
        headerBalance.textContent = 'Rp ' + formatRupiah(saldo);

        // Render items
        if (data.items.length === 0) {
            itemList.innerHTML = '<div class="empty-state"><i class="fas fa-shopping-basket"></i><p>Belum ada barang</p></div>';
        } else {
            var itemHTML = '';
            data.items.forEach(function(item, i) {
                var qty = item.qty || 1;
                var subtotal = item.price * qty;
                itemHTML += '<div class="item-row">' +
                    '<span class="item-name"><span class="item-qty-badge">' + qty + 'x</span> ' + escapeHTML(item.name) + '</span>' +
                    '<span class="item-subtotal">Rp ' + formatRupiah(subtotal) + '</span>' +
                    '</div>';
            });
            itemList.innerHTML = itemHTML;
        }

        // Render history
        if (data.transactions.length === 0) {
            historyList.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><p>Belum ada riwayat</p></div>';
        } else {
            var historyHTML = '';
            var show = data.transactions.slice(-15).reverse();
            show.forEach(function(t) {
                var typeClass = t.type === 'income' ? 'type-in' : 'type-out';
                var sign = t.type === 'income' ? '+' : '-';
                var label = t.type === 'income' ? 'MASUK' : 'KELUAR';
                historyHTML += '<div class="history-item">' +
                    '<span class="history-amount" style="color:' + (t.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)') + '">' + sign + ' Rp ' + formatRupiah(t.amount) + '</span>' +
                    '<span class="history-type ' + typeClass + '">' + label + '</span>' +
                    '</div>';
            });
            historyList.innerHTML = historyHTML;
        }

        saveData(data);
    }

    function escapeHTML(str) {
        var d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    // ========== TRANSAKSI ==========
    function addTransaction(amount, type) {
        if (!amount || amount <= 0) return;
        data.transactions.push({ amount: amount, type: type });
        renderAll();
        financeInput.value = '';
    }

    addIncomeBtn.addEventListener('click', function() {
        var amount = parseRupiah(financeInput.value);
        if (!amount || amount <= 0) return;
        addTransaction(amount, 'income');
    });

    addExpenseBtn.addEventListener('click', function() {
        var amount = parseRupiah(financeInput.value);
        if (!amount || amount <= 0) return;
        addTransaction(amount, 'expense');
    });

    financeInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            var amount = parseRupiah(this.value);
            if (amount > 0) addTransaction(amount, 'income');
        }
    });

    // Quick add
    window.quickAdd = function(amount) {
        addTransaction(amount, 'income');
    };

    // Undo
    undoBtn.addEventListener('click', function() {
        if (data.transactions.length === 0) return;
        data.transactions.pop();
        renderAll();
    });

    // ========== DAFTAR BELANJA ==========
    addItemBtn.addEventListener('click', function() {
        var name = itemNameInput.value.trim();
        var price = parseRupiah(itemPriceInput.value);
        var qty = parseInt(itemQtyInput.value) || 1;

        if (!name || price <= 0) return;

        var totalHarga = price * qty;
        var totalMasuk = 0;
        var totalKeluar = 0;
        data.transactions.forEach(function(t) {
            if (t.type === 'income') totalMasuk += t.amount;
            else totalKeluar += t.amount;
        });

        if (totalMasuk - totalKeluar < totalHarga) {
            alert('Saldo tidak cukup untuk belanja ini!');
            return;
        }

        data.transactions.push({ amount: totalHarga, type: 'expense', isItem: true });
        data.items.push({ name: name, price: price, qty: qty });

        itemNameInput.value = '';
        itemPriceInput.value = '';
        itemQtyInput.value = '1';

        renderAll();
    });

    clearItemsBtn.addEventListener('click', function() {
        if (data.items.length === 0) return;
        if (confirm('Hapus semua barang dari daftar belanja?')) {
            data.items = [];
            renderAll();
        }
    });

    // ========== RESET ==========
    resetBtn.addEventListener('click', function() {
        if (confirm('Yakin mau reset SEMUA data? Transaksi & barang akan hilang.')) {
            data.transactions = [];
            data.items = [];
            renderAll();
        }
    });

    // ========== SAVE NAME ==========
    saveNameBtn.addEventListener('click', function() {
        var name = nameInput.value.trim();
        if (name) {
            data.name = name;
            saveData(data);
            this.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(function() {
                saveNameBtn.innerHTML = '<i class="fas fa-check"></i>';
            }, 500);
        }
    });

    // ========== NOTA ==========
    showNotaBtn.addEventListener('click', function() {
        if (data.items.length === 0) {
            alert('Belum ada barang di daftar belanja!');
            return;
        }

        var now = new Date();
        var dateStr = now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        var timeStr = now.toLocaleTimeString('id-ID').substring(0, 5);

        var notaHTML = '';
        notaHTML += '<div class="nota-brand">JHON338xDEVICES</div>';
        notaHTML += '<div class="nota-address">Financial System<br>' + dateStr + ' ' + timeStr + '</div>';
        notaHTML += '<div class="nota-divider"></div>';
        notaHTML += '<div class="nota-flex"><span>Nama:</span><span>' + escapeHTML(data.name) + '</span></div>';
        notaHTML += '<div class="nota-divider"></div>';

        var totalBelanja = 0;
        var totalQty = 0;

        data.items.forEach(function(item) {
            var qty = item.qty || 1;
            var sub = item.price * qty;
            totalBelanja += sub;
            totalQty += qty;
            notaHTML += '<div class="nota-flex"><span>' + qty + 'x ' + escapeHTML(item.name) + '</span><span>Rp ' + formatRupiah(sub) + '</span></div>';
        });

        notaHTML += '<div class="nota-divider"></div>';
        notaHTML += '<div class="nota-flex"><span>Total Item:</span><span>' + totalQty + '</span></div>';
        notaHTML += '<div class="nota-flex nota-total"><span>TOTAL:</span><span>Rp ' + formatRupiah(totalBelanja) + '</span></div>';
        notaHTML += '<div class="nota-divider"></div>';
        notaHTML += '<div class="nota-footer">Terima kasih telah berbelanja!<br>*** JHON338xDEVICES ***</div>';

        notaContent.innerHTML = notaHTML;
        notaModal.style.display = 'flex';
    });

    closeNotaBtn.addEventListener('click', function() {
        notaModal.style.display = 'none';
    });

    notaModal.addEventListener('click', function(e) {
        if (e.target === notaModal) notaModal.style.display = 'none';
    });

    downloadNotaBtn.addEventListener('click', function() {
        var paper = document.getElementById('notaContent');
        html2canvas(paper, { scale: 2, backgroundColor: '#ffffff', useCORS: true }).then(function(canvas) {
            var link = document.createElement('a');
            link.download = 'Nota_JHON338x_' + Date.now() + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(function() {
            alert('Gagal mengunduh nota!');
        });
    });

    // ========== INIT RENDER ==========
    renderAll();

})();