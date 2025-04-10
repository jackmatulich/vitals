// js/controller.js - Instant permission request on page load

/**
 * Controller module for ultrasound simulator
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
        controllerArea: null,
        returnToModeSelection: null
    },
    
    // State
    state: {
        sessionId: '',
        isFrozen: false,
        isConnected: false,
        isPermissionGranted: false,
        lastPosition: { x: 0, y: 0, z: 0 },
        sendInterval: null,
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
        
        // Immediately try to access sensors
        this.triggerPermissionPrompt();
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
        this.elements.returnToModeSelection = document.getElementById('returnToModeSelection');
        
        // Create a placeholder div for manual triggering
        this.elements.manualTrigger = document.createElement('button');
        this.elements.manualTrigger.textContent = "Tap Here to Enable Sensors";
        this.elements.manualTrigger.style.position = "fixed";
        this.elements.manualTrigger.style.top = "50%";
        this.elements.manualTrigger.style.left = "50%";
        this.elements.manualTrigger.style.transform = "translate(-50%, -50%)";
        this.elements.manualTrigger.style.padding = "20px";
        this.elements.manualTrigger.style.fontSize = "18px";
        this.elements.manualTrigger.style.backgroundColor = "#3498db";
        this.elements.manualTrigger.style.color = "white";
        this.elements.manualTrigger.style.border = "none";
        this.elements.manualTrigger.style.borderRadius = "8px";
        this.elements.manualTrigger.style.zIndex = "1000";
        this.elements.manualTrigger.style.display = "none";
        document.body.appendChild(this.elements.manualTrigger);
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
            self.requestPermissions();
        });
        
        // Manual trigger button
        this.elements.manualTrigger.addEventListener('click', function() {
            self.requestPermissions();
            self.elements.manualTrigger.style.display = "none";
        });
        
        // Return to mode selection
        if (this.elements.returnToModeSelection) {
            this.elements.returnToModeSelection.addEventListener('click', function() {
                if (typeof showScreen === 'function') {
                    showScreen('modeSelection');
                } else {
                    window.location.href = window.location.pathname;
                }
            });
        }
        
        // Hide permission panel initially
        this.elements.permissions.classList.add('hidden');
    },
    
    /**
     * Immediately trigger permission prompt on iOS or init sensors on Android
     */
    triggerPermissionPrompt() {
        const self = this;
        
        // For iOS - we need to wait for a user interaction
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            console.log("iOS detected - showing manual trigger button");
            // Show the manual trigger button
            this.elements.manualTrigger.style.display = "block";
            
            // Also can try to auto-trigger in response to any touch
            const autoTriggerHandler = function() {
                self.requestPermissions();
                document.removeEventListener('touchstart', autoTriggerHandler);
            };
            
            document.addEventListener('touchstart', autoTriggerHandler);
        } else {
            // For Android/other - can initialize immediately
            console.log("Non-iOS device - initializing sensors directly");
            this.requestPermissions();
        }
    },
    
    /**
     * Request permissions and initialize sensors
     */
    async requestPermissions() {
        console.log("Requesting sensor permissions...");
        const self = this;
        
        try {
            // For iOS Safari
            if (typeof DeviceOrientationEvent !== 'undefined' && 
                typeof DeviceOrientationEvent.requestPermission === 'function') {
                
                try {
                    const permissionState = await DeviceOrientationEvent.requestPermission();
                    console.log("Permission result:", permissionState);
                    
                    if (permissionState === 'granted') {
                        this.initSensors();
                    } else {
                        this.showError("Permission denied. Please allow motion sensors access.");
                    }
                } catch (err) {
                    console.error("Error requesting permission:", err);
                    this.showError("Error requesting sensors: " + err.message);
                }
            } else {
                // For other browsers (Android, etc.)
                this.initSensors();
            }
        } catch (error) {
            console.error("Error in requestPermissions:", error);
            this.showError("Sensor access error: " + error.message);
        }
    },
    
    /**
     * Initialize sensors after permission granted
     */
    initSensors() {
        console.log("Initializing sensors");
        const self = this;
        
        // Hide permissions panel if it's visible
        this.elements.permissions.classList.add('hidden');
        
        // Hide the manual trigger
        this.elements.manualTrigger.style.display = "none";
        
        // Create event handlers
        this.state.orientationHandler = function(event) {
            self.handleOrientation(event);
        };
        
        this.state.motionHandler = function(event) {
            self.handleMotion(event);
        };
        
        // Add event listeners
        window.addEventListener('deviceorientation', this.state.orientationHandler);
        window.addEventListener('devicemotion', this.state.motionHandler);
        
        // Set permission granted flag
        this.state.isPermissionGranted = true;
        
        // Start sending data if connected
        if (this.state.isConnected) {
            this.startSendingData();
        }
        
        // Check if we're actually getting data
        setTimeout(() => {
            if (!this.state.lastPosition.quaternion) {
                console.warn("No orientation data received after 2 seconds");
                this.showError("No sensor data received. Your device may not support motion sensors.");
            } else {
                console.log("Successfully receiving sensor data!");
                this.showSuccess("Sensors active! Move your device to control.");
            }
        }, 2000);
        
        // Do an initial calibration
        this.calibrate();
    },
    
    /**
     * Show an error message
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = message;
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '10px';
        errorDiv.style.left = '10px';
        errorDiv.style.right = '10px';
        errorDiv.style.padding = '15px';
        errorDiv.style.backgroundColor = 'rgba(231, 76, 60, 0.9)';
        errorDiv.style.color = 'white';
        errorDiv.style.borderRadius = '8px';
        errorDiv.style.zIndex = 1000;
        errorDiv.style.textAlign = 'center';
        
        document.body.appendChild(errorDiv);
        
        // Remove after 4 seconds
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 4000);
        
        // Also show the permission panel as a fallback
        this.elements.permissions.classList.remove('hidden');
    },
    
    /**
     * Show a success message
     */
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.textContent = message;
        successDiv.style.position = 'fixed';
        successDiv.style.top = '10px';
        successDiv.style.left = '10px';
        successDiv.style.right = '10px';
        successDiv.style.padding = '15px';
        successDiv.style.backgroundColor = 'rgba(46, 204, 113, 0.9)';
        successDiv.style.color = 'white';
        successDiv.style.borderRadius = '8px';
        successDiv.style.zIndex = 1000;
        successDiv.style.textAlign = 'center';
        
        document.body.appendChild(successDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 3000);
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
                
                // If permissions already granted, start sending data
                if (this.state.isPermissionGranted) {
                    this.startSendingData();
                }
            } else {
                this.elements.connectionText.textContent = 'Connection failed';
                this.showError("Failed to connect to session");
            }
        } catch (error) {
            console.error('Error connecting to session:', error);
            this.elements.connectionText.textContent = 'Connection failed';
            this.showError("Connection error: " + error.message);
        }
    },
    
    /**
     * Handle device orientation data
     * @param {DeviceOrientationEvent} event - Orientation event
     */
    handleOrientation(event) {
        if (this.state.isFrozen) return;
        
        // Get orientation angles
        const alpha = event.alpha || 0;  // Z-axis rotation [0, 360)
        const beta = event.beta || 0;    // X-axis rotation [-180, 180)
        const gamma = event.gamma || 0;  // Y-axis rotation [-90, 90)
        
        // Display orientation data
        this.elements.orientationData.textContent = `α: ${alpha.toFixed(1)}° β: ${beta.toFixed(1)}° γ: ${gamma.toFixed(1)}°`;
        
        // Map orientation to position
        const x = gamma / 90;  // -1 to 1
        const y = beta / 180;  // -1 to 1
        const z = alpha / 360; // 0 to 1
        
        this.state.lastPosition = { x, y, z };
        
        // Convert Euler angles to quaternion
        const rad = Math.PI / 180;
        const c1 = Math.cos(alpha * rad / 2);
        const s1 = Math.sin(alpha * rad / 2);
        const c2 = Math.cos(beta * rad / 2);
        const s2 = Math.sin(beta * rad / 2);
        const c3 = Math.cos(gamma * rad / 2);
        const s3 = Math.sin(gamma * rad / 2);
        
        this.state.lastPosition.quaternion = {
            x: s1 * c2 * c3 - c1 * s2 * s3,
            y: c1 * s2 * c3 + s1 * c2 * s3,
            z: c1 * c2 * s3 - s1 * s2 * c3,
            w: c1 * c2 * c3 + s1 * s2 * s3
        };
        
        // Create visual feedback
        this.createVisualFeedback();
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
        
        // Set up interval to send data (10 times per second)
        this.state.sendInterval = setInterval(function() {
            if (!self.state.isFrozen && self.state.isConnected && self.state.isPermissionGranted) {
                // Only send if we have valid quaternion data
                if (self.state.lastPosition.quaternion) {
                    // Prepare data to send
                    const data = {
                        type: 'imu-data',
                        position: self.state.lastPosition,
                        quaternion: self.state.lastPosition.quaternion,
                        timestamp: Date.now()
                    };
                    
                    // Send IMU data
                    DweetIO.send(self.state.sessionId, 'controller', data)
                        .catch(function(error) {
                            console.error('Error sending data:', error);
                        });
                }
            }
        }, 100);
    },
    
    /**
     * Create visual feedback
     */
    createVisualFeedback() {
        // Don't create visual feedback if frozen
        if (this.state.isFrozen) return;
        
        // Clear previous dots
        while (this.elements.visualFeedback.firstChild) {
            this.elements.visualFeedback.removeChild(this.elements.visualFeedback.firstChild);
        }
        
        // Create a dot based on the position
        const dot = document.createElement('div');
        dot.className = 'dot';
        
        // Calculate position in the visual area
        const centerX = this.elements.controllerArea.clientWidth / 2;
        const centerY = this.elements.controllerArea.clientHeight / 2;
        
        // Maps from -1...1 position to the controller area
        const x = centerX + this.state.lastPosition.x * centerX;
        const y = centerY + this.state.lastPosition.y * centerY;
        
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
        
        // Add dot to the visual feedback area
        this.elements.visualFeedback.appendChild(dot);
    },
    
    /**
     * Calibrate the controller position
     */
    calibrate() {
        // Reset position to center
        this.state.lastPosition = { x: 0, y: 0, z: 0 };
        this.showSuccess("Position calibrated");
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
     * Clean up controller resources
     */
    cleanup() {
        // Stop sending data
        if (this.state.sendInterval) {
            clearInterval(this.state.sendInterval);
            this.state.sendInterval = null;
        }
        
        // Remove event listeners
        if (this.state.orientationHandler) {
            window.removeEventListener('deviceorientation', this.state.orientationHandler);
        }
        if (this.state.motionHandler) {
            window.removeEventListener('devicemotion', this.state.motionHandler);
        }
        
        // Remove manual trigger if it exists
        if (this.elements.manualTrigger && this.elements.manualTrigger.parentNode) {
            this.elements.manualTrigger.parentNode.removeChild(this.elements.manualTrigger);
        }
        
        // Reset state
        this.state.isConnected = false;
        this.state.isFrozen = false;
    }
};