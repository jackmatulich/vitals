// js/controller.js - Phone controller functionality

/**
 * Controller module - Handles the ultrasound probe controller functionality
 */
const Controller = {
    // DOM elements
    elements: {
        connectionIndicator: null,
        connectionText: null,
        accelData: null,
        gyroData: null,
        orientationData: null,
        freezeButton: null,
        calibrateButton: null,
        permissions: null,
        grantPermissionButton: null,
        visualFeedback: null,
        controllerArea: null
    },
    
    // State
    state: {
        sessionId: '',
        isFrozen: false,
        isCalibrating: false,
        isConnected: false,
        isPermissionGranted: false,
        calibrationBaseQuaternion: { x: 0, y: 0, z: 0, w: 1 },
        calibrationBasePosition: { x: 0, y: 0, z: 0 },
        lastPosition: { x: 0, y: 0, z: 0 },
        accelOffset: { x: 0, y: 0, z: 0 },
        gyroOffset: { x: 0, y: 0, z: 0 },
        sendInterval: null,
        lastSettings: null
    },
    
    /**
     * Initialize the controller with a session ID
     * @param {string} sessionId - Session ID to connect to
     */
    init(sessionId) {
        // Store session ID
        this.state.sessionId = sessionId;
        
        // Initialize DOM elements
        this.initElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Connect to simulator
        this.connect();
    },
    
    /**
     * Initialize DOM elements
     */
    initElements() {
        this.elements.connectionIndicator = document.getElementById('controllerConnectionIndicator');
        this.elements.connectionText = document.getElementById('controllerConnectionText');
        this.elements.accelData = document.getElementById('accelData');
        this.elements.gyroData = document.getElementById('gyroData');
        this.elements.orientationData = document.getElementById('orientationData');
        this.elements.freezeButton = document.getElementById('freezeButton');
        this.elements.calibrateButton = document.getElementById('calibrateButton');
        this.elements.permissions = document.getElementById('permissions');
        this.elements.grantPermissionButton = document.getElementById('grantPermissionButton');
        this.elements.visualFeedback = document.getElementById('visualFeedback');
        this.elements.controllerArea = document.getElementById('controllerArea');
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Freeze button
        this.elements.freezeButton.addEventListener('click', () => this.toggleFreeze());
        
        // Calibrate button
        this.elements.calibrateButton.addEventListener('click', () => this.calibrate());
        
        // Grant permission button
        this.elements.grantPermissionButton.addEventListener('click', () => this.requestSensorPermission());
    },
    
    /**
     * Connect to simulator
     */
    async connect() {
        this.elements.connectionText.textContent = 'Connecting...';
        
        try {
            // Send a test message
            const result = await DweetIO.send(this.state.sessionId, 'controller', {
                type: 'connect',
                timestamp: Date.now()
            });
            
            if (result && result.this === 'succeeded') {
                // Update connection status
                this.elements.connectionIndicator.classList.add('connected');
                this.elements.connectionText.textContent = 'Connected to Session: ' + this.state.sessionId;
                this.state.isConnected = true;
                
                // Show permissions panel if needed
                if (!this.state.isPermissionGranted) {
                    this.elements.permissions.classList.remove('hidden');
                } else {
                    // Start sending data if permission already granted
                    this.startSendingData();
                }
                
                // Start polling for settings
                this.startPollingSettings();
            } else {
                alert('Failed to connect to session');
                this.elements.connectionText.textContent = 'Connection failed';
            }
        } catch (error) {
            console.error('Error connecting to session:', error);
            this.elements.connectionText.textContent = 'Connection failed';
            alert('Error connecting to session: ' + error.message);
        }
    },
    
    /**
     * Start polling for settings from simulator
     */
    startPollingSettings() {
        // Poll for settings every second
        setInterval(async () => {
            if (!this.state.isConnected) return;
            
            try {
                const data = await DweetIO.getLatest(this.state.sessionId, 'simulator');
                
                if (data && data.type === 'settings') {
                    this.state.lastSettings = data.settings;
                }
            } catch (error) {
                console.error('Error polling settings:', error);
            }
        }, 1000);
    },
    
    /**
     * Request permission to access device sensors
     */
    async requestSensorPermission() {
        try {
            // For iOS 13+ devices
            if (typeof DeviceOrientationEvent !== 'undefined' && 
                typeof DeviceOrientationEvent.requestPermission === 'function') {
                const permissionState = await DeviceOrientationEvent.requestPermission();
                
                if (permissionState === 'granted') {
                    await this.initSensors();
                } else {
                    alert('Permission denied for motion sensors.');
                }
            } 
            // For iOS 12.2+ devices
            else if (typeof DeviceMotionEvent !== 'undefined' && 
                    typeof DeviceMotionEvent.requestPermission === 'function') {
                const permissionState = await DeviceMotionEvent.requestPermission();
                
                if (permissionState === 'granted') {
                    await this.initSensors();
                } else {
                    alert('Permission denied for motion sensors.');
                }
            } 
            // For Android and other devices that don't require explicit permission
            else {
                await this.initSensors();
            }
        } catch (error) {
            console.error('Error requesting sensor permission:', error);
            alert('Error requesting sensor permission: ' + error.message);
        }
    },
    
    /**
     * Initialize sensors after permission is granted
     */
    async initSensors() {
        this.elements.permissions.classList.add('hidden');
        this.state.isPermissionGranted = true;
        
        // Add event listeners for device sensors
        window.addEventListener('deviceorientation', (event) => this.handleOrientation(event));
        window.addEventListener('devicemotion', (event) => this.handleMotion(event));
        
        // Start sending data if already connected
        if (this.state.isConnected) {
            this.startSendingData();
        }
        
        // Calibrate initial position
        this.calibrate();
    },
    
    /**
     * Handle device orientation data
     * @param {DeviceOrientationEvent} event - Orientation event
     */
    handleOrientation(event) {
        if (this.state.isFrozen) return;
        
        // Some browsers use alpha, beta, gamma while others use absolute values
        const alpha = event.alpha || 0;  // Z-axis rotation [0, 360)
        const beta = event.beta || 0;    // X-axis rotation [-180, 180)
        const gamma = event.gamma || 0;  // Y-axis rotation [-90, 90)
        
        // Display orientation data
        this.elements.orientationData.textContent = `α: ${alpha.toFixed(1)}° β: ${beta.toFixed(1)}° γ: ${gamma.toFixed(1)}°`;
        
        // Convert Euler angles to quaternion
        const quaternion = eulerToQuaternion(alpha, beta, gamma);
        
        // Calibrate quaternion if necessary
        const calibratedQuaternion = this.calibrateQuaternion(quaternion);
        
        // Update global state with the calibrated quaternion
        this.state.lastPosition.quaternion = calibratedQuaternion;
    },
    
    /**
     * Handle device motion data
     * @param {DeviceMotionEvent} event - Motion event
     */
    handleMotion(event) {
        if (this.state.isFrozen) return;
        
        // Get acceleration with gravity
        const accel = event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
        
        // Get rotation rate
        const rotationRate = event.rotationRate || { alpha: 0, beta: 0, gamma: 0 };
        
        // Display acceleration data
        this.elements.accelData.textContent = `X: ${accel.x ? accel.x.toFixed(2) : 0} Y: ${accel.y ? accel.y.toFixed(2) : 0} Z: ${accel.z ? accel.z.toFixed(2) : 0}`;
        
        // Display gyroscope data
        this.elements.gyroData.textContent = `X: ${rotationRate.beta ? rotationRate.beta.toFixed(2) : 0} Y: ${rotationRate.gamma ? rotationRate.gamma.toFixed(2) : 0} Z: ${rotationRate.alpha ? rotationRate.alpha.toFixed(2) : 0}`;
        
        // Apply calibration offsets
        const calibratedAccel = {
            x: (accel.x || 0) - this.state.accelOffset.x,
            y: (accel.y || 0) - this.state.accelOffset.y,
            z: (accel.z || 0) - this.state.accelOffset.z
        };
        
        // Simplified position integration from acceleration
        // In a real application, you would use a more sophisticated approach
        // This is just a simple approximation for feedback purposes
        this.state.lastPosition.x += calibratedAccel.x * 0.0001;
        this.state.lastPosition.y += calibratedAccel.y * 0.0001;
        this.state.lastPosition.z += calibratedAccel.z * 0.0001;
        
        // Apply some damping to prevent drift
        this.state.lastPosition.x *= 0.98;
        this.state.lastPosition.y *= 0.98;
        this.state.lastPosition.z *= 0.98;
        
        // Create visual feedback
        this.createVisualFeedback(event);
    },
    
    /**
     * Start sending sensor data to the simulator
     */
    startSendingData() {
        // Clear any existing interval
        if (this.state.sendInterval) {
            clearInterval(this.state.sendInterval);
        }
        
        // Set up interval to send data (30 times per second)
        this.state.sendInterval = setInterval(() => {
            if (!this.state.isFrozen && this.state.isConnected && this.state.isPermissionGranted) {
                // Prepare data to send
                const data = {
                    type: 'imu-data',
                    position: {
                        x: this.state.lastPosition.x,
                        y: this.state.lastPosition.y,
                        z: this.state.lastPosition.z
                    },
                    quaternion: this.state.lastPosition.quaternion || { x: 0, y: 0, z: 0, w: 1 },
                    timestamp: Date.now()
                };
                
                // Send IMU data
                DweetIO.send(this.state.sessionId, 'controller', data);
            }
        }, 33); // ~30fps
    },
    
    /**
     * Calibrate sensors
     */
    calibrate() {
        this.state.isCalibrating = true;
        this.elements.freezeButton.disabled = true;
        
        // Update UI
        this.elements.connectionText.textContent = 'Calibrating...';
        
        // Collect calibration samples over 2 seconds
        const samples = [];
        const samplingInterval = setInterval(() => {
            if (this.state.lastPosition.quaternion) {
                samples.push({
                    position: { ...this.state.lastPosition },
                    quaternion: { ...this.state.lastPosition.quaternion }
                });
            }
        }, 100);
        
        // After 2 seconds, compute the calibration values
        setTimeout(() => {
            clearInterval(samplingInterval);
            
            if (samples.length > 0) {
                // Average the samples
                const avgPosition = { x: 0, y: 0, z: 0 };
                const avgQuaternion = { x: 0, y: 0, z: 0, w: 0 };
                
                samples.forEach(sample => {
                    avgPosition.x += sample.position.x / samples.length;
                    avgPosition.y += sample.position.y / samples.length;
                    avgPosition.z += sample.position.z / samples.length;
                    
                    avgQuaternion.x += sample.quaternion.x / samples.length;
                    avgQuaternion.y += sample.quaternion.y / samples.length;
                    avgQuaternion.z += sample.quaternion.z / samples.length;
                    avgQuaternion.w += sample.quaternion.w / samples.length;
                });
                
                // Normalize the quaternion
                const magnitude = Math.sqrt(
                    avgQuaternion.x * avgQuaternion.x +
                    avgQuaternion.y * avgQuaternion.y +
                    avgQuaternion.z * avgQuaternion.z +
                    avgQuaternion.w * avgQuaternion.w
                );
                
                if (magnitude > 0) {
                    avgQuaternion.x /= magnitude;
                    avgQuaternion.y /= magnitude;
                    avgQuaternion.z /= magnitude;
                    avgQuaternion.w /= magnitude;
                }
                
                // Set calibration values
                this.state.calibrationBasePosition = { ...avgPosition };
                this.state.calibrationBaseQuaternion = { ...avgQuaternion };
                
                // Reset current position
                this.state.lastPosition = { x: 0, y: 0, z: 0 };
                
                // Show success message
                this.elements.connectionText.textContent = this.state.isConnected ? 
                    'Connected to Session: ' + this.state.sessionId : 'Disconnected';
                
                // Create a success visual feedback
                this.createCalibrationFeedback();
            } else {
                this.elements.connectionText.textContent = 'Calibration failed, no samples collected';
            }
            
            // Reset state
            this.state.isCalibrating = false;
            this.elements.freezeButton.disabled = false;
        }, 2000);
    },
    
    /**
     * Calibrate quaternion based on the base calibration
     * @param {Object} q - Quaternion to calibrate
     * @returns {Object} Calibrated quaternion
     */
    calibrateQuaternion(q) {
        // Inverse of calibration quaternion
        const invCal = {
            x: -this.state.calibrationBaseQuaternion.x,
            y: -this.state.calibrationBaseQuaternion.y,
            z: -this.state.calibrationBaseQuaternion.z,
            w: this.state.calibrationBaseQuaternion.w
        };
        
        // Multiply current quaternion by inverse calibration quaternion
        return multiplyQuaternions(q, invCal);
    },
    
    /**
     * Toggle freeze mode
     */
    toggleFreeze() {
        this.state.isFrozen = !this.state.isFrozen;
        this.elements.freezeButton.textContent = this.state.isFrozen ? 'Unfreeze' : 'Freeze';
        this.elements.freezeButton.classList.toggle('freeze-active', this.state.isFrozen);
    },
    
    /**
     * Create visual feedback based on acceleration
     * @param {DeviceMotionEvent} event - Motion event
     */
    createVisualFeedback(event) {
        // Clear previous dots
        while (this.elements.visualFeedback.firstChild) {
            this.elements.visualFeedback.removeChild(this.elements.visualFeedback.firstChild);
        }
        
        // Get acceleration
        const accel = event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
        if (!accel.x && !accel.y && !accel.z) return;
        
        // Scale acceleration to screen coordinates
        // This is a simplified visualization
        const screenX = this.elements.controllerArea.offsetWidth / 2 + (accel.x || 0) * 5;
        const screenY = this.elements.controllerArea.offsetHeight / 2 + (accel.y || 0) * 5;
        
        // Create a dot to represent the acceleration vector
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = `${screenX}px`;
        dot.style.top = `${screenY}px`;
        
        // Scale dot size based on acceleration magnitude
        const magnitude = Math.sqrt(
            Math.pow(accel.x || 0, 2) + 
            Math.pow(accel.y || 0, 2) + 
            Math.pow(accel.z || 0, 2)
        );
        const size = Math.min(40, Math.max(10, magnitude * 2));
        dot.style.width = `${size}px`;
        dot.style.height = `${size}px`;
        
        this.elements.visualFeedback.appendChild(dot);
    },
    
    /**
     * Create visual feedback for successful calibration
     */
    createCalibrationFeedback() {
        // Clear previous feedback
        while (this.elements.visualFeedback.firstChild) {
            this.elements.visualFeedback.removeChild(this.elements.visualFeedback.firstChild);
        }
        
        // Create ripple effect
        for (let i = 0; i < 3; i++) {
            const ripple = document.createElement('div');
            ripple.className = 'dot';
            ripple.style.left = '50%';
            ripple.style.top = '50%';
            ripple.style.width = '20px';
            ripple.style.height = '20px';
            ripple.style.opacity = '0.8';
            ripple.style.transition = 'all 1s ease-out';
            ripple.style.transitionDelay = `${i * 0.2}s`;
            
            this.elements.visualFeedback.appendChild(ripple);
            
            // Animate ripple
            setTimeout(() => {
                ripple.style.width = '200px';
                ripple.style.height = '200px';
                ripple.style.opacity = '0';
            }, 10);
            
            // Remove ripple after animation
            setTimeout(() => {
                if (ripple.parentNode === this.elements.visualFeedback) {
                    this.elements.visualFeedback.removeChild(ripple);
                }
            }, 1500);
        }
    },
    
    /**
     * Clean up controller resources
     */
    cleanup() {
        // Stop sending data
        if (this.state.sendInterval) {
            clearInterval(this.state.sendInterval);
            this.state.sendInterval = null;
        }
        
        // Send disconnect message
        if (this.state.isConnected && this.state.sessionId) {
            DweetIO.send(this.state.sessionId, 'controller', {
                type: 'disconnect',
                timestamp: Date.now()
            });
        }
        
        // Remove event listeners
        window.removeEventListener('deviceorientation', this.handleOrientation);
        window.removeEventListener('devicemotion', this.handleMotion);
        
        // Reset state
        this.state.isConnected = false;
        this.state.isFrozen = false;
        this.state.isCalibrating = false;
    }
};