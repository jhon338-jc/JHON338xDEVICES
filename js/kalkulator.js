// JHON338xDEVICES - Kalkulator Lengkap
// Mode Rupiah + Riwayat

// ========== STATE ==========
var currentInput = '0';
var previousInput = '';
var operator = null;
var shouldResetDisplay = false;
var isRupiahMode = true;
var riwayatList = [];

// Load riwayat dari localStorage
function loadRiwayat() {
    try {
        var saved = localStorage.getItem('kalkulator_riwayat');
        if (saved) {
            riwayatList = JSON.parse(saved);
        }
    } catch (e) {
        riwayatList = [];
    }
}

function saveRiwayat() {
    try {
        // Simpan maks 20 item
        if (riwayatList.length > 20) {
            riwayatList = riwayatList.slice(-20);
        }
        localStorage.setItem('kalkulator_riwayat', JSON.stringify(riwayatList));
    } catch (e) {
        // Storage penuh
    }
}

// ========== DISPLAY ==========
function updateDisplay() {
    var displayMain = document.getElementById('display-main');
    var displayRiwayat = document.getElementById('display-riwayat');
    var displayCurrency = document.getElementById('display-currency');
    
    // Format tampilan
    var displayValue = currentInput;
    
    if (isRupiahMode && displayValue !== 'Error' && displayValue !== '∞') {
        // Tampilkan format rupiah di display
        displayCurrency.style.display = 'block';
        displayMain.textContent = formatRupiah(displayValue);
    } else {
        displayCurrency.style.display = 'none';
        displayMain.textContent = displayValue;
    }
    
    // Tampilkan riwayat kalkulasi
    if (previousInput && operator) {
        var prevDisplay = previousInput;
        var opDisplay = getOperatorSymbol(operator);
        
        if (isRupiahMode) {
            prevDisplay = formatRupiahShort(previousInput);
        }
        
        displayRiwayat.textContent = prevDisplay + ' ' + opDisplay;
    } else {
        displayRiwayat.textContent = '';
    }
}

function formatRupiah(value) {
    if (value === 'Error' || value === '∞') return value;
    if (value === '0') return 'Rp 0';
    
    var num = parseFloat(value);
    if (isNaN(num)) return value;
    
    // Pisahkan bagian desimal
    var parts = value.split('.');
    var intPart = parts[0].replace(/^0+/, '') || '0';
    var decPart = parts.length > 1 ? ',' + parts[1] : '';
    
    // Format dengan titik
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return 'Rp ' + intPart + decPart;
}

function formatRupiahShort(value) {
    if (value === '0') return 'Rp 0';
    var num = parseFloat(value);
    if (isNaN(num)) return value;
    
    if (num >= 1000000) {
        return 'Rp ' + (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return 'Rp ' + (num / 1000).toFixed(0) + 'K';
    }
    return 'Rp ' + num.toLocaleString('id-ID');
}

function getOperatorSymbol(op) {
    switch (op) {
        case '+': return '+';
        case '-': return '−';
        case '*': return '×';
        case '/': return '÷';
        case '%': return '%';
        default: return op;
    }
}

// ========== INPUT ==========
function inputNumber(num) {
    if (shouldResetDisplay) {
        currentInput = '';
        shouldResetDisplay = false;
    }
    
    if (currentInput === '0' && num !== '00') {
        currentInput = num;
    } else if (currentInput === '0' && num === '00') {
        currentInput = '0';
    } else if (currentInput.length < 15) {
        currentInput += num;
    }
    
    updateDisplay();
}

function inputDot() {
    if (shouldResetDisplay) {
        currentInput = '0';
        shouldResetDisplay = false;
    }
    
    if (!currentInput.includes('.')) {
        currentInput += '.';
    }
    
    updateDisplay();
}

function inputOperator(op) {
    if (operator && !shouldResetDisplay) {
        // Hitung dulu sebelum ganti operator
        calculate();
    }
    
    previousInput = currentInput;
    operator = op;
    shouldResetDisplay = true;
    
    updateDisplay();
}

function deleteLast() {
    if (shouldResetDisplay) return;
    
    if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = '0';
    }
    
    // Hapus tanda minus jika tinggal "-"
    if (currentInput === '-') {
        currentInput = '0';
    }
    
    updateDisplay();
}

function clearAll() {
    currentInput = '0';
    previousInput = '';
    operator = null;
    shouldResetDisplay = false;
    
    updateDisplay();
}

// ========== KALKULASI ==========
function calculate() {
    if (!operator || !previousInput) return;
    
    var prev = parseFloat(previousInput);
    var curr = parseFloat(currentInput);
    var hasil = 0;
    var kalkulasiText = '';
    
    if (isNaN(prev) || isNaN(curr)) {
        currentInput = 'Error';
        operator = null;
        previousInput = '';
        shouldResetDisplay = true;
        updateDisplay();
        return;
    }
    
    switch (operator) {
        case '+':
            hasil = prev + curr;
            break;
        case '-':
            hasil = prev - curr;
            break;
        case '*':
            hasil = prev * curr;
            break;
        case '/':
            if (curr === 0) {
                hasil = '∞';
            } else {
                hasil = prev / curr;
            }
            break;
        case '%':
            hasil = prev % curr;
            break;
    }
    
    // Format hasil
    if (hasil === '∞') {
        currentInput = '∞';
    } else {
        // Batasi desimal
        if (Number.isInteger(hasil)) {
            currentInput = hasil.toString();
        } else {
            currentInput = parseFloat(hasil.toFixed(10)).toString();
        }
    }
    
    // Simpan ke riwayat
    kalkulasiText = previousInput + ' ' + getOperatorSymbol(operator) + ' ' + currentInput + ' = ' + currentInput;
    
    if (isRupiahMode && hasil !== '∞' && currentInput !== 'Error') {
        var hasilRp = 'Rp ' + parseFloat(currentInput).toLocaleString('id-ID');
        kalkulasiText = formatRupiahShort(previousInput) + ' ' + getOperatorSymbol(operator) + ' ' + formatRupiahShort(currentInput) + ' = ' + hasilRp;
    }
    
    // Tambah ke riwayat
    riwayatList.unshift({
        kalkulasi: kalkulasiText,
        hasil: isRupiahMode ? formatRupiah(currentInput) : currentInput,
        timestamp: new Date().toLocaleTimeString('id-ID')
    });
    
    saveRiwayat();
    renderRiwayat();
    
    // Reset
    operator = null;
    previousInput = '';
    shouldResetDisplay = true;
    
    updateDisplay();
}

// ========== MODE ==========
function toggleMode() {
    isRupiahMode = !isRupiahMode;
    
    var modeIndicator = document.getElementById('mode-indicator');
    var modeBtn = document.getElementById('mode-btn');
    
    if (isRupiahMode) {
        modeIndicator.innerHTML = '<i class="fas fa-coins"></i> MODE RUPIAH';
        modeIndicator.style.color = '#25D366';
        modeBtn.style.color = '#ff9500';
    } else {
        modeIndicator.innerHTML = '<i class="fas fa-calculator"></i> MODE NORMAL';
        modeIndicator.style.color = '#4bd5ff';
        modeBtn.style.color = '#4bd5ff';
    }
    
    updateDisplay();
}

// ========== RIWAYAT ==========
function renderRiwayat() {
    var riwayatContainer = document.getElementById('riwayat-list');
    var clearBtn = document.getElementById('clear-riwayat-btn');
    
    if (riwayatList.length === 0) {
        riwayatContainer.innerHTML = '<div class="riwayat-empty"><i class="fas fa-history"></i><p>Belum ada riwayat</p></div>';
        clearBtn.style.display = 'none';
        return;
    }
    
    clearBtn.style.display = 'block';
    riwayatContainer.innerHTML = '';
    
    riwayatList.forEach(function(item, index) {
        var div = document.createElement('div');
        div.className = 'riwayat-item';
        div.onclick = function() {
            // Pakai hasil dari riwayat
            currentInput = item.hasil.replace(/[^0-9.\-]/g, '');
            if (currentInput === '') currentInput = '0';
            shouldResetDisplay = true;
            updateDisplay();
        };
        div.innerHTML = '<span class="riwayat-kalkulasi">' + item.kalkulasi + '</span>' +
                       '<span class="riwayat-hasil">' + item.hasil + '</span>';
        riwayatContainer.appendChild(div);
    });
}

function clearRiwayat() {
    if (confirm('Hapus semua riwayat?')) {
        riwayatList = [];
        saveRiwayat();
        renderRiwayat();
    }
}

// ========== KEYBOARD SUPPORT ==========
document.addEventListener('keydown', function(e) {
    var key = e.key;
    
    if (key >= '0' && key <= '9') {
        inputNumber(key);
    } else if (key === '.') {
        inputDot();
    } else if (key === '+') {
        inputOperator('+');
    } else if (key === '-') {
        inputOperator('-');
    } else if (key === '*') {
        inputOperator('*');
    } else if (key === '/') {
        e.preventDefault();
        inputOperator('/');
    } else if (key === '%') {
        inputOperator('%');
    } else if (key === 'Enter' || key === '=') {
        calculate();
    } else if (key === 'Backspace') {
        deleteLast();
    } else if (key === 'Escape') {
        clearAll();
    }
});

// ========== INIT ==========
window.addEventListener('load', function() {
    loadRiwayat();
    updateDisplay();
    renderRiwayat();
});
