// JHON338xDEVICES - Logic Lengkap

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

    // ========== EDIT USERNAME (hanya dari badge Edit) ==========
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
            muteToggle.innerHTML = ' MUTE';
        } else {
            muteToggle.innerHTML = ' UNMUTE';
        }
    });

    // Init video
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
            batteryLevel.textContent = '--';
            batteryStatus.textContent = '--';
        }
    }

    function updateNetwork() {
        if ('connection' in navigator) {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (conn) {
                networkType.textContent = (conn.effectiveType || conn.type || 'WiFi').toUpperCase();
                conn.addEventListener('change', () => {
                    networkType.textContent = (conn.effectiveType || conn.type || 'WiFi').toUpperCase();
                });
            }
        } else {
            networkType.textContent = navigator.onLine ? 'ONLINE' : 'OFFLINE';
        }
    }

    async function fetchIP() {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            ipAddress.textContent = data.ip;
        } catch (e) {
            ipAddress.textContent = '--.--.--.--';
        }
    }

    function detectDevice() {
        const ua = navigator.userAgent;
        let brand = 'Unknown';
        let model = 'Unknown';

        if (/iPhone/.test(ua)) {
            brand = 'Apple';
            model = 'iPhone';
        } else if (/iPad/.test(ua)) {
            brand = 'Apple';
            model = 'iPad';
        } else if (/Android/.test(ua)) {
            brand = 'Android';
            const match = ua.match(/;\s?([^;]+?)\s(Build|\))/);
            if (match && match[1]) model = match[1].trim();
            if (/Samsung|SM-/i.test(ua)) brand = 'Samsung';
            else if (/Xiaomi|Mi|Redmi|POCO/i.test(ua)) brand = 'Xiaomi';
            else if (/OPPO/i.test(ua)) brand = 'OPPO';
            else if (/vivo/i.test(ua)) brand = 'vivo';
            else if (/Huawei|Honor/i.test(ua)) brand = 'Huawei';
            else if (/Realme/i.test(ua)) brand = 'Realme';
        } else if (/Windows/.test(ua)) {
            brand = 'Microsoft';
            model = 'PC';
        } else if (/Macintosh/.test(ua)) {
            brand = 'Apple';
            model = 'Mac';
        }

        deviceBrand.textContent = brand;
        deviceModel.textContent = model;
    }

    function detectOS() {
        const ua = navigator.userAgent;
        let os = 'Unknown';
        if (/Android\s([\d.]+)/.test(ua)) os = 'Android ' + RegExp.$1;
        else if (/iPhone OS\s([\d_]+)/.test(ua)) os = 'iOS ' + RegExp.$1.replace(/_/g, '.');
        else if (/Windows NT\s([\d.]+)/.test(ua)) os = 'Windows ' + RegExp.$1;
        else if (/Mac OS X\s([\d_]+)/.test(ua)) os = 'macOS ' + RegExp.$1.replace(/_/g, '.');
        osVersion.textContent = os;
    }

    function initAllRealtime() {
        updateDateTime();
        setInterval(updateDateTime, 1000);
        updateBattery();
        updateNetwork();
        fetchIP();
        detectDevice();
        detectOS();
        setInterval(fetchIP, 30000);
    }

})();