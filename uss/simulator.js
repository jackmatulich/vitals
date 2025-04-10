// js/simulator.js - Simulator functionality for ultrasound visualization

/**
 * Simulator module - Handles the ultrasound simulation display
 */
const Simulator = {
    // DOM elements
    elements: {
        canvas: null,
        ctx: null,
        connectPhoneButton: null,
        depthControl: null,
        gainControl: null,
        depthValue: null,
        gainValue: null,
        presetSelect: null,
        scanLinesToggle: null,
        freezeBtn: null,
        saveBtn: null,
        connectionStatus: null,
        lastUpdate: null,
        probeX: null,
        probeY: null,
        probeZ: null,
        probeAngle: null,
        timestamp: null,
        connectionModal: null,
        closeButton: null,
        qrcodeElement: null,
        modalSessionId: null,
        sessionId: null,
        dicomUpload: null,
        processDicomBtn: null,
        processingStatus: null,
        progressBar: null,
        progressContainer: null
    },
    
    // State
    state: {
        sessionId: '',
        volumeData: null,
        dicomFiles: [],
        isFrozen: false,
        lastImageData: null,
        lastProbePosition: null,
        isPolling: false,
        pollingInterval: null,
        settings: {
            depth: 15,
            gain: 50,
            preset: 'abdomen',
            scanLines: true,
            width: 800,
            height: 600,
            speckleIntensity: 0.5,
            speckleAmount: 30
        }
    },
    
    /**
     * Initialize the simulator
     */
    init() {
        // Initialize DOM elements
        this.initElements();
        
        // Set canvas size
        this.elements.canvas.width = 800;
        this.elements.canvas.height = 600;
        
        // Generate unique session ID
        this.state.sessionId = generateSessionId();
        this.elements.sessionId.textContent = this.state.sessionId;
        this.elements.modalSessionId.textContent = this.state.sessionId;
        
        // Update timestamp every second
        setInterval(() => this.updateTimestamp(), 1000);
        this.updateTimestamp();
        
        // Initialize Cornerstone for DICOM processing
        this.initCornerstone();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Draw placeholder on canvas
        this.drawPlaceholderImage(false);
    },
    
    /**
     * Initialize DOM elements
     */
    initElements() {
        this.elements.canvas = document.getElementById('ultrasoundCanvas');
        this.elements.ctx = this.elements.canvas.getContext('2d');
        this.elements.connectPhoneButton = document.getElementById('connectPhone');
        this.elements.depthControl = document.getElementById('depthControl');
        this.elements.gainControl = document.getElementById('gainControl');
        this.elements.depthValue = document.getElementById('depthValue');
        this.elements.gainValue = document.getElementById('gainValue');
        this.elements.presetSelect = document.getElementById('presetSelect');
        this.elements.scanLinesToggle = document.getElementById('scanLinesToggle');
        this.elements.freezeBtn = document.getElementById('freezeBtn');
        this.elements.saveBtn = document.getElementById('saveBtn');
        this.elements.connectionStatus = document.getElementById('connectionStatus');
        this.elements.lastUpdate = document.getElementById('lastUpdate');
        this.elements.probeX = document.getElementById('probeX');
        this.elements.probeY = document.getElementById('probeY');
        this.elements.probeZ = document.getElementById('probeZ');
        this.elements.probeAngle = document.getElementById('probeAngle');
        this.elements.timestamp = document.getElementById('timestamp');
        this.elements.connectionModal = document.getElementById('connectionModal');
        this.elements.closeButton = document.querySelector('.close-button');
        this.elements.qrcodeElement = document.getElementById('qrcode');
        this.elements.modalSessionId = document.getElementById('modalSessionId');
        this.elements.sessionId = document.getElementById('sessionId');
        this.elements.dicomUpload = document.getElementById('dicomUpload');
        this.elements.processDicomBtn = document.getElementById('processDicomBtn');
        this.elements.processingStatus = document.getElementById('processingStatus');
        this.elements.progressBar = document.getElementById('progressBar');
        this.elements.progressContainer = document.querySelector('.progress-container');
    },
    
    /**
     * Initialize Cornerstone for DICOM processing
     */
    initCornerstone() {
        if (typeof cornerstone !== 'undefined') {
            cornerstone.enable(this.elements.canvas);
            if (typeof cornerstoneWADOImageLoader !== 'undefined') {
                cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
                cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
            }
        } else {
            console.warn('Cornerstone libraries not loaded');
        }
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Connect phone button
        this.elements.connectPhoneButton.addEventListener('click', () => this.showConnectionModal());
        
        // Close modal
        this.elements.closeButton.addEventListener('click', () => {
            this.elements.connectionModal.style.display = 'none';
        });
        
        // Click outside modal to close
        window.addEventListener('click', (event) => {
            if (event.target === this.elements.connectionModal) {
                this.elements.connectionModal.style.display = 'none';
            }
        });
        
        // Freeze/unfreeze button
        this.elements.freezeBtn.addEventListener('click', () => this.toggleFreeze());
        
        // Save button
        this.elements.saveBtn.addEventListener('click', () => this.saveImage());
        
        // Settings controls
        this.elements.depthControl.addEventListener('input', () => {
            this.elements.depthValue.textContent = this.elements.depthControl.value;
            this.updateSettings();
        });
        
        this.elements.gainControl.addEventListener('input', () => {
            this.elements.gainValue.textContent = this.elements.gainControl.value;
            this.updateSettings();
        });
        
        this.elements.presetSelect.addEventListener('change', () => this.updateSettings());
        this.elements.scanLinesToggle.addEventListener('change', () => this.updateSettings());
        
        // DICOM file handling
        this.elements.dicomUpload.addEventListener('change', (event) => {
            this.state.dicomFiles = Array.from(event.target.files);
            this.elements.processingStatus.textContent = `Selected ${this.state.dicomFiles.length} DICOM files. Click Process to begin.`;
        });
        
        this.elements.processDicomBtn.addEventListener('click', () => this.processDicomFiles());
        
        // Clean up when the page is closed/refreshed
        window.addEventListener('beforeunload', () => {
            this.stopPolling();
        });
    },
    
    /**
     * Update timestamp display
     */
    updateTimestamp() {
        const now = new Date();
        this.elements.timestamp.textContent = now.toLocaleTimeString();
    },
    
    /**
     * Show connection modal with QR code
     */
    showConnectionModal() {
        // Show modal
        this.elements.connectionModal.style.display = 'block';
        
        // Generate QR code for controller URL
        this.elements.qrcodeElement.innerHTML = '';
        const currentUrl = new URL(window.location.href);
        const baseUrl = currentUrl.origin + currentUrl.pathname.substring(0, currentUrl.pathname.lastIndexOf('/') + 1);
        const controllerUrl = `${baseUrl}?mode=controller&session=${this.state.sessionId}`;
        
        new QRCode(this.elements.qrcodeElement, {
            text: controllerUrl,
            width: 200,
            height: 200
        });
        
        // Start polling for controller data
        this.startPolling();
    },
    
    /**
     * Start polling for controller data
     */
    startPolling() {
        if (this.state.isPolling) return;
        
        this.state.isPolling = true;
        this.elements.connectionStatus.textContent = 'Connected';
        this.elements.connectionStatus.className = 'status-value connected';
        
        // Send initial settings to controller
        DweetIO.send(this.state.sessionId, 'simulator', {
            type: 'settings',
            settings: this.state.settings,
            timestamp: Date.now()
        });
        
        // Poll for controller data every 100ms
        this.state.pollingInterval = setInterval(async () => {
            const data = await DweetIO.getLatest(this.state.sessionId, 'controller');
            
            if (data && data.type === 'imu-data') {
                // Process IMU data
                this.handleProbeData(data);
                
                // Update last update time
                this.elements.lastUpdate.textContent = new Date().toLocaleTimeString();
            }
        }, 100);
    },
    
    /**
     * Stop polling for controller data
     */
    stopPolling() {
        if (!this.state.isPolling) return;
        
        this.state.isPolling = false;
        clearInterval(this.state.pollingInterval);
        this.state.pollingInterval = null;
        this.elements.connectionStatus.textContent = 'Disconnected';
        this.elements.connectionStatus.className = 'status-value disconnected';
    },
    
    /**
     * Handle probe position data from controller
     * @param {object} data - IMU data from controller
     */
    handleProbeData(data) {
        if (this.state.isFrozen || !this.state.volumeData) return;
        
        // Update probe position display
        this.elements.probeX.textContent = data.position.x.toFixed(2);
        this.elements.probeY.textContent = data.position.y.toFixed(2);
        this.elements.probeZ.textContent = data.position.z.toFixed(2);
        
        // Calculate and display angle
        const q = data.quaternion;
        const angle = 2 * Math.acos(q.w) * 180 / Math.PI;
        this.elements.probeAngle.textContent = angle.toFixed(2);
        
        // Store last probe position
        this.state.lastProbePosition = {
            position: data.position,
            quaternion: data.quaternion
        };
        
        // Generate ultrasound image
        this.generateUltrasoundImage(data.position, data.quaternion);
    },
    
    /**
     * Toggle freeze/unfreeze of ultrasound image
     */
    toggleFreeze() {
        this.state.isFrozen = !this.state.isFrozen;
        this.elements.freezeBtn.textContent = this.state.isFrozen ? 'Unfreeze' : 'Freeze';
        
        if (!this.state.isFrozen && this.state.lastProbePosition) {
            // Generate new image when unfreezing
            this.generateUltrasoundImage(
                this.state.lastProbePosition.position,
                this.state.lastProbePosition.quaternion
            );
        }
    },
    
    /**
     * Save current ultrasound image
     */
    saveImage() {
        if (!this.state.lastImageData) return;
        
        const link = document.createElement('a');
        link.download = `ultrasound_${new Date().toISOString().replace(/:/g, '-')}.png`;
        link.href = this.state.lastImageData;
        link.click();
    },
    
    /**
     * Update simulator settings
     */
    updateSettings() {
        this.state.settings = {
            depth: parseInt(this.elements.depthControl.value),
            gain: parseInt(this.elements.gainControl.value),
            preset: this.elements.presetSelect.value,
            scanLines: this.elements.scanLinesToggle.checked,
            width: this.elements.canvas.width,
            height: this.elements.canvas.height,
            speckleIntensity: 0.5,
            speckleAmount: 30
        };
        
        // Send settings update to controller if connected
        if (this.state.isPolling) {
            DweetIO.send(this.state.sessionId, 'simulator', {
                type: 'settings',
                settings: this.state.settings,
                timestamp: Date.now()
            });
        }
        
        // Update image if we have probe position data
        if (this.state.lastProbePosition && !this.state.isFrozen) {
            this.generateUltrasoundImage(
                this.state.lastProbePosition.position,
                this.state.lastProbePosition.quaternion
            );
        }
    },
    
    /**
     * Process DICOM files to create 3D volume
     */
    async processDicomFiles() {
        if (!this.state.dicomFiles.length) {
            alert('Please select DICOM files first');
            return;
        }
        
        this.elements.processingStatus.innerHTML = '<div class="loader"></div> Processing DICOM files...';
        this.elements.progressContainer.style.display = 'block';
        this.elements.progressBar.style.width = '0%';
        
        try {
            // Sort files by instance number or file name
            this.state.dicomFiles.sort((a, b) => a.name.localeCompare(b.name));
            
            const slices = [];
            
            // Process each file
            for (let i = 0; i < this.state.dicomFiles.length; i++) {
                const file = this.state.dicomFiles[i];
                const percentage = Math.round((i / this.state.dicomFiles.length) * 100);
                this.elements.progressBar.style.width = `${percentage}%`;
                
                // Read file
                const arrayBuffer = await readFileAsArrayBuffer(file);
                
                // Parse DICOM data
                const dicomData = dicomParser.parseDicom(new Uint8Array(arrayBuffer));
                
                // Extract important metadata
                const rows = dicomData.uint16('x00280010');
                const columns = dicomData.uint16('x00280011');
                let sliceLocation = 0;
                
                try {
                    sliceLocation = parseFloat(dicomData.string('x00201041') || '0');
                } catch (e) {
                    // If slice location is not available, use the file index
                    sliceLocation = i;
                }
                
                let pixelSpacing = [1, 1];
                try {
                    pixelSpacing = dicomData.string('x00280030')?.split('\\').map(parseFloat) || [1, 1];
                } catch (e) {
                    console.warn('Could not parse pixel spacing, using default');
                }
                
                let sliceThickness = 1;
                try {
                    sliceThickness = parseFloat(dicomData.string('x00180050') || '1');
                } catch (e) {
                    console.warn('Could not parse slice thickness, using default');
                }
                
                // Get image position (for ordering slices)
                let imagePosition = [0, 0, sliceLocation];
                try {
                    imagePosition = dicomData.string('x00200032')?.split('\\').map(parseFloat) || [0, 0, sliceLocation];
                } catch (e) {
                    console.warn('Could not parse image position, using slice location');
                }
                
                // Extract pixel data
                const pixelDataElement = dicomData.elements.x7fe00010;
                if (!pixelDataElement) {
                    console.warn(`No pixel data found in ${file.name}`);
                    continue;
                }
                
                // Get pixel format information
                const bitsAllocated = dicomData.uint16('x00280100') || 16;
                const pixelRepresentation = dicomData.uint16('x00280103') || 0;
                
                let pixelData;
                if (bitsAllocated === 16) {
                    pixelData = new Int16Array(
                        arrayBuffer.slice(
                            pixelDataElement.dataOffset,
                            pixelDataElement.dataOffset + pixelDataElement.length
                        )
                    );
                } else {
                    pixelData = new Uint8Array(
                        arrayBuffer.slice(
                            pixelDataElement.dataOffset,
                            pixelDataElement.dataOffset + pixelDataElement.length
                        )
                    );
                }
                
                // Store slice information
                slices.push({
                    imagePosition,
                    pixelSpacing,
                    sliceThickness,
                    rows,
                    columns,
                    pixelData,
                    bitsAllocated,
                    pixelRepresentation,
                    sliceLocation
                });
                
                // Update status
                this.elements.processingStatus.innerHTML = `<div class="loader"></div> Processing DICOM files... ${i+1}/${this.state.dicomFiles.length}`;
            }
            
            if (slices.length === 0) {
                throw new Error('Failed to process any DICOM files');
            }
            
            this.elements.processingStatus.innerHTML = '<div class="loader"></div> Creating 3D volume...';
            
            // Sort slices by position (Z-coordinate or slice location)
            slices.sort((a, b) => {
                return a.imagePosition[2] - b.imagePosition[2];
            });
            
            // Create 3D volume from slices
            this.state.volumeData = this.createVolumeFromSlices(slices);
            
            this.elements.processingStatus.innerHTML = 
                `<span style="color: var(--success-color);">✓</span> Volume created successfully: 
                ${this.state.volumeData.dimensions[0]}x${this.state.volumeData.dimensions[1]}x${this.state.volumeData.dimensions[2]} voxels`;
            this.elements.progressContainer.style.display = 'none';
            
            // Draw placeholder on canvas
            this.drawPlaceholderImage(true);
            
        } catch (error) {
            console.error('Error processing DICOM files:', error);
            this.elements.processingStatus.innerHTML = `<span style="color: var(--error-color);">✗</span> Error: ${error.message}`;
            this.elements.progressContainer.style.display = 'none';
        }
    },
    
    /**
     * Create a 3D volume from sorted DICOM slices
     * @param {Array} slices - Array of processed DICOM slices
     * @returns {Object} Volume data object
     */
    createVolumeFromSlices(slices) {
        // Get dimensions from the first slice
        const rows = slices[0].rows;
        const columns = slices[0].columns;
        const numSlices = slices.length;
        
        console.log(`Creating volume with dimensions: ${columns}x${rows}x${numSlices}`);
        
        // Create a 3D typed array to hold volume data
        const volumeBuffer = new Float32Array(columns * rows * numSlices);
        
        // Fill the volume with data from each slice
        for (let z = 0; z < numSlices; z++) {
            const slice = slices[z];
            const pixelData = slice.pixelData;
            
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < columns; x++) {
                    const srcIndex = y * columns + x;
                    const destIndex = (z * rows * columns) + (y * columns) + x;
                    
                    // Get pixel value
                    let value = pixelData[srcIndex];
                    
                    // Convert to Hounsfield units if needed
                    // This is a simplified approach - real implementation would handle rescale slope/intercept
                    if (slice.bitsAllocated === 16) {
                        value = Math.max(-1024, Math.min(3071, value)); // Typical HU range
                        
                        // Normalize to 0-1 range for easier processing
                        value = (value + 1024) / 4096;
                    } else {
                        value /= 255; // Normalize 8-bit data
                    }
                    
                    volumeBuffer[destIndex] = value;
                }
            }
        }
        
        // Return the volume data with metadata
        return {
            data: volumeBuffer,
            dimensions: [columns, rows, numSlices],
            spacing: [
                slices[0].pixelSpacing[0],
                slices[0].pixelSpacing[1],
                slices[0].sliceThickness
            ]
        };
    },
    
    /**
     * Generate ultrasound image from volume data
     * @param {Object} probePosition - Probe position {x, y, z}
     * @param {Object} probeOrientation - Probe orientation as quaternion {x, y, z, w}
     */
    generateUltrasoundImage(probePosition, probeOrientation) {
        if (!this.state.volumeData) {
            console.warn('No volume data available');
            return;
        }
        
        const ctx = this.elements.ctx;
        const settings = this.state.settings;
        
        // Clear canvas
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, settings.width, settings.height);
        
        // Simulation parameters
        const beamWidth = settings.width;  // Number of scan lines
        const beamDepth = settings.depth;  // Depth in cm
        const gain = settings.gain / 100;  // Gain (0-1)
        
        // Convert depth to voxel units
        const depthVoxels = beamDepth * 10 / this.state.volumeData.spacing[0]; // Assuming spacing is in mm
        
        // Create ultrasound fan geometry
        const fanAngle = Math.PI / 3; // 60 degrees fan
        const fanStartAngle = -fanAngle / 2;
        
        // Create transformation matrix from probe position and orientation
        const modelMatrix = glMatrix.mat4.create();
        
        // Set translation
        glMatrix.mat4.translate(modelMatrix, modelMatrix, [
            probePosition.x * this.state.volumeData.dimensions[0] / 2, 
            probePosition.y * this.state.volumeData.dimensions[1] / 2,
            probePosition.z * this.state.volumeData.dimensions[2] / 2
        ]);
        
        // Set rotation from quaternion
        const rotationMatrix = glMatrix.mat4.create();
        glMatrix.mat4.fromQuat(rotationMatrix, [
            probeOrientation.x,
            probeOrientation.y,
            probeOrientation.z,
            probeOrientation.w
        ]);
        glMatrix.mat4.multiply(modelMatrix, modelMatrix, rotationMatrix);
        
        // Create image data for ultrasound
        const imageData = ctx.createImageData(settings.width, settings.height);
        const data = imageData.data;
        
        // For each scan line in the ultrasound beam
        for (let i = 0; i < settings.width; i++) {
            // Calculate ray angle within the fan
            const rayAngle = fanStartAngle + (i / settings.width) * fanAngle;
            
            // Calculate ray direction
            const rayDirection = glMatrix.vec3.fromValues(
                Math.sin(rayAngle),  // X component
                Math.cos(rayAngle),  // Y component
                0                   // Z component (assuming 2D ultrasound plane)
            );
            
            // Transform ray direction by probe orientation
            glMatrix.vec3.transformMat4(rayDirection, rayDirection, rotationMatrix);
            
            // Normalize the direction
            glMatrix.vec3.normalize(rayDirection, rayDirection);
            
            // Define ray starting point at probe position
            const rayOrigin = glMatrix.vec3.fromValues(
                this.state.volumeData.dimensions[0] / 2 + probePosition.x * this.state.volumeData.dimensions[0] / 2,
                this.state.volumeData.dimensions[1] / 2 + probePosition.y * this.state.volumeData.dimensions[1] / 2,
                this.state.volumeData.dimensions[2] / 2 + probePosition.z * this.state.volumeData.dimensions[2] / 2
            );
            
            // Cast ray through volume
            const samples = [];
            let attenuation = 1.0;
            
            for (let step = 0; step < depthVoxels; step++) {
                // Calculate current position along the ray
                const currentPos = [
                    rayOrigin[0] + rayDirection[0] * step,
                    rayOrigin[1] + rayDirection[1] * step,
                    rayOrigin[2] + rayDirection[2] * step
                ];
                
                // Check if position is within volume bounds
                if (
                    currentPos[0] >= 0 && currentPos[0] < this.state.volumeData.dimensions[0] &&
                    currentPos[1] >= 0 && currentPos[1] < this.state.volumeData.dimensions[1] &&
                    currentPos[2] >= 0 && currentPos[2] < this.state.volumeData.dimensions[2]
                ) {
                    // Calculate volume index
                    const vx = Math.floor(currentPos[0]);
                    const vy = Math.floor(currentPos[1]);
                    const vz = Math.floor(currentPos[2]);
                    
                    const volumeIndex = 
                        vz * this.state.volumeData.dimensions[1] * this.state.volumeData.dimensions[0] +
                        vy * this.state.volumeData.dimensions[0] +
                        vx;
                    
                    // Get voxel value
                    let voxelValue = this.state.volumeData.data[volumeIndex] || 0;
                    
                    // Apply tissue-specific factors (simplified)
                    // - Air: Very low values, nearly no reflection
                    // - Soft tissue: Mid-range values, moderate reflection 
                    // - Bone: High values, strong reflection
                    let reflectionFactor = 0;
                    
                    if (voxelValue < 0.05) {
                        // Air or very low density tissue
                        reflectionFactor = 0.05;
                        attenuation *= 0.99; // Low attenuation in air
                    } else if (voxelValue > 0.7) {
                        // Bone or dense tissue
                        reflectionFactor = 0.9;
                        attenuation *= 0.7; // High attenuation
                    } else {
                        // Soft tissue
                        reflectionFactor = 0.3 + voxelValue * 0.5;
                        attenuation *= 0.95; // Moderate attenuation
                    }
                    
                    // Calculate echo intensity based on reflection and attenuation
                    let echoIntensity = voxelValue * reflectionFactor * attenuation;
                    
                    // Apply gain
                    echoIntensity *= gain;
                    
                    // Apply depth-dependent intensity (time gain compensation)
                    const depthFactor = 1.0 + step / depthVoxels * 2.0;
                    echoIntensity *= depthFactor;
                    
                    samples.push(echoIntensity);
                } else {
                    // Outside volume bounds
                    samples.push(0);
                }
            }
            
            // Resample to fit image height and apply effects
            for (let j = 0; j < settings.height; j++) {
                const sampleIndex = Math.floor(j * samples.length / settings.height);
                let value = samples[sampleIndex] || 0;
                
                // Add speckle noise (characteristic of ultrasound)
                if (Math.random() < settings.speckleIntensity) {
                    value += Math.random() * 0.2;
                }
                
                // Apply log compression (typical in ultrasound imaging)
                value = Math.log(1 + value * 10) / Math.log(11);
                
                // Convert to 0-255 range and clamp
                value = Math.max(0, Math.min(255, Math.floor(value * 255)));
                
                // Set pixel in image data
                const pixelIndex = (j * settings.width + i) * 4;
                data[pixelIndex] = value;     // R
                data[pixelIndex + 1] = value; // G
                data[pixelIndex + 2] = value; // B
                data[pixelIndex + 3] = 255;   // Alpha
            }
        }
        
        // Put the image data on the canvas
        ctx.putImageData(imageData, 0, 0);
        
        // Add scan lines effect (characteristic of ultrasound)
        if (settings.scanLines) {
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            
            for (let i = 0; i < settings.width; i += 8) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, settings.height);
                ctx.stroke();
            }
        }
        
        // Add measurement scale on the side
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        
        // Depth markers (every 1cm)
        for (let i = 0; i <= settings.depth; i += 1) {
            const y = (i / settings.depth) * settings.height;
            
            // Draw tick mark
            ctx.fillRect(settings.width - 20, y, 10, 1);
            
            // Add label for every 5cm
            if (i % 5 === 0) {
                ctx.fillText(`${i}cm`, settings.width - 45, y + 5);
            }
        }
        
        // Add fan overlay
        this.drawFanOverlay();
        
        // Store the image data
        this.state.lastImageData = this.elements.canvas.toDataURL('image/png');
    },
    
    /**
     * Draw fan shape overlay to simulate ultrasound display
     */
    drawFanOverlay() {
        const ctx = this.elements.ctx;
        const settings = this.state.settings;
        
        // Draw fan border
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
        ctx.lineWidth = 2;
        
        // Define fan shape
        const centerX = settings.width / 2;
        const startY = 0;
        const fanAngle = Math.PI / 3; // 60 degrees
        
        ctx.beginPath();
        ctx.moveTo(centerX, startY);
        
        









        ctx.arc(centerX, startY, settings.height * 1.2, Math.PI - fanAngle/2, Math.PI + fanAngle/2);
        ctx.closePath();
        ctx.stroke();
        
        // Add probe indicator at the top
        ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
        ctx.fillRect(centerX - 30, 0, 60, 10);
    },
    
    /**
     * Draw placeholder image when first loaded
     * @param {boolean} volumeReady - Whether volume data is ready
     */
    drawPlaceholderImage(volumeReady = false) {
        const ctx = this.elements.ctx;
        const width = this.elements.canvas.width;
        const height = this.elements.canvas.height;
        
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(0, height);
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
        
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        
        if (volumeReady) {
            ctx.fillText('Volume ready. Connect phone controller to begin.', 
                width / 2, height / 2);
        } else {
            ctx.fillText('Upload and process DICOM files to begin', 
                width / 2, height / 2);
        }
        
        // Draw scale on the side
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(width - 30, 0);
        ctx.lineTo(width - 30, height);
        ctx.stroke();
        
        for (let i = 0; i <= 10; i++) {
            const y = i * height / 10;
            ctx.beginPath();
            ctx.moveTo(width - 40, y);
            ctx.lineTo(width - 30, y);
            ctx.stroke();
            
            if (i % 2 === 0) {
                ctx.fillText(`${i * 2}cm`, width - 60, y + 5);
            }
        }
        
        this.drawFanOverlay();
    }
};