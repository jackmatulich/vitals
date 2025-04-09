// dicomProcessor.js
const fs = require('fs');
const path = require('path');
const dicomParser = require('dicom-parser');
const { createCanvas } = require('canvas');
const { mat4, vec3, quat } = require('gl-matrix');

/**
 * Load and process a DICOM dataset from a directory
 * @param {string} directoryPath Path to directory containing DICOM files
 * @returns {Object} Processed volume data
 */
async function loadDicomDataset(directoryPath) {
  // Get all DICOM files in the directory
  const files = fs.readdirSync(directoryPath)
    .filter(file => file.toLowerCase().endsWith('.dcm'))
    .map(file => path.join(directoryPath, file));
  
  console.log(`Found ${files.length} DICOM files`);
  
  if (files.length === 0) {
    throw new Error('No DICOM files found in directory');
  }
  
  // Process each file to extract metadata and pixel data
  const slices = [];
  
  for (const filePath of files) {
    try {
      const dicomData = fs.readFileSync(filePath);
      const dataSet = dicomParser.parseDicom(dicomData);
      
      // Extract important metadata
      const rows = dataSet.uint16('x00280010');
      const columns = dataSet.uint16('x00280011');
      const sliceLocation = parseFloat(dataSet.string('x00201041') || '0');
      const pixelSpacing = dataSet.string('x00280030')?.split('\\').map(parseFloat) || [1, 1];
      const sliceThickness = parseFloat(dataSet.string('x00180050') || '1');
      
      // Get image position (for ordering slices)
      let imagePosition;
      try {
        imagePosition = dataSet.string('x00200032')?.split('\\').map(parseFloat) || [0, 0, sliceLocation];
      } catch (e) {
        imagePosition = [0, 0, sliceLocation];
      }
      
      // Extract pixel data
      const pixelDataElement = dataSet.elements.x7fe00010;
      if (!pixelDataElement) {
        console.warn(`No pixel data found in ${filePath}`);
        continue;
      }
      
      // Get pixel format information
      const bitsAllocated = dataSet.uint16('x00280100');
      const pixelRepresentation = dataSet.uint16('x00280103');
      const photometricInterpretation = dataSet.string('x00280004');
      
      let pixelData;
      if (bitsAllocated === 16) {
        pixelData = new Int16Array(
          dataSet.byteArray.buffer,
          pixelDataElement.dataOffset,
          pixelDataElement.length / 2
        );
      } else {
        pixelData = new Uint8Array(
          dataSet.byteArray.buffer,
          pixelDataElement.dataOffset,
          pixelDataElement.length
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
        photometricInterpretation,
        sliceLocation
      });
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }
  
  if (slices.length === 0) {
    throw new Error('Failed to process any DICOM files');
  }
  
  console.log(`Successfully processed ${slices.length} DICOM slices`);
  
  // Sort slices by position (Z-coordinate or slice location)
  slices.sort((a, b) => {
    return a.imagePosition[2] - b.imagePosition[2];
  });
  
  // Create a 3D volume from the slices
  return createVolumeFromSlices(slices);
}

/**
 * Create a 3D volume from sorted DICOM slices
 * @param {Array} slices Array of processed DICOM slices
 * @returns {Object} Volume data
 */
function createVolumeFromSlices(slices) {
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
}

/**
 * Simulate an ultrasound image from CT volume based on probe position
 * @param {Object} volume Volume data from DICOM
 * @param {Array} probePosition 3D position of the probe [x, y, z]
 * @param {Array} probeOrientation Orientation as quaternion [x, y, z, w]
 * @param {Object} settings Settings for the simulation
 * @returns {Buffer} PNG image buffer
 */
function simulateUltrasound(volume, probePosition, probeOrientation, settings) {
  // Create a canvas for the output ultrasound image
  const canvas = createCanvas(settings.width, settings.height);
  const ctx = canvas.getContext('2d');
  
  // Clear the canvas with black background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, settings.width, settings.height);
  
  // Simulation parameters
  const beamWidth = settings.width;  // Number of scan lines
  const beamDepth = settings.depth;  // Depth in cm
  const gain = settings.gain / 100;  // Gain (0-1)
  
  // Convert depth to voxel units
  const depthVoxels = beamDepth * 10 / volume.spacing[0]; // Assuming spacing is in mm
  
  // Create ultrasound fan geometry
  const fanAngle = Math.PI / 3; // 60 degrees fan
  const fanStartAngle = -fanAngle / 2;
  
  // Create transformation matrix from probe position and orientation
  const modelMatrix = mat4.create();
  
  // Set translation
  mat4.translate(modelMatrix, modelMatrix, [
    probePosition[0] * volume.dimensions[0] / 2, 
    probePosition[1] * volume.dimensions[1] / 2,
    probePosition[2] * volume.dimensions[2] / 2
  ]);
  
  // Set rotation from quaternion
  const rotationMatrix = mat4.create();
  mat4.fromQuat(rotationMatrix, [
    probeOrientation[0],
    probeOrientation[1],
    probeOrientation[2],
    probeOrientation[3]
  ]);
  mat4.multiply(modelMatrix, modelMatrix, rotationMatrix);
  
  // Create image data for ultrasound
  const imageData = ctx.createImageData(settings.width, settings.height);
  const data = imageData.data;
  
  // For each scan line in the ultrasound beam
  for (let i = 0; i < settings.width; i++) {
    // Calculate ray angle within the fan
    const rayAngle = fanStartAngle + (i / settings.width) * fanAngle;
    
    // Calculate ray direction
    const rayDirection = vec3.fromValues(
      Math.sin(rayAngle),  // X component
      Math.cos(rayAngle),  // Y component
      0                   // Z component (assuming 2D ultrasound plane)
    );
    
    // Transform ray direction by probe orientation
    vec3.transformMat4(rayDirection, rayDirection, rotationMatrix);
    
    // Normalize the direction
    vec3.normalize(rayDirection, rayDirection);
    
    // Define ray starting point at probe position
    const rayOrigin = vec3.fromValues(
      volume.dimensions[0] / 2 + probePosition[0] * volume.dimensions[0] / 2,
      volume.dimensions[1] / 2 + probePosition[1] * volume.dimensions[1] / 2,
      volume.dimensions[2] / 2 + probePosition[2] * volume.dimensions[2] / 2
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
        currentPos[0] >= 0 && currentPos[0] < volume.dimensions[0] &&
        currentPos[1] >= 0 && currentPos[1] < volume.dimensions[1] &&
        currentPos[2] >= 0 && currentPos[2] < volume.dimensions[2]
      ) {
        // Calculate volume index
        const vx = Math.floor(currentPos[0]);
        const vy = Math.floor(currentPos[1]);
        const vz = Math.floor(currentPos[2]);
        
        const volumeIndex = 
          vz * volume.dimensions[1] * volume.dimensions[0] +
          vy * volume.dimensions[0] +
          vx;
        
        // Get voxel value
        let voxelValue = volume.data[volumeIndex] || 0;
        
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
  drawFanOverlay(ctx, settings.width, settings.height);
  
  // Return PNG buffer
  return canvas.toBuffer('image/png');
}

/**
 * Draw fan shape overlay to simulate ultrasound display
 * @param {CanvasRenderingContext2D} ctx Canvas context
 * @param {number} width Canvas width
 * @param {number} height Canvas height
 */
function drawFanOverlay(ctx, width, height) {
  // Draw fan border
  ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
  ctx.lineWidth = 2;
  
  // Define fan shape
  const centerX = width / 2;
  const startY = 0;
  const fanAngle = Math.PI / 3; // 60 degrees
  
  ctx.beginPath();
  ctx.moveTo(centerX, startY);
  ctx.arc(centerX, startY, height * 1.2, Math.PI - fanAngle/2, Math.PI + fanAngle/2);
  ctx.closePath();
  ctx.stroke();
  
  // Add probe indicator at the top
  ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
  ctx.fillRect(centerX - 30, 0, 60, 10);
}

module.exports = {
  loadDicomDataset,
  simulateUltrasound
};