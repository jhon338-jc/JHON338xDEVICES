// JHON338xDEVICES - Pinterest Search
// Menggunakan API backend Vercel

var currentQuery = '';
var currentImages = [];
var currentPreviewUrl = '';
var isLoading = false;

// ========== SEARCH ==========
async function searchPinterest(loadMore) {
    var query = document.getElementById('searchInput').value.trim();
    
    if (!loadMore) {
        if (!query) {
            shakeElement('searchInput');
            return;
        }
        currentQuery = query;
        currentImages = [];
        document.getElementById('imageGrid').innerHTML = '';
    }
    
    if (!currentQuery && loadMore) return;
    
    var searchQuery = loadMore ? currentQuery : query;
    
    // Show loading
    showLoading(true);
    hideError();
    
    if (!loadMore) {
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('loadMoreBox').style.display = 'none';
    }
    
    try {
        var apiUrl = '/api/pinterest?query=' + encodeURIComponent(searchQuery);
        var response = await fetch(apiUrl);
        var data = await response.json();
        
        showLoading(false);
        
        if (data.success && data.images.length > 0) {
            if (!loadMore) {
                currentImages = data.images;
            } else {
                currentImages = currentImages.concat(data.images);
            }
            
            renderImages(currentImages);
            
            // Update status
            document.getElementById('statusBar').style.display = 'flex';
            document.getElementById('statusText').textContent = 'Hasil: "' + searchQuery + '"';
            document.getElementById('resultCount').textContent = currentImages.length + ' gambar';
            
            // Show load more
            if (data.images.length >= 20) {
                document.getElementById('loadMoreBox').style.display = 'block';
            } else {
                document.getElementById('loadMoreBox').style.display = 'none';
            }
            
        } else {
            showError('Gambar tidak ditemukan untuk "' + searchQuery + '"');
            document.getElementById('statusBar').style.display = 'none';
            document.getElementById('loadMoreBox').style.display = 'none';
            
            if (currentImages.length === 0) {
                document.getElementById('emptyState').style.display = 'block';
            }
        }
        
    } catch (e) {
        showLoading(false);
        showError('Gagal terhubung ke server. Coba lagi nanti.');
        console.error('Search error:', e);
    }
}

// ========== QUICK SEARCH ==========
function quickSearch(query) {
    document.getElementById('searchInput').value = query;
    searchPinterest();
}

// ========== RENDER IMAGES ==========
function renderImages(images) {
    var grid = document.getElementById('imageGrid');
    
    if (images.length === 0) {
        grid.innerHTML = '';
        document.getElementById('emptyState').style.display = 'block';
        return;
    }
    
    document.getElementById('emptyState').style.display = 'none';
    
    var html = '';
    images.forEach(function(img, index) {
        html += 
        '<div class="image-card" onclick="openPreview(\'' + escapeQuotes(img.url) + '\', \'' + escapeQuotes(img.title || '') + '\')">' +
            '<img src="' + img.url + '" alt="' + (img.title || 'Pinterest Image') + '" loading="lazy" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22400%22%3E%3Crect fill=%22%231a1f2e%22 width=%22300%22 height=%22400%22/%3E%3Ctext fill=%22%234bd5ff%22 x=%22150%22 y=%22200%22 text-anchor=%22middle%22%3EError%3C/text%3E%3C/svg%3E\'">' +
            '<div class="image-card-overlay">' +
                '<button onclick="event.stopPropagation(); quickDownload(\'' + escapeQuotes(img.url) + '\')"><i class="fas fa-download"></i></button>' +
            '</div>' +
        '</div>';
    });
    
    grid.innerHTML = html;
}

function escapeQuotes(str) {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// ========== PREVIEW ==========
function openPreview(url, title) {
    currentPreviewUrl = url;
    document.getElementById('previewImage').src = url;
    document.getElementById('previewTitle').textContent = title || 'Pinterest Image';
    document.getElementById('previewModal').style.display = 'flex';
}

function closePreview() {
    document.getElementById('previewModal').style.display = 'none';
    currentPreviewUrl = '';
}

function downloadImage() {
    if (!currentPreviewUrl) return;
    downloadFromUrl(currentPreviewUrl);
}

function quickDownload(url) {
    downloadFromUrl(url);
}

function downloadFromUrl(url) {
    fetch(url)
        .then(function(res) { return res.blob(); })
        .then(function(blob) {
            var blobUrl = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = blobUrl;
            a.download = 'JHON338x_Pinterest_' + Date.now() + '.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        })
        .catch(function() {
            // Fallback: buka di tab baru
            window.open(url, '_blank');
        });
}

function openOriginal() {
    if (currentPreviewUrl) {
        window.open(currentPreviewUrl, '_blank');
    }
}

// ========== UI HELPERS ==========
function showLoading(show) {
    document.getElementById('loadingBox').style.display = show ? 'block' : 'none';
}

function showError(msg) {
    document.getElementById('errorBox').style.display = 'block';
    document.getElementById('errorText').textContent = msg;
}

function hideError() {
    document.getElementById('errorBox').style.display = 'none';
}

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

// ========== KEYBOARD ==========
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closePreview();
    }
});

// Enter di search input
document.getElementById('searchInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        searchPinterest();
    }
});

// Shake animation
var shakeStyle = document.createElement('style');
shakeStyle.textContent = '@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}50%{transform:translateX(8px)}75%{transform:translateX(-5px)}}';
document.head.appendChild(shakeStyle);