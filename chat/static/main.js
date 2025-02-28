const messages = [];

const messagesContainer = document.querySelector(".messages-container");
const messagesHolder = document.getElementById("messages");
const textInput = document.getElementById("text-input");
const submitButton = document.getElementById("submit-btn");
const apiKeyInput = document.getElementById("api-key-input");
const apiKeySubmit = document.getElementById("api-key-submit");
const apiKeyStatus = document.getElementById("api-key-status");
const apiKeyForm = document.getElementById("api-key-form");

const STREAM_DATA = false;
let submitDisabled = false;
let apiKey = null;

// Check for stored API key
function checkApiKey() {
  const storedKey = localStorage.getItem('anthropicApiKey');
  if (storedKey) {
    apiKey = storedKey;
    apiKeyStatus.textContent = "API key loaded from storage";
    apiKeyStatus.className = "api-key-status key-success";
    apiKeyInput.value = "••••••••••••••••••••••••••";
  }
}

// Save API key
function saveApiKey() {
  const enteredKey = apiKeyInput.value.trim();
  if (!enteredKey) {
    apiKeyStatus.textContent = "Please enter a valid API key";
    apiKeyStatus.className = "api-key-status key-error";
    return;
  }
  
  // Simple validation - check if it looks like an Anthropic key
  if (!enteredKey.startsWith('sk-ant-')) {
    apiKeyStatus.textContent = "API key should start with sk-ant-";
    apiKeyStatus.className = "api-key-status key-error";
    return;
  }
  
  // Save the key and update UI
  apiKey = enteredKey;
  localStorage.setItem('anthropicApiKey', apiKey);
  apiKeyStatus.textContent = "API key saved successfully";
  apiKeyStatus.className = "api-key-status key-success";
  apiKeyInput.value = "••••••••••••••••••••••••••";
}

function updateMessages() {
  messagesHolder.innerHTML = "";
  messages.forEach((message) => {
    const messageElement = document.createElement("div");
    messageElement.className = `message ${message.role}`;
    
    if (message.isLoading) {
      messageElement.innerHTML = `
        <div class="loading-message">
          <div class="loading-spinner"></div>
          <p>${message.content}</p>
        </div>
      `;
    } else if (message.role === "assistant" && message.content.trim().startsWith("{") && message.content.trim().endsWith("}")) {
      try {
        // Validate it's proper JSON
        const jsonObj = JSON.parse(message.content);
        
        // Create a formatted display
        messageElement.innerHTML = `
          <div class="json-response">
            <div class="json-header">
              <span>Medical Simulation Scenario JSON</span>
              <sl-button size="small" class="copy-json-btn">Copy JSON</sl-button>
              <sl-button size="small" class="download-json-btn">Download</sl-button>
            </div>
            <pre class="json-content">${JSON.stringify(jsonObj, null, 2)}</pre>
          </div>
        `;
      } catch (e) {
        // Not valid JSON, display as regular text
        messageElement.innerText = message.content;
      }
    } else {
      // Regular message
      messageElement.innerText = message.content;
    }
    
    messagesHolder.appendChild(messageElement);
  });
  
  // Add event listeners to copy buttons
  document.querySelectorAll('.copy-json-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const jsonText = e.target.closest('.json-response').querySelector('.json-content').textContent;
      navigator.clipboard.writeText(jsonText).then(() => {
        showError("JSON copied to clipboard!", "success", 3000);
      });
    });
  });
  
  // Add event listeners to download buttons
  document.querySelectorAll('.download-json-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const jsonText = e.target.closest('.json-response').querySelector('.json-content').textContent;
      try {
        const jsonObj = JSON.parse(jsonText);
        const scenarioTitle = jsonObj["Sim Title"] || "medical-scenario";
        const filename = scenarioTitle.toLowerCase().replace(/\s+/g, '-') + '.json';
        downloadJson(jsonText, filename);
      } catch (e) {
        downloadJson(jsonText, 'medical-scenario.json');
      }
    });
  });

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function submitMessage() {
  if (submitDisabled) {
    return;
  }
  
  // Check if API key is available
  if (!apiKey) {
    showError("Please enter your Anthropic API key first");
    apiKeyInput.focus();
    return;
  }
  
  submitDisabled = true;
  submitButton.disabled = submitDisabled;
  const message = textInput.value;
  if (message) {
    messages.push({
      role: "user",
      content: message,
    });
    textInput.value = "";
    updateMessages();

    await requestAPI(messages);
  }
  submitDisabled = false;
  submitButton.disabled = submitDisabled;
}

async function requestAPI(messages) {
  try {
    // Check if API key is available
    if (!apiKey) {
      showError("Please enter your Anthropic API key first");
      apiKeyInput.focus();
      return;
    }
    
    // Show loading indicator
    const loadingMessage = {
      role: "assistant",
      content: "Generating response...",
      isLoading: true
    };
    messages.push(loadingMessage);
    updateMessages();

    // Check if this is a scenario request
    const latestMessage = messages[messages.length - 1].content.toLowerCase();
    const isScenarioRequest = 
      latestMessage.includes("scenario") || 
      latestMessage.includes("simulation") || 
      latestMessage.includes("generate a") || 
      latestMessage.includes("create a");
    
    // Use specific system prompt for scenario generation
    let systemPrompt = "You are a helpful assistant that specializes in healthcare education.";
    
    if (isScenarioRequest) {
      systemPrompt = `You are a clinical instructional designer focused on creating medical simulation scenarios for postgraduate hospital training. You specialize in scenarios where a patient's condition deteriorates, requiring emergency management.

When creating a scenario:
1. Follow the exact JSON structure provided below
2. Include realistic vital signs that show appropriate progression
3. Ensure all medical details are clinically accurate
4. The only part you may edit is the resource section. You will only include resources (lab tests, imaging) that are clinically relevant. If you decide a resource is clinically relevant you will fill and include it in it's entirety. You are only permitted to remove irrelevant resources, not to edit any resources relevant or otherwise. 
5. Provide detailed technician prompts for simulation delivery
6. Create appropriate expected actions for participants
7. Include clear debriefing points focused on learning objectives

ALWAYS return your response as a complete valid JSON document that follows this exact structure:

{
 "Type": "Scenario",
"Sim Title":"",
"List of Intended Participants":[],

"Purpose":"",
"Scenario Overview":"",
"Learning Objectives":[],
"Required Simulation Tools":[],


	"Actor/patient info":{
"Name":"",
"URN":"",
"Age":"",
"Address":"",
"Phone":"",
"Date of Birth":"",
"Height":"",
"Weight":"",
"Gender":"",
"Occupation":"",
"Location":"",
"Marital Status":"",
"Support System":"",
"Lifestyle":"",
"Medical History":[],
"Home Medications":[],
"Recent Procedure/s":[],
"Current Concerns":[],
"Personality and Demeanor":"",
"General Demeanor":"",
"Communication Style":"",
"Emotional State":"",
"Current Scenario Context":"",
"Possible Questions from Participants":"",
"What to emphasize":"",
"How to respond to Care":""
	},
 


	"stages":{
		"Stage 1":{
			"stage description":"",
			"vital signs":{
				"HR":"/m",
				"Rhythm":"",
				"SBP/DBP":"",
				"(MAP)":"",
				"SpO2":"%",
				"RR":"/m",
				"Temp":"°C",
				"GCS":"T(E V M)",
				"BGL": "mmol/L"
					},
			"technician prompts":[],
			"expected participant actions":[]
		},
		"Stage 2":{
			"stage description":"",
			"vital signs":{
				"HR":"/m",
				"Rhythm":"",
				"SBP/DBP":"",
				"(MAP)":"",
				"SpO2":"%",
				"RR":"/m",
				"Temp":"°C",
				"GCS":"T(E V M)",
				"BGL": "mmol/L"
					},
			"technician prompts":[],
			"expected participant actions":[]
		},
		"Stage 3":{
			"stage description":"",
			"vital signs":{
				"HR":"/m",
				"Rhythm":"",
				"SBP/DBP":"",
				"(MAP)":"",
				"SpO2":"%",
				"RR":"/m",
				"Temp":"°C",
				"GCS":"T(E V M)",
				"BGL": "mmol/L"
					},
			"technician prompts":[],
			"expected participant actions":[]
		},
			},


"Debriefing Points":[],


"Handover":{

	"Context":"",
	"Situation": "",
	"Background":"",
	"Assessment":"",
	"Recommendation": ""
	},

"resources":{

"ABG":{
  "Type": "ABG",
  "Scenario Stage": "",
  "URN": "",
  "First Name": "",
  "Surname:": "",
  "DOB": "",
  "Temperature": {
    "value": "",
    "low": "",
    "high": "",
    "units": "°C"
  },
  "pH": {
    "value": "",
    "low": "7.35",
    "high": "7.45",
    "units": ""
  },
  "pCO2": {
    "value": "",
    "low": "35",
    "high": "45",
    "units": "mmHg"
  },
  "pO2": {
    "value": "",
    "low": "75",
    "high": "100",
    "units": "mmHg"
  },
  "cHCO3-(P)c": {
    "value": "",
    "low": "22",
    "high": "28",
    "units": "mmol/L"
  },
  "cBase(B)c": {
    "value": "",
    "low": "-2",
    "high": "2",
    "units": "mmol/L"
  },
  "ctHb": {
    "value": "",
    "low": "12",
    "high": "16",
    "units": "g/dL"
  },
  "sO2": {
    "value": "",
    "low": "95",
    "high": "100",
    "units": "%"
  },
  "FO2Hb": {
    "value": "",
    "low": "0",
    "high": "100",
    "units": "%"
  },
  "FHHb": {
    "value": "",
    "low": "0",
    "high": "10",
    "units": "%"
  },
  "FmetHb": {
    "value": "",
    "low": "0",
    "high": "1",
    "units": "%"
  },
  "cK+": {
    "value": "",
    "low": "3.5",
    "high": "5.0",
    "units": "mmol/L"
  },
  "cNa+": {
    "value": "",
    "low": "135",
    "high": "145",
    "units": "mmol/L"
  },
  "cCa2+": {
    "value": "",
    "low": "1.1",
    "high": "1.3",
    "units": "mmol/L"
  },
  "cCl-": {
    "value": "",
    "low": "98",
    "high": "106",
    "units": "mmol/L"
  },
  "cGlu": {
    "value": "",
    "low": "3.9",
    "high": "5.5",
    "units": "mmol/L"
  },
  "cLac": {
    "value": "",
    "low": "0.5",
    "high": "2.2",
    "units": "mmol/L"
  }
},

"blood culture":{
  "Type": "blood culture",
  "Scenario Stage": "",
  "Time": "",
  "URN": "",
  "First Name": "",
  "Surname": "",
  "DOB": "",
  "Aerobic Blood Culture": {
    "value": "",
    "low": "0",
    "high": "1",
    "units": "positive/negative"
  },
  "Anaerobic Blood Culture": {
    "value": "",
    "low": "0",
    "high": "1",
    "units": "positive/negative"
  },
  "Organism Identified": {
    "value": "",
    "low": "",
    "high": "",
    "units": "species"
  },
  "Antibiotic Susceptibility": {
    "value": "",
    "low": "",
    "high": "",
    "units": "resistant/sensitive"
  },
  "Time to Positivity": {
    "value": "",
    "low": "1",
    "high": "5",
    "units": "days"
  }
},
"cardiac enzymes":{
  "Type": "cardiac enzymes",
  "Scenario Stage": "",
  "Time": "",
  "URN": "",
  "First Name": "",
  "Surname": "",
  "DOB": "",
  "Troponin I": {
    "value": "",
    "low": "0.0",
    "high": "0.04",
    "units": "µg/L"
  },
  "Troponin T": {
    "value": "",
    "low": "0.0",
    "high": "0.01",
    "units": "µg/L"
  },
  "CK-MB": {
    "value": "",
    "low": "0",
    "high": "5",
    "units": "U/L"
  },
  "Creatine Kinase (CK)": {
    "value": "",
    "low": "30",
    "high": "200",
    "units": "U/L"
  },
  "Myoglobin": {
    "value": "",
    "low": "0",
    "high": "70",
    "units": "µg/L"
  },
  "LDH": {
    "value": "",
    "low": "125",
    "high": "243",
    "units": "U/L"
  },
  "BNP": {
    "value": "",
    "low": "0",
    "high": "100",
    "units": "pg/mL"
  },
  "ANP": {
    "value": "",
    "low": "0",
    "high": "30",
    "units": "pg/mL"
  },
  "C-Reactive Protein (CRP)": {
    "value": "",
    "low": "0",
    "high": "5",
    "units": "mg/L"
  }
},

"biochemistry":{
  "Type": "biochemistry",
  "Scenario Stage": "",
  "Time": "",
  "URN": "",
  "First Name": "",
  "Surname": "",
  "DOB": "",
  "Sodium": {
    "value": "",
    "low": "135",
    "high": "145",
    "units": "mmol/L"
  },
  "Potassium": {
    "value": "",
    "low": "3.5",
    "high": "5.0",
    "units": "mmol/L"
  },
  "Chloride": {
    "value": "",
    "low": "98",
    "high": "106",
    "units": "mmol/L"
  },
  "Bicarbonate": {
    "value": "",
    "low": "22",
    "high": "28",
    "units": "mmol/L"
  },
  "Urea": {
    "value": "",
    "low": "2.5",
    "high": "7.5",
    "units": "mmol/L"
  },
  "Creat. (IDMS)": {
    "value": "",
    "low": "60",
    "high": "110",
    "units": "µmol/L"
  },
  "eGFR": {
    "value": "",
    "low": "90",
    "high": "120",
    "units": "mL/min/1.73m²"
  },
  "Anion Gap": {
    "value": "",
    "low": "8",
    "high": "16",
    "units": "mmol/L"
  },
  "Lactate": {
    "value": "",
    "low": "0.5",
    "high": "2.2",
    "units": "mmol/L"
  },
  "CRP": {
    "value": "",
    "low": "0",
    "high": "5",
    "units": "mg/L"
  },
  "Lipase": {
    "value": "",
    "low": "10",
    "high": "140",
    "units": "U/L"
  },
  "Total protein": {
    "value": "",
    "low": "60",
    "high": "80",
    "units": "g/L"
  },
  "Albumin": {
    "value": "",
    "low": "35",
    "high": "50",
    "units": "g/L"
  },
  "AST": {
    "value": "",
    "low": "10",
    "high": "40",
    "units": "U/L"
  },
  "ALT": {
    "value": "",
    "low": "7",
    "high": "56",
    "units": "U/L"
  },
  "GGT": {
    "value": "",
    "low": "10",
    "high": "40",
    "units": "U/L"
  },
  "ALP": {
    "value": "",
    "low": "30",
    "high": "120",
    "units": "U/L"
  },
  "Bilirubin": {
    "value": "",
    "low": "5",
    "high": "21",
    "units": "µmol/L"
  },
  "Calcium": {
    "value": "",
    "low": "2.1",
    "high": "2.6",
    "units": "mmol/L"
  },
  "Calcium Corr": {
    "value": "",
    "low": "2.1",
    "high": "2.6",
    "units": "mmol/L"
  },
  "Phosphate": {
    "value": "",
    "low": "0.8",
    "high": "1.5",
    "units": "mmol/L"
  },
  "Magnesium": {
    "value": "",
    "low": "0.7",
    "high": "1.0",
    "units": "mmol/L"
  },
  "Urate": {
    "value": "",
    "low": "150",
    "high": "420",
    "units": "µmol/L"
  }
},
"coagulation":{
  "Type": "coagulation",
  "Scenario Stage": "",
  "Time": "",
  "URN": "",
  "First Name": "",
  "Surname": "",
  "DOB": "",
  "Prothrombin Time (PT)": {
    "value": "",
    "low": "11",
    "high": "15",
    "units": "seconds"
  },
  "International Normalized Ratio (INR)": {
    "value": "",
    "low": "0.9",
    "high": "1.1",
    "units": "unitless"
  },
  "Activated Partial Thromboplastin Time (aPTT)": {
    "value": "",
    "low": "28",
    "high": "35",
    "units": "seconds"
  },
  "Fibrinogen": {
    "value": "",
    "low": "2.0",
    "high": "4.0",
    "units": "g/L"
  },
  "D-dimer": {
    "value": "",
    "low": "0",
    "high": "0.5",
    "units": "mg/L"
  },
  "Thrombin Time (TT)": {
    "value": "",
    "low": "12",
    "high": "16",
    "units": "seconds"
  },
  "Platelet Count": {
    "value": "",
    "low": "150",
    "high": "400",
    "units": "x10^9/L"
  },
  "Anti-Thrombin III": {
    "value": "",
    "low": "80",
    "high": "120",
    "units": "percent (%)"
  },
  "Protein C": {
    "value": "",
    "low": "70",
    "high": "140",
    "units": "percent (%)"
  },
  "Protein S": {
    "value": "",
    "low": "60",
    "high": "130",
    "units": "percent (%)"
  }
},
"culture":{
  "Type": "culture",
  "Scenario Stage": "",
  "Time": "",
  "URN": "",
  "First Name": "",
  "Surname": "",
  "DOB": "",
  "Culture Type": {
    "value": "",
    "low": "",
    "high": "",
    "units": "type (e.g., urine, wound, sputum)"
  },
  "Culture Result": {
    "value": "",
    "low": "0",
    "high": "1",
    "units": "positive/negative"
  },
  "Organism Identified": {
    "value": "",
    "low": "",
    "high": "",
    "units": "species"
  },
  "Antibiotic Susceptibility": {
    "value": "",
    "low": "",
    "high": "",
    "units": "resistant/sensitive"
  },
  "Time to Positivity": {
    "value": "",
    "low": "1",
    "high": "5",
    "units": "days"
  }
},

"haematology":{
  "Type": "haematology",
  "Scenario Stage": "",
  "Time": "",
  "URN": "",
  "First Name": "",
  "Surname": "",
  "DOB": "",
  "Haemoglobin": {
    "value": "",
    "low": "120",
    "high": "160",
    "units": "g/L"
  },
  "RBC": {
    "value": "",
    "low": "4.0",
    "high": "5.5",
    "units": "x10^12/L"
  },
  "PCV": {
    "value": "",
    "low": "0.40",
    "high": "0.54",
    "units": "L/L"
  },
  "MCV": {
    "value": "",
    "low": "80",
    "high": "100",
    "units": "fL"
  },
  "MCH": {
    "value": "",
    "low": "27",
    "high": "34",
    "units": "pg"
  },
  "RDW": {
    "value": "",
    "low": "11.5",
    "high": "14.5",
    "units": "%"
  },
  "WCC": {
    "value": "",
    "low": "4.0",
    "high": "11.0",
    "units": "x10^9/L"
  },
  "Neutrophils": {
    "value": "",
    "low": "2.0",
    "high": "7.5",
    "units": "x10^9/L"
  },
  "Lymphocytes": {
    "value": "",
    "low": "1.0",
    "high": "4.0",
    "units": "x10^9/L"
  },
  "Monocytes": {
    "value": "",
    "low": "0.2",
    "high": "1.0",
    "units": "x10^9/L"
  },
  "Eosinophils": {
    "value": "",
    "low": "0.0",
    "high": "0.5",
    "units": "x10^9/L"
  },
  "Basophils": {
    "value": "",
    "low": "0.0",
    "high": "0.1",
    "units": "x10^9/L"
  },
  "Platelets": {
    "value": "",
    "low": "150",
    "high": "400",
    "units": "x10^9/L"
  }
},


"tox screen":{
  "Type": "tox screen",
  "Scenario Stage": "",
  "Time": "",
  "URN": "",
  "First Name": "",
  "Surname": "",
  "DOB": "",
  "Alcohol": {
    "value": "",
    "low": "0",
    "high": "0.08",
    "units": "g/dL"
  },
  "Amphetamines": {
    "value": "",
    "low": "0",
    "high": "500",
    "units": "ng/mL"
  },
  "Benzodiazepines": {
    "value": "",
    "low": "0",
    "high": "200",
    "units": "ng/mL"
  },
  "Cannabis (THC)": {
    "value": "",
    "low": "0",
    "high": "50",
    "units": "ng/mL"
  },
  "Cocaine": {
    "value": "",
    "low": "0",
    "high": "300",
    "units": "ng/mL"
  },
  "Opiates": {
    "value": "",
    "low": "0",
    "high": "200",
    "units": "ng/mL"
  },
  "Barbiturates": {
    "value": "",
    "low": "0",
    "high": "100",
    "units": "ng/mL"
  },
  "Phencyclidine (PCP)": {
    "value": "",
    "low": "0",
    "high": "25",
    "units": "ng/mL"
  },
  "Methadone": {
    "value": "",
    "low": "0",
    "high": "300",
    "units": "ng/mL"
  },
  "Propoxyphene": {
    "value": "",
    "low": "0",
    "high": "300",
    "units": "ng/mL"
  },
  "Tricyclic Antidepressants (TCA)": {
    "value": "",
    "low": "0",
    "high": "500",
    "units": "ng/mL"
  },
  "Ethanol (EtOH)": {
    "value": "",
    "low": "0",
    "high": "0.08",
    "units": "g/dL"
  },
  "Salicylates": {
    "value": "",
    "low": "0",
    "high": "300",
    "units": "mg/dL"
  },
  "Acetaminophen (Paracetamol)": {
    "value": "",
    "low": "0",
    "high": "200",
    "units": "µg/mL"
  },
  "Carbon Monoxide (COHb)": {
    "value": "",
    "low": "0",
    "high": "5",
    "units": "%"
  }
},

 
"VBG":{
  "Type": "VBG",
  "Scenario Stage": "",
  "URN": "",
  "First Name": "",
  "Surname:": "",
  "DOB": "",
  "Temperature": {
    "value": "",
    "low": "",
    "high": "",
    "units": "°C"
  },
  "pH": {
    "value": "",
    "low": "7.31",
    "high": "7.41",
    "units": "unitless"
  },
  "pCO2": {
    "value": "",
    "low": "41",
    "high": "51",
    "units": "mmHg"
  },
  "pO2": {
    "value": "",
    "low": "35",
    "high": "45",
    "units": "mmHg"
  },
  "cHCO3-(P)c": {
    "value": "",
    "low": "22",
    "high": "28",
    "units": "mmol/L"
  },
  "cBase(B)c": {
    "value": "",
    "low": "-2",
    "high": "2",
    "units": "mmol/L"
  },
  "ctHb": {
    "value": "",
    "low": "12",
    "high": "16",
    "units": "g/dL"
  },
  "sO2": {
    "value": "",
    "low": "60",
    "high": "85",
    "units": "%"
  },
  "FO2Hb": {
    "value": "",
    "low": "0",
    "high": "100",
    "units": "%"
  },
  "FHHb": {
    "value": "",
    "low": "0",
    "high": "10",
    "units": "%"
  },
  "FmetHb": {
    "value": "",
    "low": "0",
    "high": "1",
    "units": "%"
  },
  "cK+": {
    "value": "",
    "low": "3.5",
    "high": "5.0",
    "units": "mmol/L"
  },
  "cNa+": {
    "value": "",
    "low": "135",
    "high": "145",
    "units": "mmol/L"
  },
  "cCa2+": {
    "value": "",
    "low": "1.1",
    "high": "1.3",
    "units": "mmol/L"
  },
  "cCl-": {
    "value": "",
    "low": "98",
    "high": "106",
    "units": "mmol/L"
  },
  "cGlu": {
    "value": "",
    "low": "3.9",
    "high": "5.5",
    "units": "mmol/L"
  },
  "cLac": {
    "value": "",
    "low": "0.5",
    "high": "2.2",
    "units": "mmol/L"
  }
}


		}

}


`;
    }
    
    // Use our proxy function instead of direct API call
    const response = await fetch("/.netlify/functions/anthropic-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey: apiKey,
        model: isScenarioRequest ? "claude-3-opus-20240229" : "claude-3-haiku-20240307",
        max_tokens: 4000,
        systemPrompt: systemPrompt,
        messages: messages.filter(m => !m.isLoading).map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });
    
    // Remove loading message
    messages.pop();
    
    if (!response.ok) {
      console.error("API error:", response.status);
      let errorMessage = `Error from API: ${response.status}`;
      
      try {
        const errorData = await response.json();
        console.error("Error details:", errorData);
        if (errorData.error && errorData.error.message) {
          errorMessage += ` - ${errorData.error.message}`;
        }
      } catch (e) {
        // Couldn't parse error as JSON
      }
      
      // If we got a 401 unauthorized (API key invalid)
      if (response.status === 401 || response.status === 400) {
        // Clear stored API key
        localStorage.removeItem('anthropicApiKey');
        apiKey = null;
        apiKeyStatus.textContent = "Invalid API key. Please try again.";
        apiKeyStatus.className = "api-key-status key-error";
        apiKeyInput.value = "";
        apiKeyInput.focus();
      }
      
      showError(errorMessage);
      return;
    }
    
    const data = await response.json();
    
    const message = {
      role: "assistant",
      content: data.content[0].text
    };
    
    messages.push(message);
    updateMessages();
  } catch (error) {
    console.error("Error in requestAPI:", error);
    
    // Remove loading message if it exists
    if (messages.length > 0 && messages[messages.length - 1].isLoading) {
      messages.pop();
    }
    
    showError("An error occurred while processing your request: " + error.message);
  }
}
function showError(message, variant = "danger", duration = 5000) {
  const alert = Object.assign(document.createElement("sl-alert"), {
    variant,
    closable: true,
    duration: duration,
    innerHTML: `
        <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
        ${message}
      `,
  });

  document.body.append(alert);
  customElements.whenDefined("sl-alert").then(() => {
    alert.toast();
  });
}

function downloadJson(text, filename) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'scenario.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function init() {
  // Check for saved API key
  checkApiKey();
  
  // API key event listeners
  apiKeySubmit.addEventListener("click", saveApiKey);
  apiKeyInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      saveApiKey();
    }
  });
  
  // Chat handlers
  textInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitMessage();
    }
  });

  submitButton.addEventListener("click", () => {
    submitMessage();
  });
}

init();