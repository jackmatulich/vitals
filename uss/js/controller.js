// js/controller.js - Phone controller functionality (compatible with Eruda)

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
        lastSettings: null,
        orientationHandler: null,
        motionHandler: null
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
        const self = this;
        
        // Freeze button
        this.elements.freezeButton.addEventListener('click', function() {
            self.toggleFreeze();
        });
        
        // Calibrate button
        this.elements.calibrateButton.addEventListener('click', function() {
            self.calibrate();
        });
        
        // Grant permission button
        this.elements.grantPermissionButton.addEventListener('click', function() {
            self.requestSensorPermission();
        });
        
        // Initialize permission prompt
        this.elements.permissions.classList.remove('hidden');
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
        const self = this;
        
        // Poll for settings every second
        setInterval(async function() {
            if (!self.state.isConnected) return;
            
            try {
                const data = await DweetIO.getLatest(self.state.sessionId, 'simulator');
                
                if (data && data.type === 'settings') {
                    self.state.lastSettings = data.settings;
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
        const self = this;
        console.log('Requesting sensor permissions...');
        
        try {
            // For iOS Safari
            let needsPermission = false;
            let permissionGranted = false;
            
            // Request permissions for iOS (DeviceOrientationEvent)
            if (typeof DeviceOrientationEvent !== 'undefined' && 
                typeof DeviceOrientationEvent.requestPermission === 'function') {
                
                needsPermission = true;
                try {
                    const response = await DeviceOrientationEvent.requestPermission();
                    if (response === 'granted') {
                        permissionGranted = true;
                    } else {
                        alert('Permission to access device orientation was denied');
                        return;
                    }
                } catch (err) {
                    console.error('Error requesting orientation permission:', err);
                    alert('Error requesting device orientation permission');
                    return;
                }
            }
            
            // Request permissions for iOS (DeviceMotionEvent)
            if (typeof DeviceMotionEvent !== 'undefined' && 
                typeof DeviceMotionEvent.requestPermission === 'function') {
                
                needsPermission = true;
                try {
                    const response = await DeviceMotionEvent.requestPermission();
                    if (response === 'granted') {
                        permissionGranted = true;
                    } else {
                        alert('Permission to access device motion was denied');
                        return;
                    }
                } catch (err) {
                    console.error('Error requesting motion permission:', err);
                    alert('Error requesting device motion permission');
                    return;
                }
            }
            
            // Android or desktop browsers (or permission granted on iOS)
            if (!needsPermission || permissionGranted) {
                this.elements.permissions.classList.add('hidden');
                this.state.isPermissionGranted = true;
                
                // Create event handlers with proper binding
                this.state.orientationHandler = function(event) {
                    self.handleOrientation(event);
                };
                
                this.state.motionHandler = function(event) {
                    self.handleMotion(event);
                };
                
                // Add event listeners
                window.addEventListener('deviceorientation', this.state.orientationHandler);
                window.addEventListener('devicemotion', this.state.motionHandler);
                
                // Start sending data
                if (this.state.isConnected) {
                    this.startSendingData();
                }
                
                // Calibrate initial position
                this.calibrate();
            }
        } catch (error) {
            console.error('Error in requestSensorPermission:', error);
            alert('Error accessing device sensors: ' + error.message);
        }
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
        const self = this;
        
        // Clear any existing interval
        if (this.state.sendInterval) {
            clearInterval(this.state.sendInterval);
        }
        
        // Set up interval to send data (30 times per second)
        this.state.sendInterval = setInterval(function() {
            if (!self.state.isFrozen && self.state.isConnected && self.state.isPermissionGranted) {
                // Prepare data to send
                const data = {
                    type: 'imu-data',
                    position: {
                        x: self.state.lastPosition.x,
                        y: self.state.lastPosition.y,
                        z: self.state.lastPosition.z
                    },
                    quaternion: self.state.lastPosition.quaternion || { x: 0, y: 0, z: 0, w: 1 },
                    timestamp: Date.now()
                };
                
                // Send IMU data
                DweetIO.send(self.state.sessionId, 'controller', data);
            }
        }, 33); // ~30fps
    },
    
    /**
     * Calibrate sensors
     */
    calibrate() {
        const self = this;
        this.state.isCalibrating = true;
        this.elements.freezeButton.disabled = true;
        
        // Update UI
        this.elements.connectionText.textContent = 'Calibrating...';
        
        // Collect calibration samples over 2 seconds
        const samples = [];
        const samplingInterval = setInterval(function() {
            if (self.state.lastPosition.quaternion) {
                samples.push({
                    position: { ...self.state.lastPosition },
                    quaternion: { ...self.state.lastPosition.quaternion }
                });
            }
        }, 100);
        
        // After 2 seconds, compute the calibration values
        setTimeout(function() {
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
                self.state.calibrationBasePosition = { ...avgPosition };
                self.state.calibrationBaseQuaternion = { ...avgQuaternion };
                
                // Reset current position
                self.state.lastPosition = { x: 0, y: 0, z: 0 };
                
                // Show success message
                self.elements.connectionText.textContent = self.state.isConnected ? 
                    'Connected to Session: ' + self.state.sessionId : 'Disconnected';
                
                // Create a success visual feedback
                self.createCalibrationFeedback();
            } else {
                self.elements.connectionText.textContent = 'Calibration failed, no samples collected';
            }
            
            // Reset state
            self.state.isCalibrating = false;
            self.elements.freezeButton.disabled = false;
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
        if (this.state.orientationHandler) {
            window.removeEventListener('deviceorientation', this.state.orientationHandler);
        }
        if (this.state.motionHandler) {
            window.removeEventListener('devicemotion', this.state.motionHandler);
        }
        
        // Reset state
        this.state.isConnected = false;
        this.state.isFrozen = false;
        this.state.isCalibrating = false;
    }
};