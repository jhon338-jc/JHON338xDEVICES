// JHON338xDEVICES - Device Tools
// KAMERA VERSI FINAL - Switch & Flash 100% Work

// ========== TAB SWITCH ==========
function openTab(tab) {
    document.getElementById('tab-btn-camera').classList.remove('active');
    document.getElementById('tab-btn-file').classList.remove('active');
    document.getElementById('tab-camera').classList.remove('active');
    document.getElementById('tab-file').classList.remove('active');

    if (tab === 'camera') {
        document.getElementById('tab-btn-camera').classList.add('active');
        document.getElementById('tab-camera').classList.add('active');
        autoCheckCamera();
    } else {
        document.getElementById('tab-btn-file').classList.add('active');
        document.getElementById('tab-file').classList.add('active');
    }
}

// ========== KAMERA ==========
var camStream = null;
var facing = 'environment';
var flashState = false;
var imgData = null;
var flashSupported = null;

async function autoCheckCamera() {
    // Cek apakah sebelumnya sudah ada stream
    if (camStream) {
        var active = camStream.getVideoTracks().some(function(t) { return t.readyState === 'live'; });
        if (active) return; // Masih aktif, gak perlu restart
    }
    
    try {
        var s = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' }, 
            audio: false 
        });
        s.getTracks().forEach(function(t) { t.stop(); });
        showCameraActive();
    } catch (e) {
        showCameraPermission();
    }
}

function showCameraPermission() {
    document.getElementById('camera-permission').style.display = 'block';
    document.getElementById('camera-active').style.display = 'none';
}

function showCameraActive() {
    document.getElementById('camera-permission').style.display = 'none';
    document.getElementById('camera-active').style.display = 'block';
    startCamera();
}

async function startCameraPermission() {
    try {
        var s = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' }, 
            audio: false 
        });
        s.getTracks().forEach(function(t) { t.stop(); });
        showCameraActive();
    } catch (e) {
        alert('Izin kamera ditolak! Buka pengaturan browser untuk mengizinkan kamera.');
    }
}

async function startCamera() {
    // HENTIKAN TOTAL stream lama
    if (camStream) {
        camStream.getTracks().forEach(function(t) {
            t.stop();
        });
        camStream = null;
    }
    
    // Reset state
    flashState = false;
    flashSupported = null;
    
    var vid = document.getElementById('cam-video');
    var placeholder = document.getElementById('cam-placeholder');
    
    // Tampilkan loading
    vid.style.display = 'none';
    if (vid.srcObject) {
        vid.srcObject = null;
    }
    placeholder.style.display = 'flex';
    placeholder.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Menyalakan kamera...</p>';
    
    try {
        // DAPATKAN STREAM BARU
        camStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: facing,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
        
        // Set stream ke video
        vid.srcObject = camStream;
        vid.setAttribute('playsinline', '');
        vid.setAttribute('autoplay', '');
        
        // Tunggu video siap
        await new Promise(function(resolve, reject) {
            vid.onloadedmetadata = function() {
                resolve();
            };
            // Timeout 3 detik
            setTimeout(function() {
                resolve();
            }, 3000);
        });
        
        // Play video
        try {
            await vid.play();
        } catch (e) {
            // Autoplay mungkin diblokir
            console.log('Autoplay blocked, but video should still work');
        }
        
        // Sembunyikan placeholder
        vid.style.display = 'block';
        placeholder.style.display = 'none';
        
        // Update UI
        updateFacingUI();
        
        // Deteksi flash
        await detectFlash();
        
    } catch (err) {
        console.error('Camera start error:', err);
        placeholder.innerHTML = '<i class="fas fa-exclamation-triangle"></i><p>Gagal: ' + err.message + '</p><p style="font-size:0.7rem;margin-top:5px;">Refresh halaman atau cek izin kamera</p>';
        placeholder.style.display = 'flex';
        vid.style.display = 'none';
        
        // Tetap update UI
        updateFacingUI();
        updateFlashUI();
    }
}

async function detectFlash() {
    if (!camStream) {
        flashSupported = false;
        updateFlashUI();
        return;
    }
    
    var track = camStream.getVideoTracks()[0];
    if (!track) {
        flashSupported = false;
        updateFlashUI();
        return;
    }
    
    // Kamera depan = gak ada flash
    if (facing === 'user') {
        flashSupported = false;
        updateFlashUI();
        return;
    }
    
    // Coba deteksi
    try {
        // Cek capabilities
        var capabilities = track.getCapabilities ? track.getCapabilities() : null;
        
        if (capabilities && capabilities.torch === true) {
            flashSupported = true;
        } else if (capabilities && capabilities.torch === false) {
            flashSupported = false;
        } else {
            // Test langsung
            try {
                await track.applyConstraints({ advanced: [{ torch: true }] });
                await track.applyConstraints({ advanced: [{ torch: false }] });
                flashSupported = true;
            } catch (e) {
                flashSupported = false;
            }
        }
    } catch (e) {
        flashSupported = false;
    }
    
    updateFlashUI();
}

function stopCamera() {
    if (camStream) {
        camStream.getTracks().forEach(function(t) { 
            t.stop(); 
        });
        camStream = null;
    }
    flashState = false;
    flashSupported = null;
    
    var vid = document.getElementById('cam-video');
    if (vid && vid.srcObject) {
        vid.srcObject = null;
    }
}

async function switchCam() {
    // Toggle facing
    facing = (facing === 'environment') ? 'user' : 'environment';
    
    // Update UI dulu
    updateFacingUI();
    
    // Restart total kamera
    await startCamera();
}

async function flashToggle() {
    if (!camStream) {
        updateFlashUI();
        return;
    }
    
    var track = camStream.getVideoTracks()[0];
    if (!track) {
        updateFlashUI();
        return;
    }
    
    if (facing === 'user') {
        document.getElementById('flash-text').innerHTML = '<i class="fas fa-bolt"></i> Flash: Tidak ada (depan)';
        return;
    }
    
    if (flashSupported === false) {
        document.getElementById('flash-text').innerHTML = '<i class="fas fa-bolt"></i> Flash: Tidak didukung';
        setTimeout(function() {
            updateFlashUI();
        }, 2000);
        return;
    }
    
    // Loading
    document.getElementById('flash-text').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Flash...';
    
    var newState = !flashState;
    var success = false;
    
    // METODE 1: Advanced constraint
    try {
        await track.applyConstraints({ advanced: [{ torch: newState }] });
        success = true;
    } catch (e1) {
        console.log('Metode 1 gagal');
    }
    
    // METODE 2: Langsung set torch
    if (!success) {
        try {
            await track.applyConstraints({ torch: newState });
            success = true;
        } catch (e2) {
            console.log('Metode 2 gagal');
        }
    }
    
    // METODE 3: Stream baru dengan torch
    if (!success && newState) {
        try {
            // Simpan track lama
            var oldStream = camStream;
            
            // Buat stream baru
            var newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing, torch: true, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            
            // Hentikan stream lama
            oldStream.getTracks().forEach(function(t) { t.stop(); });
            
            // Ganti stream
            camStream = newStream;
            var vid = document.getElementById('cam-video');
            vid.srcObject = camStream;
            
            success = true;
        } catch (e3) {
            console.log('Metode 3 gagal');
        }
    }
    
    if (success) {
        flashState = newState;
        flashSupported = true;
    }
    
    updateFlashUI();
}

function updateFacingUI() {
    var el = document.getElementById('facing-text');
    if (!el) return;
    el.innerHTML = '<i class="fas fa-camera"></i> ' + (facing === 'environment' ? 'Belakang' : 'Depan');
}

function updateFlashUI() {
    var el = document.getElementById('flash-text');
    if (!el) return;
    
    if (facing === 'user') {
        el.innerHTML = '<i class="fas fa-bolt"></i> Flash: Tidak ada';
    } else if (flashState) {
        el.innerHTML = '<i class="fas fa-bolt"></i> Flash: ON';
    } else if (flashSupported === false) {
        el.innerHTML = '<i class="fas fa-bolt"></i> Flash: Tdk support';
    } else {
        el.innerHTML = '<i class="fas fa-bolt"></i> Flash: OFF';
    }
}

function capture() {
    if (!camStream) {
        startCamera().then(function() {
            setTimeout(capture, 1000);
        });
        return;
    }
    
    var vid = document.getElementById('cam-video');
    var can = document.getElementById('cam-canvas');
    
    if (!vid || !can) return;
    if (!vid.videoWidth || vid.readyState < 2) {
        setTimeout(capture, 500);
        return;
    }
    
    var ctx = can.getContext('2d');
    can.width = vid.videoWidth;
    can.height = vid.videoHeight;
    
    // Mirror untuk kamera depan
    if (facing === 'user') {
        ctx.translate(can.width, 0);
        ctx.scale(-1, 1);
    }
    
    ctx.drawImage(vid, 0, 0, can.width, can.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    imgData = can.toDataURL('image/png');
    
    document.getElementById('photo-img').src = imgData;
    document.getElementById('photo-img').style.display = 'block';
    document.getElementById('no-photo-msg').style.display = 'none';
    document.getElementById('photo-btns').style.display = 'flex';
}

function savePhoto() {
    if (!imgData) return;
    var a = document.createElement('a');
    a.href = imgData;
    a.download = 'JHON338x_' + Date.now() + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function clearPhoto() {
    imgData = null;
    document.getElementById('photo-img').style.display = 'none';
    document.getElementById('no-photo-msg').style.display = 'flex';
    document.getElementById('photo-btns').style.display = 'none';
}

// ========== FILE ==========
var files = [];

function startFileAccess() {
    document.getElementById('file-permission').style.display = 'none';
    document.getElementById('file-active').style.display = 'block';
}

function addFiles(input) {
    var newFiles = Array.from(input.files);
    if (newFiles.length > 0) {
        files = files.concat(newFiles);
        renderFiles();
    }
    input.value = '';
}

function removeFile(i) {
    files.splice(i, 1);
    renderFiles();
}

async function compressAndDownloadSingle(i) {
    var file = files[i];
    if (!file) return;
    
    var btn = document.getElementById('dl-btn-' + i);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }
    
    try {
        var originalName = file.name;
        var lastDot = originalName.lastIndexOf('.');
        var baseName = lastDot > 0 ? originalName.substring(0, lastDot) : originalName;
        var zipName = baseName + '.zip';
        
        var zip = new JSZip();
        var ab = await file.arrayBuffer();
        zip.file(originalName, ab);
        
        var zipBlob = await zip.generateAsync({ 
            type: 'blob', 
            compression: 'DEFLATE', 
            compressionOptions: { level: 6 } 
        });
        
        var url = URL.createObjectURL(zipBlob);
        var a = document.createElement('a');
        a.href = url;
        a.download = zipName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
        
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.style.backgroundColor = '#25D366';
            setTimeout(function() {
                btn.innerHTML = '<i class="fas fa-download"></i>';
                btn.style.backgroundColor = '';
            }, 1500);
        }
    } catch (e) {
        if (btn) {
            btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            setTimeout(function() {
                btn.innerHTML = '<i class="fas fa-download"></i>';
            }, 1500);
        }
    }
    
    if (btn) btn.disabled = false;
}

function renderFiles() {
    var listEl = document.getElementById('file-list-el');
    var noMsg = document.getElementById('no-file-msg');
    var infoBar = document.getElementById('file-info-bar');
    var countEl = document.getElementById('count-el');
    var sizeEl = document.getElementById('size-el');
    var downBtn = document.getElementById('download-btn');
    var zipStat = document.getElementById('zip-status');

    if (files.length === 0) {
        noMsg.style.display = 'flex';
        listEl.innerHTML = '';
        infoBar.style.display = 'none';
        downBtn.style.display = 'none';
        zipStat.style.display = 'none';
        return;
    }

    noMsg.style.display = 'none';
    listEl.innerHTML = '';
    var total = 0;

    files.forEach(function(f, i) {
        total += f.size;
        var d = document.createElement('div');
        d.className = 'file-item';
        d.innerHTML = 
            '<div class="file-item-icon"><i class="fas fa-file"></i></div>' +
            '<div class="file-item-info">' +
                '<div class="file-item-name">' + esc(f.name) + '</div>' +
                '<div class="file-item-size">' + fmt(f.size) + '</div>' +
            '</div>' +
            '<button class="file-item-download" id="dl-btn-' + i + '" onclick="compressAndDownloadSingle(' + i + ')" title="Download ZIP">' +
                '<i class="fas fa-download"></i>' +
            '</button>' +
            '<button class="file-item-remove" onclick="removeFile(' + i + ')" title="Hapus">' +
                '<i class="fas fa-times-circle"></i>' +
            '</button>';
        listEl.appendChild(d);
    });

    infoBar.style.display = 'flex';
    countEl.textContent = files.length + ' file';
    sizeEl.textContent = fmt(total);
    downBtn.style.display = 'none';
    zipStat.style.display = 'none';
}

function fmt(b) {
    if (b === 0) return '0 B';
    var k = 1024, s = ['B', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + s[i];
}

function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

// ========== INIT ==========
window.addEventListener('load', function() {
    document.getElementById('camera-permission').style.display = 'block';
    document.getElementById('camera-active').style.display = 'none';
    document.getElementById('file-permission').style.display = 'block';
    document.getElementById('file-active').style.display = 'none';
    
    autoCheckCamera();
});

window.addEventListener('beforeunload', function() {
    stopCamera();
});