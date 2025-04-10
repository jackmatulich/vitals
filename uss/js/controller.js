// js/controller.js - Simple one-button approach

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
        visualFeedback: null,
        controllerArea: null,
        returnToModeSelection: null,
        permissionOverlay: null,
        permissionButton: null
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
        
        // Create the permission overlay and button
        this.createPermissionOverlay();
        
        // Hide built-in permissions panel
        if (this.elements.permissions) {
            this.elements.permissions.classList.add('hidden');
        }
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Connect to simulator
        this.connect();
        
        // Try auto-init for Android devices
        this.tryAutoInitForAndroid();
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
        this.elements.visualFeedback = document.getElementById('visualFeedback');
        this.elements.controllerArea = document.getElementById('controllerArea');
        this.elements.returnToModeSelection = document.getElementById('returnToModeSelection');
    },
    
    /**
     * Create permission overlay with a single button
     */
    createPermissionOverlay() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';
        overlay.style.padding = '20px';
        overlay.style.textAlign = 'center';
        
        // Create message
        const message = document.createElement('div');
        message.style.color = 'white';
        message.style.fontSize = '18px';
        message.style.marginBottom = '30px';
        message.style.maxWidth = '500px';
        
        // Different message for iOS vs Android
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            message.innerHTML = 'To use this controller, you need to enable motion sensors.<br><br>Tap the button below:';
        } else {
            message.innerHTML = 'Touch the button below to activate the controller:';
        }
        
        // Create button
        const button = document.createElement('button');
        button.textContent = 'Enable Motion Sensors';
        button.style.backgroundColor = '#3498db';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '20px 40px';
        button.style.fontSize = '20px';
        button.style.fontWeight = 'bold';
        button.style.borderRadius = '8px';
        button.style.cursor = 'pointer';
        button.style.transition = 'background-color 0.3s';
        
        // Button hover effect
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#2980b9';
        });
        
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#3498db';
        });
        
        // Add elements to overlay
        overlay.appendChild(message);
        overlay.appendChild(button);
        
        // Add overlay to body
        document.body.appendChild(overlay);
        
        // Store references
        this.elements.permissionOverlay = overlay;
        this.elements.permissionButton = button;
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        const self = this;
        
        // Permission button - this is the critical handler for iOS!
        this.elements.permissionButton.addEventListener('click', function() {
            self.requestSensorPermission();
        });
        
        // Freeze button
        this.elements.freezeButton.addEventListener('click', function() {
            self.toggleFreeze();
        });
        
        // Calibrate button
        this.elements.calibrateButton.addEventListener('click', function() {
            self.calibrate();
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
    },
    
    /**
     * Try to auto-initialize for Android devices
     */
    tryAutoInitForAndroid() {
        // If not iOS, we can try to auto-initialize
        if (!/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            // For Android, permissions are implied
            console.log("Android device detected - trying auto-initialization");
            
            // Create test handlers
            let hasOrientation = false;
            let hasMotion = false;
            
            const testOrientationHandler = () => {
                hasOrientation = true;
                window.removeEventListener('deviceorientation', testOrientationHandler);
            };
            
            const testMotionHandler = () => {
                hasMotion = true;
                window.removeEventListener('devicemotion', testMotionHandler);
            };
            
            // Add test listeners
            window.addEventListener('deviceorientation', testOrientationHandler);
            window.addEventListener('devicemotion', testMotionHandler);
            
            // Check after a short delay if we got any events
            setTimeout(() => {
                if (hasOrientation || hasMotion) {
                    console.log("Auto-detected sensor events, initializing");
                    this.initSensors();
                } else {
                    console.log("No auto-detected sensor events, keeping overlay");
                }
            }, 1000);
        }
    },
    
    /**
     * Request permission for device sensors
     */
    async requestSensorPermission() {
        console.log("User clicked permission button");
        const self = this;
        
        try {
            // For iOS devices
            if (typeof DeviceOrientationEvent !== 'undefined' && 
                typeof DeviceOrientationEvent.requestPermission === 'function') {
                
                console.log("iOS detected, requesting DeviceOrientationEvent permission");
                const permissionState = await DeviceOrientationEvent.requestPermission();
                
                console.log("Permission response:", permissionState);
                if (permissionState === 'granted') {
                    // Permission granted, initialize sensors
                    this.initSensors();
                } else {
                    // Permission denied
                    alert("Permission denied. Please allow motion sensor access to use the controller.");
                }
            } else {
                // For Android/other devices - no permission needed
                console.log("Non-iOS device or permission already granted");
                this.initSensors();
            }
        } catch (error) {
            console.error("Error requesting permission:", error);
            alert("Error accessing motion sensors: " + error.message);
        }
    },
    
    /**
     * Initialize sensors after permission granted
     */
    initSensors() {
        console.log("Initializing sensors");
        const self = this;
        
        // Remove the permission overlay
        if (this.elements.permissionOverlay) {
            document.body.removeChild(this.elements.permissionOverlay);
        }
        
        // Update state
        this.state.isPermissionGranted = true;
        
        // Set up orientation handler
        this.state.orientationHandler = function(event) {
            self.handleOrientation(event);
        };
        
        // Set up motion handler
        this.state.motionHandler = function(event) {
            self.handleMotion(event);
        };
        
        // Add event listeners
        window.addEventListener('deviceorientation', this.state.orientationHandler);
        window.addEventListener('devicemotion', this.state.motionHandler);
        
        // Start sending data if already connected
        if (this.state.isConnected) {
            this.startSendingData();
        }
        
        // Success message
        console.log("Sensors initialized successfully");
        this.showMessage("Sensors active! Move your device to control.", "success");
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
                
                // Start sending data if permission already granted
                if (this.state.isPermissionGranted) {
                    this.startSendingData();
                }
            } else {
                this.elements.connectionText.textContent = 'Connection failed';
                this.showMessage("Failed to connect to session", "error");
            }
        } catch (error) {
            console.error('Error connecting to session:', error);
            this.elements.connectionText.textContent = 'Connection failed';
            this.showMessage("Connection error: " + error.message, "error");
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
        
        // Update display
        this.elements.orientationData.textContent = `α: ${alpha.toFixed(1)}° β: ${beta.toFixed(1)}° γ: ${gamma.toFixed(1)}°`;
        
        // Map orientation to position (simple mapping)
        const x = gamma / 90;  // -1 to 1 based on gamma (-90° to 90°)
        const y = beta / 180;  // -1 to 1 based on beta (-180° to 180°)
        const z = 0;  // We're not using z for now
        
        this.state.lastPosition = { x, y, z };
        
        // Create a quaternion from Euler angles
        const rad = Math.PI / 180;
        const cy = Math.cos(alpha * rad / 2);
        const sy = Math.sin(alpha * rad / 2);
        const cp = Math.cos(beta * rad / 2);
        const sp = Math.sin(beta * rad / 2);
        const cr = Math.cos(gamma * rad / 2);
        const sr = Math.sin(gamma * rad / 2);
        
        this.state.lastPosition.quaternion = {
            x: sr * cp * cy - cr * sp * sy,
            y: cr * sp * cy + sr * cp * sy,
            z: cr * cp * sy - sr * sp * cy,
            w: cr * cp * cy + sr * sp * sy
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
        
        // Update display
        this.elements.accelData.textContent = `X: ${accel.x ? accel.x.toFixed(2) : 0} Y: ${accel.y ? accel.y.toFixed(2) : 0} Z: ${accel.z ? accel.z.toFixed(2) : 0}`;
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
        
        // Set up interval to send data
        this.state.sendInterval = setInterval(function() {
            if (!self.state.isFrozen && self.state.isConnected && self.state.isPermissionGranted) {
                // Prepare data to send
                const data = {
                    type: 'imu-data',
                    position: self.state.lastPosition,
                    quaternion: self.state.lastPosition.quaternion || { x: 0, y: 0, z: 0, w: 1 },
                    timestamp: Date.now()
                };
                
                // Send IMU data
                DweetIO.send(self.state.sessionId, 'controller', data)
                    .catch(function(error) {
                        console.error('Error sending data:', error);
                    });
            }
        }, 100); // 10 times per second
    },
    
    /**
     * Create visual feedback based on device orientation
     */
    createVisualFeedback() {
        // Don't create visual feedback if frozen
        if (this.state.isFrozen) return;
        
        // Clear previous dots
        while (this.elements.visualFeedback.firstChild) {
            this.elements.visualFeedback.removeChild(this.elements.visualFeedback.firstChild);
        }
        
        // Create a dot at the position corresponding to the orientation
        const dot = document.createElement('div');
        dot.className = 'dot';
        
        // Calculate position in the visual area
        const centerX = this.elements.controllerArea.clientWidth / 2;
        const centerY = this.elements.controllerArea.clientHeight / 2;
        
        // Map the position from -1...1 to the visual area
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
        const currentQuaternion = this.state.lastPosition.quaternion;
        this.state.lastPosition = { 
            x: 0, 
            y: 0, 
            z: 0,
            quaternion: currentQuaternion
        };
        
        this.showMessage("Position calibrated", "success");
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
     * Show a message to the user
     * @param {string} message - Message to show
     * @param {string} type - 'success' or 'error'
     */
    showMessage(message, type = 'info') {
        const colors = {
            success: 'rgba(46, 204, 113, 0.9)',
            error: 'rgba(231, 76, 60, 0.9)',
            info: 'rgba(52, 152, 219, 0.9)'
        };
        
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '10px';
        messageDiv.style.left = '10px';
        messageDiv.style.right = '10px';
        messageDiv.style.padding = '15px';
        messageDiv.style.backgroundColor = colors[type];
        messageDiv.style.color = 'white';
        messageDiv.style.borderRadius = '8px';
        messageDiv.style.zIndex = 1000;
        messageDiv.style.textAlign = 'center';
        
        document.body.appendChild(messageDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 3000);
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
        
        // Reset state
        this.state.isConnected = false;
        this.state.isFrozen = false;
    }
};