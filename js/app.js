// JHON338xDEVICES - Logic Lengkap dengan Deteksi Akurat

(function() {
    'use strict';

    // ========== ELEMEN ==========
    const loadingScreen = document.getElementById('loading-screen');
    const usernameModal = document.getElementById('username-modal');
    const mainApp = document.getElementById('main-app');
    const displayUsername = document.getElementById('display-username');
    const usernameInput = document.getElementById('username-input');
    const saveUsernameBtn = document.getElementById('save-username-btn');
    const editBadge = document.getElementById('edit-badge');

    // Video elements
    const bgVideo = document.getElementById('bg-video');
    const blurSlider = document.getElementById('blur-slider');
    const blurValue = document.getElementById('blur-value');
    const muteToggle = document.getElementById('mute-toggle');

    // Info elements
    const batteryLevel = document.getElementById('battery-level');
    const batteryStatus = document.getElementById('battery-status');
    const currentTime = document.getElementById('current-time');
    const currentDate = document.getElementById('current-date');
    const networkType = document.getElementById('network-type');
    const ipAddress = document.getElementById('ip-address');
    const deviceModel = document.getElementById('device-model');
    const deviceBrand = document.getElementById('device-brand');
    const osVersion = document.getElementById('os-version');

    // ========== STATE ==========
    const STORAGE_KEY = 'jhon338xdevices_username';
    let isMuted = true;
    let deviceInfoCache = null;

    // ========== FUNCTIONS ==========
    function getSavedUsername() {
        return localStorage.getItem(STORAGE_KEY) || '';
    }

    function saveUsername(name) {
        localStorage.setItem(STORAGE_KEY, name.trim() || 'Guest');
    }

    function updateDisplayUsername() {
        const saved = getSavedUsername();
        displayUsername.textContent = saved || 'Guest';
    }

    function showUsernameModal() {
        usernameInput.value = getSavedUsername() || '';
        usernameModal.style.display = 'flex';
        setTimeout(() => usernameInput.focus(), 100);
    }

    function hideUsernameModal() {
        usernameModal.style.display = 'none';
    }

    function showMainApp() {
        mainApp.style.display = 'block';
        mainApp.animate([
            { opacity: 0, transform: 'scale(0.98)' },
            { opacity: 1, transform: 'scale(1)' }
        ], {
            duration: 400,
            easing: 'ease-out'
        });
    }

    // ========== LOADING SEQUENCE ==========
    window.addEventListener('load', function() {
        setTimeout(function() {
            loadingScreen.style.display = 'none';

            const saved = getSavedUsername();
            if (saved && saved.trim() !== '') {
                updateDisplayUsername();
                showMainApp();
                initAllRealtime();
            } else {
                showUsernameModal();
            }
        }, 3000);
    });

    // ========== SAVE USERNAME ==========
    saveUsernameBtn.addEventListener('click', function() {
        const name = usernameInput.value.trim();
        if (name !== '') {
            saveUsername(name);
            updateDisplayUsername();
            hideUsernameModal();
            showMainApp();
            initAllRealtime();
        } else {
            usernameInput.style.borderColor = '#ff3333';
            setTimeout(() => {
                usernameInput.style.borderColor = '#2a4b6e';
            }, 800);
        }
    });

    usernameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            saveUsernameBtn.click();
        }
    });

    // ========== EDIT USERNAME ==========
    editBadge.addEventListener('click', function() {
        showUsernameModal();
    });

    // ========== VIDEO CONTROLS ==========
    blurSlider.addEventListener('input', function() {
        const val = this.value;
        blurValue.textContent = val;
        bgVideo.style.filter = `blur(${val}px)`;
    });

    muteToggle.addEventListener('click', function() {
        isMuted = !isMuted;
        bgVideo.muted = isMuted;
        if (isMuted) {
            muteToggle.innerHTML = 'MUTE';
        } else {
            muteToggle.innerHTML = 'UNMUTE';
        }
    });

    bgVideo.muted = true;
    bgVideo.style.filter = `blur(${blurSlider.value}px)`;
    blurValue.textContent = blurSlider.value;

    // ========== REALTIME DEVICE INFO ==========
    function updateDateTime() {
        const now = new Date();
        currentTime.textContent = now.toLocaleTimeString('id-ID', { hour12: false });
        currentDate.textContent = now.toLocaleDateString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    async function updateBattery() {
        try {
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery();
                const updateBatteryUI = () => {
                    batteryLevel.textContent = Math.round(battery.level * 100) + '%';
                    batteryStatus.textContent = battery.charging ? '⚡ Charging' : '🔌 Baterai';
                };
                updateBatteryUI();
                battery.addEventListener('levelchange', updateBatteryUI);
                battery.addEventListener('chargingchange', updateBatteryUI);
            } else {
                batteryLevel.textContent = 'N/A';
                batteryStatus.textContent = '--';
            }
        } catch (e) {
            batteryLevel.textContent = '--%';
            batteryStatus.textContent = 'Error';
        }
    }

    function updateNetwork() {
        if ('connection' in navigator) {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (conn && conn.effectiveType) {
                networkType.textContent = conn.effectiveType.toUpperCase();
                conn.addEventListener('change', () => {
                    networkType.textContent = (conn.effectiveType || 'WiFi').toUpperCase();
                });
            } else if (conn && conn.type) {
                networkType.textContent = conn.type.toUpperCase();
            } else {
                networkType.textContent = navigator.onLine ? 'ONLINE' : 'OFFLINE';
            }
        } else {
            networkType.textContent = navigator.onLine ? 'ONLINE' : 'OFFLINE';
        }

        window.addEventListener('online', () => {
            networkType.textContent = 'ONLINE';
        });
        window.addEventListener('offline', () => {
            networkType.textContent = 'OFFLINE';
        });
    }

    async function fetchIP() {
        // Coba beberapa API untuk redundansi
        const apis = [
            'https://api.ipify.org?format=json',
            'https://api.myip.com',
            'https://ipapi.co/json/'
        ];

        for (const api of apis) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const res = await fetch(api, { signal: controller.signal });
                clearTimeout(timeoutId);
                
                const data = await res.json();
                
                if (data.ip) {
                    ipAddress.textContent = data.ip;
                    return;
                } else if (data.ip_address) {
                    ipAddress.textContent = data.ip_address;
                    return;
                }
            } catch (e) {
                continue;
            }
        }
        
        // Fallback: cek lokal
        try {
            const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            pc.createDataChannel('');
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            // Tunggu kandidat ICE
            const localIP = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('timeout')), 3000);
                pc.onicecandidate = (e) => {
                    if (e.candidate) {
                        const ip = e.candidate.address;
                        if (ip && !ip.includes(':')) {
                            clearTimeout(timeout);
                            resolve(ip);
                        }
                    }
                };
            });
            
            ipAddress.textContent = localIP || 'Tidak terdeteksi';
        } catch (e) {
            ipAddress.textContent = 'Periksa koneksi';
        }
    }

    function detectDeviceInfo() {
        if (deviceInfoCache) {
            renderDeviceInfo(deviceInfoCache);
            return;
        }

        const ua = navigator.userAgent;
        const platform = navigator.platform || '';
        const maxTouchPoints = navigator.maxTouchPoints || 0;
        const vendor = navigator.vendor || '';
        
        let brand = '';
        let model = '';
        let os = '';

        // ===== DETEKSI OS & VERSI =====
        if (/Android/.test(ua)) {
            const match = ua.match(/Android\s([\d.]+)/);
            os = match ? 'Android ' + match[1] : 'Android';
            
            // Coba ambil dari navigator.userAgentData (modern)
            if (navigator.userAgentData && navigator.userAgentData.platform) {
                os = navigator.userAgentData.platform + ' ' + (match ? match[1] : '');
            }
        } else if (/iPhone|iPad|iPod/.test(ua)) {
            const match = ua.match(/OS\s(\d+[_\d]*)/);
            os = match ? 'iOS ' + match[1].replace(/_/g, '.') : 'iOS';
            
            if (/iPad/.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1)) {
                os = 'iPadOS ' + (match ? match[1].replace(/_/g, '.') : '');
            }
        } else if (/Windows/.test(ua)) {
            const match = ua.match(/Windows NT\s([\d.]+)/);
            os = match ? 'Windows ' + mapWindowsVersion(match[1]) : 'Windows';
        } else if (/Macintosh/.test(ua) || /Mac OS X/.test(ua)) {
            const match = ua.match(/Mac OS X\s([\d_]+)/);
            os = match ? 'macOS ' + match[1].replace(/_/g, '.') : 'macOS';
        } else if (/Linux/.test(ua) && !/Android/.test(ua)) {
            os = 'Linux';
        } else {
            os = 'Unknown OS';
        }

        // ===== DETEKSI MEREK & MODEL =====
        if (/iPhone/.test(ua)) {
            brand = 'Apple';
            model = detectiPhoneModel(ua);
        } else if (/iPad/.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1)) {
            brand = 'Apple';
            model = 'iPad';
        } else if (/Android/.test(ua)) {
            // Coba User-Agent Client Hints dulu (modern)
            if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
                navigator.userAgentData.getHighEntropyValues(['model', 'platformVersion'])
                    .then(data => {
                        if (data.model) model = data.model;
                        detectAndroidBrand(ua, brand, model);
                    })
                    .catch(() => {
                        detectAndroidBrand(ua, brand, model);
                    });
            }
            
            const result = detectAndroidBrandModel(ua);
            brand = result.brand;
            model = result.model;
        } else if (/Windows/.test(ua)) {
            brand = 'Microsoft';
            model = 'PC/Desktop';
        } else if (/Macintosh/.test(ua)) {
            brand = 'Apple';
            model = 'Mac';
        } else {
            brand = 'Unknown';
            model = 'Unknown Device';
        }

        deviceInfoCache = { brand, model, os };
        renderDeviceInfo(deviceInfoCache);
    }

    function detectAndroidBrandModel(ua) {
        let brand = 'Android';
        let model = '';

        // Ekstrak model dari build fingerprint
        const buildMatch = ua.match(/;\s?([^;]+?)\s(Build\/|\))/);
        if (buildMatch && buildMatch[1]) {
            model = buildMatch[1].trim();
        }

        // Deteksi brand spesifik
        const brands = [
            { pattern: /Samsung|SM-|GT-|SCH-/i, name: 'Samsung' },
            { pattern: /Xiaomi|Mi\s|Redmi|POCO|M\d{4}/i, name: 'Xiaomi' },
            { pattern: /OPPO|CPH|RMX/i, name: 'OPPO' },
            { pattern: /vivo|V\d{4}|iQOO/i, name: 'vivo' },
            { pattern: /Huawei|Honor|HMA-|ANE-|CLT-/i, name: 'Huawei' },
            { pattern: /Realme|RMX/i, name: 'Realme' },
            { pattern: /OnePlus|LE\d{4}|GM\d{4}/i, name: 'OnePlus' },
            { pattern: /Motorola|Moto|XT\d{4}/i, name: 'Motorola' },
            { pattern: /LG|LM-|LGM-/i, name: 'LG' },
            { pattern: /Infinix|X\d{3,4}/i, name: 'Infinix' },
            { pattern: /Tecno|TECNO/i, name: 'Tecno' },
            { pattern: /Asus|ASUS|Zenfone/i, name: 'Asus' },
            { pattern: /Sony|Xperia/i, name: 'Sony' },
            { pattern: /Nokia/i, name: 'Nokia' },
            { pattern: /Google|Pixel/i, name: 'Google' },
            { pattern: /Nothing/i, name: 'Nothing' },
        ];

        for (const b of brands) {
            if (b.pattern.test(ua)) {
                brand = b.name;
                break;
            }
        }

        // Jika model kosong, coba ambil dari product name
        if (!model) {
            const productMatch = ua.match(/\)\s?([\w\s-]+?)\s(Build|Chrome)/);
            if (productMatch && productMatch[1]) {
                model = productMatch[1].trim();
            }
        }

        // Fallback model
        if (!model || model === 'K' || model.length < 2) {
            model = 'Android Device';
        }

        return { brand, model };
    }

    function detectiPhoneModel(ua) {
        if (/iPhone16,2/.test(ua) || /iPhone 15 Pro Max/i.test(ua)) return 'iPhone 15 Pro Max';
        if (/iPhone16,1/.test(ua) || /iPhone 15 Pro/i.test(ua)) return 'iPhone 15 Pro';
        if (/iPhone15,4/.test(ua) || /iPhone 15/.test(ua)) return 'iPhone 15';
        if (/iPhone15,2/.test(ua) || /iPhone 14 Pro Max/i.test(ua)) return 'iPhone 14 Pro Max';
        if (/iPhone14,3/.test(ua) || /iPhone 13 Pro Max/i.test(ua)) return 'iPhone 13 Pro Max';
        return 'iPhone';
    }

    function mapWindowsVersion(nt) {
        const versions = {
            '10.0': '10/11',
            '6.3': '8.1',
            '6.2': '8',
            '6.1': '7',
        };
        return versions[nt] || nt;
    }

    function renderDeviceInfo(info) {
        deviceBrand.textContent = info.brand;
        deviceModel.textContent = info.model;
        osVersion.textContent = info.os;
    }

    // ===== INISIALISASI SEMUA =====
    function initAllRealtime() {
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        updateBattery();
        updateNetwork();
        fetchIP();
        detectDeviceInfo();
        
        // Refresh berkala
        setInterval(fetchIP, 60000);
        setInterval(detectDeviceInfo, 30000);
    }

    // Jalankan deteksi ulang saat online
    window.addEventListener('online', () => {
        fetchIP();
        updateNetwork();
    });

})();