// JHON338xDEVICES - Device Tools Logic
// Camera + File Manager + ZIP Compression

(function() {
    'use strict';

    // ========== TAB NAVIGATION ==========
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });

            // Inisialisasi sesuai tab
            if (targetTab === 'camera-tab') {
                checkCameraPermission();
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

    // ========== KAMERA FUNCTIONS ==========
    async function requestCameraPermission() {
        try {
            const testStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            testStream.getTracks().forEach(t => t.stop());
            return true;
        } catch (err) {
            return false;
        }
    }

    async function startCamera() {
        stopCamera();

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
            cameraPlaceholder.style.display = 'none';
            cameraPreview.style.display = 'block';
            updateFacingStatus();
            checkFlashCapability();
        } catch (err) {
            cameraPlaceholder.innerHTML = '<i class="fas fa-exclamation-triangle"></i><p>Gagal akses kamera</p>';
            cameraPlaceholder.style.display = 'flex';
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
        cameraFacing.innerHTML = facingMode === 'environment' 
            ? '<i class="fas fa-camera"></i> Kamera: Belakang'
            : '<i class="fas fa-camera"></i> Kamera: Depan';
    }

    function switchCamera() {
        facingMode = facingMode === 'environment' ? 'user' : 'environment';
        flashEnabled = false;
        flashStatus.innerHTML = '<i class="fas fa-bolt"></i> Flash: OFF';
        flashToggleBtn.style.opacity = '1';
        flashToggleBtn.style.pointerEvents = 'auto';
        startCamera();
    }

    function checkFlashCapability() {
        if (!track) {
            flashToggleBtn.style.opacity = '0.5';
            flashToggleBtn.style.pointerEvents = 'none';
            flashStatus.innerHTML = '<i class="fas fa-bolt"></i> Flash: N/A';
            return;
        }

        // Cek kemampuan torch
        const capabilities = track.getCapabilities ? track.getCapabilities() : null;
        
        if (capabilities && capabilities.torch !== undefined) {
            flashToggleBtn.style.opacity = '1';
            flashToggleBtn.style.pointerEvents = 'auto';
            flashStatus.innerHTML = '<i class="fas fa-bolt"></i> Flash: OFF';
            
            // Reset flash state
            flashEnabled = false;
            track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
        } else if (facingMode === 'user') {
            flashToggleBtn.style.opacity = '0.5';
            flashToggleBtn.style.pointerEvents = 'none';
            flashStatus.innerHTML = '<i class="fas fa-bolt"></i> Flash: OFF (depan)';
        } else {
            // Coba tetap aktifkan (beberapa device support walau capabilities gak kelapor)
            flashToggleBtn.style.opacity = '1';
            flashToggleBtn.style.pointerEvents = 'auto';
            flashStatus.innerHTML = '<i class="fas fa-bolt"></i> Flash: Coba';
        }
    }

    async function toggleFlash(forceState) {
        if (!track) return;

        try {
            const newState = (forceState !== undefined) ? forceState : !flashEnabled;
            
            await track.applyConstraints({
                advanced: [{ torch: newState }]
            });
            
            flashEnabled = newState;
            flashStatus.innerHTML = flashEnabled 
                ? '<i class="fas fa-bolt"></i> Flash: ON' 
                : '<i class="fas fa-bolt"></i> Flash: OFF';
        } catch (err) {
            // Fallback: coba tanpa advanced
            try {
                await track.applyConstraints({ torch: !flashEnabled } as any);
                flashEnabled = !flashEnabled;
                flashStatus.innerHTML = flashEnabled 
                    ? '<i class="fas fa-bolt"></i> Flash: ON' 
                    : '<i class="fas fa-bolt"></i> Flash: OFF';
            } catch (err2) {
                flashStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Flash: Gagal';
                setTimeout(() => {
                    flashStatus.innerHTML = '<i class="fas fa-bolt"></i> Flash: OFF';
                }, 2000);
            }
        }
    }

    function capturePhoto() {
        if (!currentStream || !track) {
            startCamera();
            setTimeout(() => capturePhoto(), 600);
            return;
        }

        const video = cameraPreview;
        const canvas = cameraCanvas;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        capturedImageData = canvas.toDataURL('image/png');
        capturedImage.src = capturedImageData;
        capturedImage.style.display = 'block';
        noPhoto.style.display = 'none';
        photoActions.style.display = 'flex';
    }

    function downloadPhoto() {
        if (!capturedImageData) return;
        const link = document.createElement('a');
        link.download = 'JHON338x_' + Date.now() + '.png';
        link.href = capturedImageData;
        link.click();
    }

    function deletePhoto() {
        capturedImageData = null;
        capturedImage.src = '';
        capturedImage.style.display = 'none';
        noPhoto.style.display = 'flex';
        photoActions.style.display = 'none';
    }

    async function checkCameraPermission() {
        try {
            const testStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            testStream.getTracks().forEach(t => t.stop());
            
            permissionCard.style.display = 'none';
            cameraSection.style.display = 'block';
            startCamera();
        } catch (e) {
            permissionCard.style.display = 'block';
            cameraSection.style.display = 'none';
        }
    }

    // ========== KAMERA EVENT LISTENERS ==========
    grantPermissionBtn.addEventListener('click', async () => {
        const granted = await requestCameraPermission();
        if (granted) {
            permissionCard.style.display = 'none';
            cameraSection.style.display = 'block';
            startCamera();
        } else {
            grantPermissionBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> IZIN DITOLAK';
            grantPermissionBtn.style.backgroundColor = 'var(--accent-red)';
            setTimeout(() => {
                grantPermissionBtn.innerHTML = '<i class="fas fa-check-circle"></i> IZINKAN AKSES KAMERA';
                grantPermissionBtn.style.backgroundColor = 'var(--accent-blue)';
            }, 2000);
        }
    });

    switchCameraBtn.addEventListener('click', switchCamera);
    captureBtn.addEventListener('click', capturePhoto);
    flashToggleBtn.addEventListener('click', () => toggleFlash());
    downloadPhotoBtn.addEventListener('click', downloadPhoto);
    deletePhotoBtn.addEventListener('click', deletePhoto);

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
    function updateFileUI() {
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
                    <div class="file-item-name">${file.name}</div>
                    <div class="file-item-size">${formatFileSize(file.size)}</div>
                </div>
                <button class="file-item-remove" data-index="${index}">
                    <i class="fas fa-times-circle"></i>
                </button>
            `;
            fileList.appendChild(fileItem);
        });

        // Event listener untuk tombol hapus
        fileList.querySelectorAll('.file-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.getAttribute('data-index'));
                selectedFiles.splice(index, 1);
                updateFileUI();
            });
        });

        fileInfoBar.style.display = 'flex';
        fileCount.textContent = selectedFiles.length + ' file';
        totalSize.textContent = formatFileSize(totalBytes);
        compressBtn.style.display = 'block';
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

        compressBtn.disabled = true;
        compressStatus.style.display = 'flex';
        compressBtn.style.display = 'none';

        try {
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

            // Reset
            compressStatus.style.display = 'none';
            compressBtn.style.display = 'block';
            compressBtn.disabled = false;

            // Notifikasi sukses
            const tempStatus = document.createElement('div');
            tempStatus.className = 'compress-status';
            tempStatus.style.color = 'var(--accent-green)';
            tempStatus.innerHTML = '<i class="fas fa-check-circle"></i> Download berhasil!';
            compressStatus.parentNode.insertBefore(tempStatus, compressStatus.nextSibling);
            setTimeout(() => tempStatus.remove(), 3000);

        } catch (err) {
            console.error('Compress error:', err);
            compressStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Gagal kompres file';
            setTimeout(() => {
                compressStatus.style.display = 'none';
                compressBtn.style.display = 'block';
                compressBtn.disabled = false;
            }, 2000);
        }
    }

    // ========== FILE EVENT LISTENERS ==========
    grantFilePermissionBtn.addEventListener('click', () => {
        filePermissionCard.style.display = 'none';
        fileSection.style.display = 'block';
    });

    selectFilesBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            selectedFiles = [...selectedFiles, ...files];
            updateFileUI();
            fileInput.value = '';
        }
    });

    compressBtn.addEventListener('click', compressAndDownload);

    // ========== INIT ==========
    window.addEventListener('load', () => {
        // Cek izin kamera saat load
        checkCameraPermission();
    });

    window.addEventListener('beforeunload', () => {
        stopCamera();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopCamera();
        }
    });

})();