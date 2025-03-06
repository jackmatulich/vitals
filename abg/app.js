   
    document.addEventListener('DOMContentLoaded', function() {
        const clinicalScenario = document.getElementById('clinical-scenario');
        const generateBtn = document.getElementById('generate-btn');
        const resultContainer = document.getElementById('result-container');
        const bloodGasResult = document.getElementById('blood-gas-result');
        const scenarioTitle = document.getElementById('scenario-title');
        const gasTypeLabel = document.getElementById('gas-type-label');
        const gasValues = document.getElementById('gas-values');
        const interpretation = document.getElementById('interpretation');
        const downloadBtn = document.getElementById('download-btn');
        const loading = document.getElementById('loading');
    
        // Replace with your actual Claude API key
        const API_A = 'sk-ant-api03-IU-';
        const API_B = 'KMm95cYqQWEPKF5PzHdHyMnuHfGfUYofegRgUNgAZZuhbNEj7IeGAuJwP1f-f7OTlzdwjIKaSmjGWhfFi-A-xhWLQQAA';
        const API_KEY = API_A.concat(API_B);
    
        generateBtn.addEventListener('click', async function() {
            // Get input values
            const scenario = clinicalScenario.value.trim();
            const gasType = document.querySelector('input[name="gas-type"]:checked').value;
            
            if (!scenario) {
                alert('Please enter a clinical scenario');
                return;
            }
            
            // Show loading spinner
            loading.style.display = 'block';
            resultContainer.style.display = 'none';
            
            try {
                // Call Claude API
                const bloodGasData = await generateBloodGas(scenario, gasType);
                
                // Display results
                displayResults(bloodGasData, scenario, gasType);
                
                // Hide loading, show results
                loading.style.display = 'none';
                resultContainer.style.display = 'block';
                
                // Automatically trigger download
                setTimeout(() => {
                    downloadImage();
                }, 500); // Small delay to ensure rendering is complete
                
            } catch (error) {
                loading.style.display = 'none';
                alert('Error generating blood gas: ' + error.message);
                console.error(error);
            }
        });
        
        downloadBtn.addEventListener('click', downloadImage);
        
        async function generateBloodGas(scenario, gasType) {
            // Construct the prompt for Claude
            const prompt = `
            Generate realistic ${gasType} values for the following clinical scenario: "${scenario}".
            
            Provide the following values in a structured format:
            - pH
            - pCO2 (mmHg)
            - pO2 (mmHg)
            - HCO3 (mmol/L)
            - Base Excess (mmol/L)
            - Lactate (mmol/L)
            - SaO2/SvO2 (%)
            
            Also provide a brief clinical interpretation of these values (2-3 sentences).
            Format your response as JSON with the following structure:
            {
                "values": {
                    "pH": number,
                    "pCO2": number,
                    "pO2": number,
                    "HCO3": number,
                    "baseExcess": number,
                    "lactate": number,
                    "saturation": number
                },
                "interpretation": "string"
            }
            `;
            
            // Use a CORS proxy service to get around CORS restrictions
            const CORS_PROXY = 'https://corsproxy.io/?';
            const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
            
            const response = await fetch(CORS_PROXY + encodeURIComponent(ANTHROPIC_API), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: "claude-3-sonnet-20240229",
                    max_tokens: 1000,
                    messages: [
                        { role: "user", content: prompt }
                    ]
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            
            // Extract and parse the JSON from Claude's response
            try {
                const content = data.content[0].text;
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error("Could not parse JSON from response");
                }
            } catch (error) {
                console.error("Error parsing response:", error);
                throw new Error("Failed to parse blood gas data");
            }
        }
        
        function displayResults(data, scenario, gasType) {
            // Set header information
            scenarioTitle.textContent = scenario;
            gasTypeLabel.textContent = gasType;
            
            // Create table for gas values
            const table = document.createElement('table');
            
            // Add each row to the table
            const rows = [
                ['pH', data.values.pH.toFixed(2)],
                ['pCO2', data.values.pCO2.toFixed(1) + ' mmHg'],
                ['pO2', data.values.pO2.toFixed(1) + ' mmHg'],
                ['HCO3', data.values.HCO3.toFixed(1) + ' mmol/L'],
                ['Base Excess', data.values.baseExcess.toFixed(1) + ' mmol/L'],
                ['Lactate', data.values.lactate.toFixed(1) + ' mmol/L'],
                [(gasType === 'ABG' ? 'SaO2' : 'SvO2'), data.values.saturation.toFixed(1) + '%']
            ];
            
            rows.forEach(row => {
                const tr = document.createElement('tr');
                const td1 = document.createElement('td');
                const td2 = document.createElement('td');
                
                td1.textContent = row[0];
                td2.textContent = row[1];
                
                tr.appendChild(td1);
                tr.appendChild(td2);
                table.appendChild(tr);
            });
            
            // Clear and append new content
            gasValues.innerHTML = '';
            gasValues.appendChild(table);
            
            // Set interpretation
            interpretation.textContent = data.interpretation;
        }
        
        function downloadImage() {
            html2canvas(bloodGasResult, {
                scale: 2, // Higher quality
                backgroundColor: null
            }).then(canvas => {
                // Create image
                const image = canvas.toDataURL('image/png');
                
                // Create download link
                const link = document.createElement('a');
                link.href = image;
                link.download = 'blood_gas.png';
                
                // Trigger download
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }
    });