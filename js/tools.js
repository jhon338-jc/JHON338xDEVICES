// JHON338xDEVICES - Device Tools Logic
// Camera + File Manager + ZIP Compression
// VERSI PERBAIKAN - Semua tombol berfungsi

(function() {
    'use strict';

    // ========== TAB NAVIGATION ==========
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const cameraTab = document.getElementById('camera-tab');
    const filesTab = document.getElementById('files-tab');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show target tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // Inisialisasi kamera jika tab kamera aktif
            if (targetTab === 'camera-tab') {
                setTimeout(() => {
                    checkCameraPermissionAuto();
                }, 100);
            }
        });
    });

    // ========== KAMERA ELEMENTS ==========
    const permissionCard = document.getElementById('permission-card');
    const grantPermissionBtn = document.getElementById('grant-permission-btn');
    const cameraSection = document.getElementById('camera-section');
    const cameraPreview = document.getElementById('camera-preview');
    const cameraCanvas = document.getElementById('camera-canvas');
    const cameraPlaceholder = document.getElementById('camera-placeholder');
    const switchCameraBtn = document.getElementById('switch-camera-btn');
    const captureBtn = document.getElementById('capture-btn');
    const flashToggleBtn = document.getElementById('flash-toggle-btn');
    const flashStatus = document.getElementById('flash-status');
    const cameraFacing = document.getElementById('camera-facing');
    const capturedImage = document.getElementById('captured-image');
    const noPhoto = document.getElementById('no-photo');
    const photoActions = document.getElementById('photo-actions');
    const downloadPhotoBtn = document.getElementById('download-photo-btn');
    const deletePhotoBtn = document.getElementById('delete-photo-btn');

    // Kamera state
    let currentStream = null;
    let facingMode = 'environment';
    let flashEnabled = false;
    let track = null;
    let capturedImageData = null;
    let cameraPermissionChecked = false;

    // ========== KAMERA FUNCTIONS ==========
    
    function checkCameraPermissionAuto() {
        if (cameraPermissionChecked) return;
        
        // Cek apakah sudah ada izin sebelumnya
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'camera' })
                .then(permissionStatus => {
                    if (permissionStatus.state === 'granted') {
                        // Sudah diizinkan
                        showCameraSection();
                    } else if (permissionStatus.state === 'prompt') {
                        // Belum pernah ditanya, tampilkan permission card
                        showPermissionCard();
                    } else {
                        // Ditolak
                        showPermissionCard();
                    }
                    cameraPermissionChecked = true;
                })
                .catch(() => {
                    // Fallback: coba akses langsung
                    testCameraAccess();
                });
        } else {
            // Browser gak support permissions API, coba akses langsung
            testCameraAccess();
        }
    }

    async function testCameraAccess() {
        try {
            const testStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            testStream.getTracks().forEach(t => t.stop());
            showCameraSection();
        } catch (e) {
            showPermissionCard();
        }
        cameraPermissionChecked = true;
    }

    function showPermissionCard() {
        if (permissionCard) permissionCard.style.display = 'block';
        if (cameraSection) cameraSection.style.display = 'none';
    }

    function showCameraSection() {
        if (permissionCard) permissionCard.style.display = 'none';
        if (cameraSection) cameraSection.style.display = 'block';
        startCamera();
    }

    async function requestAndStartCamera() {
        try {
            const testStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            testStream.getTracks().forEach(t => t.stop());
            
            // Berhasil dapat izin
            showCameraSection();
        } catch (err) {
            // Izin ditolak
            if (grantPermissionBtn) {
                grantPermissionBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> IZIN DITOLAK - COBA LAGI';
                grantPermissionBtn.style.backgroundColor = '#ff3333';
                setTimeout(() => {
                    grantPermissionBtn.innerHTML = '<i class="fas fa-check-circle"></i> IZINKAN AKSES KAMERA';
                    grantPermissionBtn.style.backgroundColor = '#4bd5ff';
                }, 2500);
            }
        }
    }

    async function startCamera() {
        stopCamera();

        if (!cameraPreview) return;

        const constraints = {
            video: {
                facingMode: facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };

        try {
            currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            cameraPreview.srcObject = currentStream;
            track = currentStream.getVideoTracks()[0];
            
            if (cameraPlaceholder) cameraPlaceholder.style.display = 'none';
            cameraPreview.style.display = 'block';
            
            updateFacingStatus();
            checkFlashCapability();
        } catch (err) {
            console.error('Camera start error:', err);
            if (cameraPlaceholder) {
                cameraPlaceholder.innerHTML = '<i class="fas fa-exclamation-triangle"></i><p>Gagal mengakses kamera</p>';
                cameraPlaceholder.style.display = 'flex';
            }
            cameraPreview.style.display = 'none';
        }
    }

    function stopCamera() {
        if (currentStream) {
            currentStream.getTracks().forEach(t => t.stop());
            currentStream = null;
            track = null;
        }
    }

    function updateFacingStatus() {
        if (!cameraFacing) return;
        if (facingMode === 'environment') {
            cameraFacing.innerHTML = '<i class="fas fa-camera"></i> Kamera: Belakang';
        } else {
            cameraFacing.innerHTML = '<i class="fas fa-camera"></i> Kamera: Depan';
        }
    }

    function switchCamera() {
        facingMode = (facingMode === 'environment') ? 'user' : 'environment';
        flashEnabled = false;
        if (flashStatus) flashStatus.innerHTML = '<i class="fas fa-bolt"></i> Flash: OFF';
        if (flashToggleBtn) {
            flashToggleBtn.style.opacity = '1';
            flashToggleBtn.style.pointerEvents = 'auto';
        }
        startCamera();
    }

    function checkFlashCapability() {
        if (!flashToggleBtn || !flashStatus) return;
        
        if (!track) {
            flashToggleBtn.style.opacity = '0.5';
            flashToggleBtn.style.pointerEvents = 'none';
            flashStatus.innerHTML = '<i class="fas fa-bolt"></i> Flash: N/A';
            return;
        }

        if (facingMode === 'user') {
            flashToggleBtn.style.opacity = '0.5';
            flashToggleBtn.style.pointerEvents = 'none';
            flashStatus.innerHTML = '<i class="fas fa-bolt"></i> Flash: OFF (depan)';
            flashEnabled = false;
            return;
        }

        // Coba cek capabilities
        try {
            const capabilities = track.getCapabilities ? track.getCapabilities() : null;
            if (capabilities && capabilities.torch !== undefined) {
                flashToggleBtn.style.opacity = '1';
                flashToggleBtn.style.pointerEvents = 'auto';
                flashStatus.innerHTML = '<i class="fas fa-bolt"></i> Flash: OFF';
                
                // Reset torch ke off
                track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
            } else {
                // Tetap aktifkan tombol, siapa tau bisa
                flashToggleBtn.style.opacity = '1';
                flashToggleBtn.style.pointerEvents = 'auto';
                flashStatus.innerHTML = '<i class="fas fa-bolt"></i> Flash: OFF';
            }
        } catch (e) {
            flashToggleBtn.style.opacity = '1';
            flashToggleBtn.style.pointerEvents = 'auto';
            flashStatus.innerHTML = '<i class="fas fa-bolt"></i> Flash: OFF';
        }
    }

    async function toggleFlash() {
        if (!track || facingMode === 'user') return;

        try {
            const newState = !flashEnabled;
            await track.applyConstraints({
                advanced: [{ torch: newState }]
            });
            flashEnabled = newState;
            if (flashStatus) {
                flashStatus.innerHTML = flashEnabled 
                    ? '<i class="fas fa-bolt"></i> Flash: ON' 
                    : '<i class="fas fa-bolt"></i> Flash: OFF';
            }
        } catch (err) {
            console.error('Flash toggle error:', err);
            if (flashStatus) {
                flashStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Flash: Gagal';
                setTimeout(() => {
                    flashStatus.innerHTML = '<i class="fas fa-bolt"></i> Flash: OFF';
                }, 2000);
            }
        }
    }

    function capturePhoto() {
        if (!currentStream || !track) {
            // Coba mulai kamera dulu
            startCamera();
            setTimeout(() => capturePhoto(), 800);
            return;
        }

        const video = cameraPreview;
        const canvas = cameraCanvas;
        if (!video || !canvas) return;

        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        capturedImageData = canvas.toDataURL('image/png');
        
        if (capturedImage) {
            capturedImage.src = capturedImageData;
            capturedImage.style.display = 'block';
        }
        if (noPhoto) noPhoto.style.display = 'none';
        if (photoActions) photoActions.style.display = 'flex';

        // Flash feedback
        if (flashStatus) {
            const originalText = flashStatus.innerHTML;
            flashStatus.innerHTML = '<i class="fas fa-check-circle"></i> Foto diambil!';
            setTimeout(() => {
                flashStatus.innerHTML = originalText;
            }, 1500);
        }
    }

    function downloadPhoto() {
        if (!capturedImageData) return;
        const link = document.createElement('a');
        link.download = 'JHON338x_' + Date.now() + '.png';
        link.href = capturedImageData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function deletePhoto() {
        capturedImageData = null;
        if (capturedImage) {
            capturedImage.src = '';
            capturedImage.style.display = 'none';
        }
        if (noPhoto) noPhoto.style.display = 'flex';
        if (photoActions) photoActions.style.display = 'none';
    }

    // ========== KAMERA EVENT LISTENERS ==========
    if (grantPermissionBtn) {
        // Hapus event listener lama dengan clone node
        const newGrantBtn = grantPermissionBtn.cloneNode(true);
        grantPermissionBtn.parentNode.replaceChild(newGrantBtn, grantPermissionBtn);
        
        newGrantBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            requestAndStartCamera();
        });
    }

    if (switchCameraBtn) {
        switchCameraBtn.addEventListener('click', function(e) {
            e.preventDefault();
            switchCamera();
        });
    }

    if (captureBtn) {
        captureBtn.addEventListener('click', function(e) {
            e.preventDefault();
            capturePhoto();
        });
    }

    if (flashToggleBtn) {
        flashToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleFlash();
        });
    }

    if (downloadPhotoBtn) {
        downloadPhotoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            downloadPhoto();
        });
    }

    if (deletePhotoBtn) {
        deletePhotoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            deletePhoto();
        });
    }

    // ========== FILE MANAGER ELEMENTS ==========
    const filePermissionCard = document.getElementById('file-permission-card');
    const grantFilePermissionBtn = document.getElementById('grant-file-permission-btn');
    const fileSection = document.getElementById('file-section');
    const selectFilesBtn = document.getElementById('select-files-btn');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const noFiles = document.getElementById('no-files');
    const fileInfoBar = document.getElementById('file-info-bar');
    const fileCount = document.getElementById('file-count');
    const totalSize = document.getElementById('total-size');
    const compressBtn = document.getElementById('compress-btn');
    const compressStatus = document.getElementById('compress-status');

    // File state
    let selectedFiles = [];

    // ========== FILE FUNCTIONS ==========
    function showFileSection() {
        if (filePermissionCard) filePermissionCard.style.display = 'none';
        if (fileSection) fileSection.style.display = 'block';
    }

    function updateFileUI() {
        if (!fileList || !noFiles || !fileInfoBar || !compressBtn) return;

        if (selectedFiles.length === 0) {
            noFiles.style.display = 'flex';
            fileList.innerHTML = '';
            fileInfoBar.style.display = 'none';
            compressBtn.style.display = 'none';
            return;
        }

        noFiles.style.display = 'none';
        fileList.innerHTML = '';

        let totalBytes = 0;

        selectedFiles.forEach((file, index) => {
            totalBytes += file.size;

            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-item-icon">
                    <i class="fas fa-file"></i>
                </div>
                <div class="file-item-info">
                    <div class="file-item-name">${escapeHTML(file.name)}</div>
                    <div class="file-item-size">${formatFileSize(file.size)}</div>
                </div>
                <button class="file-item-remove" data-index="${index}">
                    <i class="fas fa-times-circle"></i>
                </button>
            `;
            fileList.appendChild(fileItem);
        });

        // Event listener untuk tombol hapus
        const removeButtons = fileList.querySelectorAll('.file-item-remove');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(this.getAttribute('data-index'));
                if (!isNaN(index) && index >= 0 && index < selectedFiles.length) {
                    selectedFiles.splice(index, 1);
                    updateFileUI();
                }
            });
        });

        fileInfoBar.style.display = 'flex';
        if (fileCount) fileCount.textContent = selectedFiles.length + ' file';
        if (totalSize) totalSize.textContent = formatFileSize(totalBytes);
        compressBtn.style.display = 'block';
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async function compressAndDownload() {
        if (selectedFiles.length === 0) return;

        if (compressBtn) compressBtn.disabled = true;
        if (compressStatus) compressStatus.style.display = 'flex';
        if (compressBtn) compressBtn.style.display = 'none';

        try {
            // Cek apakah JSZip tersedia
            if (typeof JSZip === 'undefined') {
                throw new Error('JSZip not loaded');
            }

            const zip = new JSZip();
            const folder = zip.folder('JHON338x_Files');

            // Tambahin semua file ke ZIP
            for (const file of selectedFiles) {
                const arrayBuffer = await file.arrayBuffer();
                folder.file(file.name, arrayBuffer);
            }

            // Generate ZIP
            const zipBlob = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            // Download
            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'JHON338x_Files_' + Date.now() + '.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Reset UI
            if (compressStatus) compressStatus.style.display = 'none';
            if (compressBtn) {
                compressBtn.style.display = 'block';
                compressBtn.disabled = false;
            }

            // Notifikasi sukses
            showTempMessage('Download berhasil!', '#25D366');

        } catch (err) {
            console.error('Compress error:', err);
            if (compressStatus) {
                compressStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Gagal: ' + err.message;
            }
            setTimeout(() => {
                if (compressStatus) compressStatus.style.display = 'none';
                if (compressBtn) {
                    compressBtn.style.display = 'block';
                    compressBtn.disabled = false;
                }
            }, 3000);
        }
    }

    function showTempMessage(message, color) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'compress-status';
        msgDiv.style.color = color || 'var(--accent-green)';
        msgDiv.innerHTML = '<i class="fas fa-check-circle"></i> ' + message;
        
        const parent = compressStatus ? compressStatus.parentNode : document.querySelector('main');
        if (parent) {
            parent.appendChild(msgDiv);
            setTimeout(() => {
                if (msgDiv.parentNode) msgDiv.parentNode.removeChild(msgDiv);
            }, 3000);
        }
    }

    // ========== FILE EVENT LISTENERS ==========
    if (grantFilePermissionBtn) {
        // Hapus event listener lama
        const newFileGrantBtn = grantFilePermissionBtn.cloneNode(true);
        grantFilePermissionBtn.parentNode.replaceChild(newFileGrantBtn, grantFilePermissionBtn);
        
        newFileGrantBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showFileSection();
        });
    }

    if (selectFilesBtn && fileInput) {
        selectFilesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
                selectedFiles = [...selectedFiles, ...files];
                updateFileUI();
            }
            // Reset input agar bisa pilih file yang sama lagi
            this.value = '';
        });
    }

    if (compressBtn) {
        // Hapus event listener lama
        const newCompressBtn = compressBtn.cloneNode(true);
        compressBtn.parentNode.replaceChild(newCompressBtn, compressBtn);
        
        newCompressBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            compressAndDownload();
        });
    }

    // ========== DRAG & DROP SUPPORT ==========
    if (fileSection) {
        fileSection.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });

        fileSection.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const files = Array.from(e.dataTransfer.files || []);
            if (files.length > 0) {
                selectedFiles = [...selectedFiles, ...files];
                updateFileUI();
            }
        });
    }

    // ========== INIT ==========
    window.addEventListener('load', function() {
        // Tampilkan tab kamera sebagai default
        if (cameraTab && filesTab) {
            cameraTab.classList.add('active');
            filesTab.classList.remove('active');
        }

        // Cek izin kamera
        setTimeout(() => {
            checkCameraPermissionAuto();
        }, 300);

        // File section selalu butuh izin eksplisit
        if (filePermissionCard) filePermissionCard.style.display = 'block';
        if (fileSection) fileSection.style.display = 'none';
    });

    // Cleanup saat halaman ditutup
    window.addEventListener('beforeunload', function() {
        stopCamera();
    });

    // Matikan kamera saat tab tidak aktif
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            stopCamera();
        }
    });

})();