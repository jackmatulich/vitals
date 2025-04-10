// js/controller.js - Fixed implementation

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
        sendInterval: null
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
        this.elements.returnToModeSelection = document.getElementById('returnToModeSelection');
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Store reference to this
        const self = this;
        
        // Freeze button
        if (this.elements.freezeButton) {
            this.elements.freezeButton.addEventListener('click', function() {
                self.toggleFreeze();
            });
        }
        
        // Calibrate button
        if (this.elements.calibrateButton) {
            this.elements.calibrateButton.addEventListener('click', function() {
                self.calibrate();
            });
        }
        
        // Permission button - CRITICAL FOR IOS
        if (this.elements.grantPermissionButton) {
            this.elements.grantPermissionButton.addEventListener('click', function(event) {
                event.preventDefault(); // Prevent any default button behavior
                console.log("Permission button clicked"); // Log for debugging
                self.requestPermissions(); // Call permission request function
            });
        }
        
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
        
        // Check if we're on Android and try auto-init
        if (!this.isIOS() && this.elements.permissions) {
            // For Android, we can try auto-initializing
            this.tryAutoInit();
        }
    },
    
    /**
     * Check if running on iOS
     * @returns {boolean} true if iOS
     */
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    },
    
    /**
     * Try auto-initializing for Android devices
     */
    tryAutoInit() {
        console.log("Trying auto-init for Android");
        
        // For Android, permissions are implied
        const testOrientation = function() {
            window.removeEventListener('deviceorientation', testOrientation);
            console.log("Device orientation available - initializing");
            this.initSensors();
        }.bind(this);
        
        // Listen for a test event
        window.addEventListener('deviceorientation', testOrientation, { once: true });
        
        // Check after a moment if anything happened
        setTimeout(() => {
            // If we haven't initialized yet, fall back to manual
            if (!this.state.isPermissionGranted) {
                console.log("No auto orientation events - keep permission panel visible");
            }
        }, 1000);
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
     * Request permission for sensors - MAIN ENTRY POINT
     */
    requestPermissions() {
        console.log("Requesting permissions...");
        
        // Handle iOS permissions
        if (this.isIOS()) {
            this.requestIOSPermissions();
        } else {
            // For Android, permissions are implied
            this.initSensors();
        }
    },
    
    /**
     * Request iOS permissions specifically
     */
    async requestIOSPermissions() {
        console.log("Requesting iOS permissions");
        
        try {
            // Request orientation permission
            if (typeof DeviceOrientationEvent !== 'undefined' && 
                typeof DeviceOrientationEvent.requestPermission === 'function') {
                
                console.log("Requesting DeviceOrientationEvent permission");
                const permission = await DeviceOrientationEvent.requestPermission();
                console.log("Permission result:", permission);
                
                if (permission === 'granted') {
                    // Initialize sensors
                    this.initSensors();
                } else {
                    alert('Permission denied. Please allow motion sensors to use the controller.');
                }
            } else {
                console.log("DeviceOrientationEvent.requestPermission not available");
                this.initSensors();
            }
        } catch (error) {
            console.error("Error requesting iOS permissions:", error);
            alert("Error accessing motion sensors: " + error.message);
        }
    },
    
    /**
     * Initialize sensors after permission granted
     */
    initSensors() {
        console.log("Initializing sensors");
        const self = this;
        
        // Hide permissions panel
        if (this.elements.permissions) {
            this.elements.permissions.classList.add('hidden');
        }
        
        // Set permission granted flag
        this.state.isPermissionGranted = true;
        
        // Set up orientation handler
        const orientationHandler = function(event) {
            if (self.state.isFrozen) return;
            
            // Get orientation angles
            const alpha = event.alpha || 0;
            const beta = event.beta || 0;
            const gamma = event.gamma || 0;
            
            // Update display if element exists
            if (self.elements.orientationData) {
                self.elements.orientationData.textContent = `α: ${alpha.toFixed(1)}° β: ${beta.toFixed(1)}° γ: ${gamma.toFixed(1)}°`;
            }
            
            // Map orientation to position
            const x = gamma / 90;  // -1 to 1 based on tilting left/right
            const y = beta / 180;  // -1 to 1 based on tilting forward/back
            const z = 0;
            
            // Create quaternion from Euler angles
            const rad = Math.PI / 180;
            const cy = Math.cos(alpha * rad / 2);
            const sy = Math.sin(alpha * rad / 2);
            const cp = Math.cos(beta * rad / 2);
            const sp = Math.sin(beta * rad / 2);
            const cr = Math.cos(gamma * rad / 2);
            const sr = Math.sin(gamma * rad / 2);
            
            // Store position and quaternion
            self.state.lastPosition = {
                x, y, z,
                quaternion: {
                    x: sr * cp * cy - cr * sp * sy,
                    y: cr * sp * cy + sr * cp * sy,
                    z: cr * cp * sy - sr * sp * cy,
                    w: cr * cp * cy + sr * sp * sy
                }
            };
            
            // Create visual feedback
            self.createVisualFeedback();
        };
        
        // Set up motion handler
        const motionHandler = function(event) {
            if (self.state.isFrozen) return;
            
            // Get acceleration with gravity
            const accel = event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
            
            // Get rotation rate
            const rotation = event.rotationRate || { alpha: 0, beta: 0, gamma: 0 };
            
            // Update displays if elements exist
            if (self.elements.accelData) {
                self.elements.accelData.textContent = `X: ${accel.x ? accel.x.toFixed(2) : 0} Y: ${accel.y ? accel.y.toFixed(2) : 0} Z: ${accel.z ? accel.z.toFixed(2) : 0}`;
            }
            
            if (self.elements.gyroData) {
                self.elements.gyroData.textContent = `X: ${rotation.beta ? rotation.beta.toFixed(2) : 0} Y: ${rotation.gamma ? rotation.gamma.toFixed(2) : 0} Z: ${rotation.alpha ? rotation.alpha.toFixed(2) : 0}`;
            }
        };
        
        // Add event listeners
        window.addEventListener('deviceorientation', orientationHandler);
        window.addEventListener('devicemotion', motionHandler);
        
        // Store handlers for cleanup
        this._orientationHandler = orientationHandler;
        this._motionHandler = motionHandler;
        
        // Start sending data
        this.startSendingData();
        
        // Success message
        console.log("Sensors initialized successfully");
        this.showMessage("Controller active!");
    },
    
    /**
     * Create visual feedback based on orientation
     */
    createVisualFeedback() {
        // Check if visualization element exists
        if (!this.elements.visualFeedback) return;
        
        // Don't create feedback if frozen
        if (this.state.isFrozen) return;
        
        // Clear previous dots
        while (this.elements.visualFeedback.firstChild) {
            this.elements.visualFeedback.removeChild(this.elements.visualFeedback.firstChild);
        }
        
        // Create a dot based on the position
        const dot = document.createElement('div');
        dot.className = 'dot';
        
        // Position dot based on orientation
        const areaWidth = this.elements.controllerArea.clientWidth;
        const areaHeight = this.elements.controllerArea.clientHeight;
        
        // Center coordinates
        const centerX = areaWidth / 2;
        const centerY = areaHeight / 2;
        
        // Calculate position (mapping from -1...1 to the area)
        const x = centerX + this.state.lastPosition.x * centerX;
        const y = centerY + this.state.lastPosition.y * centerY;
        
        // Set position
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
        
        // Add dot to visual feedback
        this.elements.visualFeedback.appendChild(dot);
    },
    
    /**
     * Show a message to the user
     * @param {string} message - Message to display
     */
    showMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '10px';
        messageDiv.style.left = '50%';
        messageDiv.style.transform = 'translateX(-50%)';
        messageDiv.style.backgroundColor = 'rgba(52, 152, 219, 0.9)';
        messageDiv.style.color = 'white';
        messageDiv.style.padding = '10px 20px';
        messageDiv.style.borderRadius = '5px';
        messageDiv.style.zIndex = '1000';
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 2000);
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
                // Only send if we have valid data
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
     * Calibrate the controller
     */
    calibrate() {
        // Keep the current quaternion, but reset the position
        const quaternion = this.state.lastPosition.quaternion;
        this.state.lastPosition = { 
            x: 0, 
            y: 0, 
            z: 0,
            quaternion: quaternion
        };
        
        this.showMessage("Position calibrated");
    },
    
    /**
     * Toggle freeze mode
     */
    toggleFreeze() {
        this.state.isFrozen = !this.state.isFrozen;
        
        if (this.elements.freezeButton) {
            this.elements.freezeButton.textContent = this.state.isFrozen ? 'Unfreeze' : 'Freeze';
            this.elements.freezeButton.classList.toggle('freeze-active', this.state.isFrozen);
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
        
        // Remove event listeners
        if (this._orientationHandler) {
            window.removeEventListener('deviceorientation', this._orientationHandler);
        }
        if (this._motionHandler) {
            window.removeEventListener('devicemotion', this._motionHandler);
        }
        
        // Reset state
        this.state.isConnected = false;
        this.state.isFrozen = false;
    }
};