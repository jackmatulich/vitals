// js/common.js - Shared utility functions

/**
 * Dweet.io communication utility functions
 */
const DweetIO = {
    // Base URL for dweet.io API
    baseUrl: 'https://dweet.io',

    /**
     * Send data to dweet.io
     * @param {string} sessionId - Session identifier
     * @param {string} role - 'controller' or 'simulator'
     * @param {object} data - Data to send
     * @returns {Promise<object>} Response from dweet.io
     */
    async send(sessionId, role, data) {
        try {
            const thingName = `ultrasound-${role}-${sessionId}`;
            const response = await fetch(`${this.baseUrl}/dweet/for/${thingName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error sending data to dweet.io (${role}):`, error);
            return null;
        }
    },

    /**
     * Get latest data from dweet.io
     * @param {string} sessionId - Session identifier
     * @param {string} role - 'controller' or 'simulator'
     * @returns {Promise<object>} Data from dweet.io
     */
    async getLatest(sessionId, role) {
        try {
            const thingName = `ultrasound-${role}-${sessionId}`;
            const response = await fetch(`${this.baseUrl}/get/latest/dweet/for/${thingName}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.this === 'succeeded' && data.with && data.with.length > 0) {
                return data.with[0].content;
            }
            
            return null;
        } catch (error) {
            console.error(`Error getting data from dweet.io (${role}):`, error);
            return null;
        }
    }
};

/**
 * Screen Manager - Handles transitions between different screens
 */
const ScreenManager = {
    /**
     * Switch to a specific screen
     * @param {string} screenId - ID of the screen to show
     */
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show the requested screen
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        }
    },
    
    /**
     * Initialize screen state based on URL parameters
     * @returns {object} Parameters from URL
     */
    initFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        const sessionId = urlParams.get('session');
        
        if (mode === 'controller' && sessionId) {
            // Auto-connect controller with the given session ID
            this.showScreen('controllerScreen');
            return { mode, sessionId };
        } else if (mode === 'simulator') {
            // Show simulator screen
            this.showScreen('simulatorScreen');
            return { mode };
        }
        
        // Default: show mode selection screen
        this.showScreen('modeSelection');
        return {};
    }
};

/**
 * Generate a random session ID
 * @returns {string} 8-character random ID
 */
function generateSessionId() {
    return uuid.v4().slice(0, 8);
}

/**
 * Helper function to read file as ArrayBuffer
 * @param {File} file - File to read
 * @returns {Promise<ArrayBuffer>} File contents as ArrayBuffer
 */
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Convert Euler angles to quaternion
 * @param {number} alpha - Z-axis rotation in degrees [0, 360)
 * @param {number} beta - X-axis rotation in degrees [-180, 180)
 * @param {number} gamma - Y-axis rotation in degrees [-90, 90)
 * @returns {object} Quaternion {x, y, z, w}
 */
function eulerToQuaternion(alpha, beta, gamma) {
    // Convert angles from degrees to radians
    const alphaRad = alpha * (Math.PI / 180);
    const betaRad = beta * (Math.PI / 180);
    const gammaRad = gamma * (Math.PI / 180);
    
    // Calculate half angles
    const cx = Math.cos(betaRad / 2);
    const sx = Math.sin(betaRad / 2);
    const cy = Math.cos(gammaRad / 2);
    const sy = Math.sin(gammaRad / 2);
    const cz = Math.cos(alphaRad / 2);
    const sz = Math.sin(alphaRad / 2);
    
    // Calculate quaternion components
    return {
        x: sx * cy * cz - cx * sy * sz,
        y: cx * sy * cz + sx * cy * sz,
        z: cx * cy * sz - sx * sy * cz,
        w: cx * cy * cz + sx * sy * sz
    };
}

/**
 * Multiply two quaternions
 * @param {object} a - First quaternion {x, y, z, w}
 * @param {object} b - Second quaternion {x, y, z, w}
 * @returns {object} Result quaternion {x, y, z, w}
 */
function multiplyQuaternions(a, b) {
    return {
        x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
        y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
        z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
        w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
    };
}