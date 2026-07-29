// JHON338xDEVICES - Alat Generator
// API dari azbry.com

// ========== FUNGSI UMUM ==========

async function fetchAPIImage(url, imgId, loadingId, resultId) {
    var loading = document.getElementById(loadingId);
    var result = document.getElementById(resultId);
    var img = document.getElementById(imgId);
    
    if (loading) {
        loading.style.display = 'flex';
        loading.innerHTML = '<div class="loader-small"></div><span>Memproses...</span>';
    }
    if (result) result.style.display = 'none';
    
    try {
        var response = await fetch(url);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        
        var blob = await response.blob();
        var imageUrl = URL.createObjectURL(blob);
        
        if (img) {
            img.src = imageUrl;
            img.onload = function() {
                // Keep URL for download
            };
        }
        
        if (loading) loading.style.display = 'none';
        if (result) result.style.display = 'block';
        
    } catch (e) {
        console.error('Error:', e);
        if (loading) {
            loading.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Gagal: ' + e.message;
            loading.style.color = '#ff3333';
        }
        setTimeout(function() {
            if (loading) {
                loading.style.display = 'none';
                loading.style.color = '#4bd5ff';
            }
        }, 3000);
    }
}

function downloadResult(imgId, prefix) {
    var img = document.getElementById(imgId);
    if (!img || !img.src || img.src === '' || img.src === window.location.href) return;
    
    // Fetch ulang untuk download (hindari CORS issue)
    fetch(img.src)
        .then(function(res) { return res.blob(); })
        .then(function(blob) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = prefix + Date.now() + '.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
        })
        .catch(function() {
            // Fallback: download langsung
            var a = document.createElement('a');
            a.href = img.src;
            a.download = prefix + Date.now() + '.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
}

// ========== IQC GENERATOR ==========
function generateIQC() {
    var text = document.getElementById('iqc-text').value.trim();
    if (!text) {
        shakeElement('iqc-text');
        return;
    }
    var url = 'https://api.azbry.com/api/maker/iqc?text=' + encodeURIComponent(text);
    fetchAPIImage(url, 'iqc-img', 'iqc-loading', 'iqc-result');
}

// ========== FAKE DANA ==========
function generateDana() {
    var amount = document.getElementById('dana-amount').value.trim();
    if (!amount || isNaN(amount) || amount <= 0) {
        shakeElement('dana-amount');
        return;
    }
    var url = 'https://api.azbry.com/api/maker/fakedana?amount=' + encodeURIComponent(amount);
    fetchAPIImage(url, 'dana-img', 'dana-loading', 'dana-result');
}

// ========== BRAT CANVAS ==========
function generateBRAT() {
    var text = document.getElementById('brat-text').value.trim();
    var warna = document.getElementById('brat-warna').value;
    var blur = document.getElementById('brat-blur').value;
    
    if (!text) {
        shakeElement('brat-text');
        return;
    }
    
    var url = 'https://api.azbry.com/api/maker/bratcanvas?text=' + encodeURIComponent(text) +
              '&warna=' + encodeURIComponent(warna) +
              '&blur=' + encodeURIComponent(blur);
    
    fetchAPIImage(url, 'brat-img', 'brat-loading', 'brat-result');
}

// ========== FAKE FF ==========
function generateFF() {
    var name = document.getElementById('ff-name').value.trim();
    if (!name) {
        shakeElement('ff-name');
        return;
    }
    var url = 'https://api.azbry.com/api/maker/fakeff?name=' + encodeURIComponent(name);
    fetchAPIImage(url, 'ff-img', 'ff-loading', 'ff-result');
}

// ========== FAKE ML ==========
function generateML() {
    var name = document.getElementById('ml-name').value.trim();
    var diamond = document.getElementById('ml-diamond').value.trim();
    
    if (!name) {
        shakeElement('ml-name');
        return;
    }
    if (!diamond || isNaN(diamond) || diamond <= 0) {
        shakeElement('ml-diamond');
        return;
    }
    
    var url = 'https://api.azbry.com/api/maker/fakeml?name=' + encodeURIComponent(name) +
              '&diamond=' + encodeURIComponent(diamond);
    
    fetchAPIImage(url, 'ml-img', 'ml-loading', 'ml-result');
}

// ========== ANIMASI SHAKE ==========
function shakeElement(id) {
    var el = document.getElementById(id);
    if (!el) return;
    
    el.style.borderColor = '#ff3333';
    el.style.animation = 'shake 0.5s ease';
    
    setTimeout(function() {
        el.style.borderColor = '#2a4b6e';
        el.style.animation = '';
    }, 500);
}

// Tambahin style shake
var shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-8px); }
        50% { transform: translateX(8px); }
        75% { transform: translateX(-5px); }
    }
`;
document.head.appendChild(shakeStyle);

// ========== INIT ==========
console.log('JHON338xDEVICES - Alat Generator Siap');
console.log('Fitur: IQC, Fake Dana, BRAT Canvas, Fake FF, Fake ML');