// JHON338xDEVICES - Device Tools Logic
// Camera dengan permission request

(function() {
    'use strict';

    // ========== ELEMEN ==========
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

    // ========== STATE ==========
    let currentStream = null;
    let facingMode = 'environment'; // 'environment' = belakang, 'user' = depan
    let flashEnabled = false;
    let track = null;
    let capturedImageData = null;

    // ========== FUNCTIONS ==========

    // Minta izin kamera
    async function requestCameraPermission() {
        try {
            // Coba akses kamera untuk trigger permission prompt
            const testStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            // Jika berhasil, hentikan test stream
            testStream.getTracks().forEach(t => t.stop());
            return true;
        } catch (err) {
            console.error('Permission denied:', err);
            return false;
        }
    }

    // Mulai kamera setelah izin
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

            // Update status facing
            updateFacingStatus();

            // Cek flash capability
            if (facingMode === 'environment') {
                checkFlashCapability();
            } else {
                flashEnabled = false;
                flashStatus.innerHTML = '<i class="fas fa-bolt"></i> Flash: OFF (depan)';
                flashToggleBtn.style.opacity = '0.5';
                flashToggleBtn.style.pointerEvents = 'none';
            }

        } catch (err) {
            console.error('Error accessing camera:', err);
            cameraPlaceholder.innerHTML = '<i class="fas fa-exclamation-triangle"></i><p>Gagal akses kamera</p>';
            cameraPlaceholder.style.display = 'flex';
            cameraPreview.style.display = 'none';
        }
    }

    function stopCamera() {
        if (currentStream) {
            currentStream.getTracks().forEach(t => t.stop());
            currentStream = null;
            track = null;
        }
        if (track && flashEnabled) {
            toggleFlash(false);
        }
    }

    function updateFacingStatus() {
        if (facingMode === 'environment') {
            cameraFacing.innerHTML = '<i class="fas fa-camera"></i> Kamera: Belakang';
        } else {
            cameraFacing.innerHTML = '<i class="fas fa-camera"></i> Kamera: Depan';
        }
    }

    function switchCamera() {
        if (facingMode === 'environment') {
            facingMode = 'user';
        } else {
            facingMode = 'environment';
        }
        flashEnabled = false;
        flashStatus.innerHTML = '<i class="fas fa-bolt"></i> Flash: OFF';
        flashToggleBtn.style.opacity = '1';
        flashToggleBtn.style.pointerEvents = 'auto';
        startCamera();
    }

    function checkFlashCapability() {
        if (track && track.getCapabilities && track.getCapabilities().torch) {
            flashToggleBtn.style.opacity = '1';
            flashToggleBtn.style.pointerEvents = 'auto';
            flashStatus.innerHTML = '<i class="fas fa-bolt"></i> Flash: OFF';
        } else {
            flashToggleBtn.style.opacity = '0.5';
            flashToggleBtn.style.pointerEvents = 'none';
            flashStatus.innerHTML = '<i class="fas fa-bolt"></i> Flash: N/A';
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
            console.error('Flash error:', err);
        }
    }

    function capturePhoto() {
        if (!currentStream || !track) {
            startCamera();
            setTimeout(() => capturePhoto(), 500);
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

        // Flash feedback
        flashStatus.innerHTML = '<i class="fas fa-check-circle"></i> Foto diambil!';
        setTimeout(() => {
            flashStatus.innerHTML = flashEnabled 
                ? '<i class="fas fa-bolt"></i> Flash: ON' 
                : '<i class="fas fa-bolt"></i> Flash: OFF';
        }, 1500);
    }

    function downloadPhoto() {
        if (!capturedImageData) return;
        const link = document.createElement('a');
        link.download = 'JHON338xDEVICES_' + Date.now() + '.png';
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

    // ========== EVENT LISTENERS ==========

    // Tombol izin kamera
    grantPermissionBtn.addEventListener('click', async () => {
        const granted = await requestCameraPermission();
        if (granted) {
            permissionCard.style.display = 'none';
            cameraSection.style.display = 'block';
            startCamera();
        } else {
            // Update UI permission card untuk menunjukkan error
            grantPermissionBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> IZIN DITOLAK - COBA LAGI';
            grantPermissionBtn.style.backgroundColor = 'var(--accent-red)';
            setTimeout(() => {
                grantPermissionBtn.innerHTML = '<i class="fas fa-check-circle"></i> IZINKAN AKSES KAMERA';
                grantPermissionBtn.style.backgroundColor = 'var(--accent-blue)';
            }, 2000);
        }
    });

    switchCameraBtn.addEventListener('click', switchCamera);
    captureBtn.addEventListener('click', capturePhoto);

    flashToggleBtn.addEventListener('click', () => {
        if (facingMode === 'environment' && track) {
            toggleFlash();
        }
    });

    downloadPhotoBtn.addEventListener('click', downloadPhoto);
    deletePhotoBtn.addEventListener('click', deletePhoto);

    // ========== INIT ==========
    // Cek apakah izin sudah pernah diberikan sebelumnya
    window.addEventListener('load', async () => {
        // Coba langsung akses (jika sudah pernah diizinkan)
        try {
            const testStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            testStream.getTracks().forEach(t => t.stop());
            // Sudah ada izin, langsung tampilkan kamera
            permissionCard.style.display = 'none';
            cameraSection.style.display = 'block';
            startCamera();
        } catch (e) {
            // Belum ada izin, tampilkan permission card
            permissionCard.style.display = 'block';
            cameraSection.style.display = 'none';
        }
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