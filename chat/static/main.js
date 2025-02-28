const messages = [];

const messagesContainer = document.querySelector(".messages-container");
const messagesHolder = document.getElementById("messages");
const textInput = document.getElementById("text-input");
const submitButton = document.getElementById("submit-btn");

// Scenario generator elements
const scenarioTypeSelect = document.getElementById("scenario-type");
const customScenarioContainer = document.getElementById("custom-scenario-container");
const customScenarioInput = document.getElementById("custom-scenario");
const patientDetailsInput = document.getElementById("patient-details");
const generateButton = document.getElementById("generate-btn");
const scenarioOutputContainer = document.getElementById("scenario-output-container");
const scenarioOutput = document.getElementById("scenario-output");
const copyJsonButton = document.getElementById("copy-json-btn");
const downloadJsonButton = document.getElementById("download-json-btn");

const STREAM_DATA = false;

let submitDisabled = false;

// Add mapping function to convert hyphenated values to display names
function getScenarioDisplayName(value) {
  const scenarioMap = {
    'hfnc-to-bipap': 'HFNC to BIPAP Escalation',
    'cardiac-arrest': 'Cardiac Arrest',
    'septic-shock': 'Septic Shock',
    'anaphylaxis': 'Anaphylaxis'
  };
  return scenarioMap[value] || value;
}

function updateMessages() {
  messagesHolder.innerHTML = "";
  messages.forEach((message) => {
    const messageElement = document.createElement("div");
    messageElement.className = `message ${message.role}`;
    messageElement.innerText = message.content;
    messagesHolder.appendChild(messageElement);
  });

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function submitMessage() {
  if (submitDisabled) {
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

async function generateScenario() {
  if (submitDisabled) {
    return;
  }
  
  submitDisabled = true;
  generateButton.disabled = true;
  
  // Get scenario type with proper display name conversion
  let scenarioTypeValue = scenarioTypeSelect.value;
  let scenarioType = getScenarioDisplayName(scenarioTypeValue);
  
  if (scenarioTypeValue === 'custom') {
    scenarioType = customScenarioInput.value;
  }
  
  if (!scenarioType) {
    showError("Please select or specify a scenario type");
    submitDisabled = false;
    generateButton.disabled = false;
    return;
  }
  
  // Get patient details
  const patientDetails = patientDetailsInput.value;
  
  // Show loading state
  generateButton.innerHTML = '<sl-spinner></sl-spinner> Generating...';
  
  try {
    const req = await fetch("/.netlify/functions/anthropic", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        scenarioType, 
        patientDetails: patientDetails ? patientDetails : null 
      }),
    });
    
    if (req.ok) {
      const data = await req.json();
      
      // Try to extract JSON from the response
      let jsonOutput = '';
      try {
        // Look for JSON in the response
        const content = data.content[0].text;
        const jsonStartIndex = content.indexOf('{');
        const jsonEndIndex = content.lastIndexOf('}') + 1;
        
        if (jsonStartIndex >= 0 && jsonEndIndex > 0) {
          jsonOutput = content.substring(jsonStartIndex, jsonEndIndex);
          
          // Validate and pretty-print the JSON
          const parsedJson = JSON.parse(jsonOutput);
          jsonOutput = JSON.stringify(parsedJson, null, 2);
        } else {
          jsonOutput = content;
        }
      } catch (e) {
        // If JSON parsing fails, just use the raw output
        jsonOutput = data.content[0].text;
      }
      
      // Display the output
      scenarioOutput.value = jsonOutput;
      scenarioOutputContainer.classList.remove('hidden');
    } else {
      showError("An error occurred while generating the scenario");
    }
  } catch (error) {
    console.error("Error:", error);
    showError("An error occurred while generating the scenario");
  } finally {
    submitDisabled = false;
    generateButton.disabled = false;
    generateButton.innerHTML = 'Generate Scenario';
  }
}

async function requestStream(messages) {
  const stream = await fetch("/.netlify/functions/anthropic-stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  const text = await stream.text();
  const parts = text.split(">>");

  const newMessage = {
    role: "assistant",
    content: "",
  };

  messages.push(newMessage);
  const activeMessage = messages[messages.length - 1];

  for (const part of parts) {
    if (part) {
      const json = JSON.parse(part);
      const content = json.message;
      if (content && content !== "undefined") {
        activeMessage.content += content;
      }
    }
  }

  updateMessages();
}

async function requestAPI(messages) {
  if (STREAM_DATA) {
    return await requestStream(messages);
  }
  const req = await fetch("/.netlify/functions/anthropic", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });
  if (req.ok) {
    const data = await req.json();

    const message = {
      role: data.role,
      content: data.content[0].text,
    };

    messages.push(message);
    updateMessages();
  } else {
    console.error("Error:", req.status, req.type, req.body);
    showError("An error occurred while sending the message.");
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

// Utility functions for the scenario generator
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showError("Copied to clipboard!", "success", 3000);
  }, () => {
    showError("Failed to copy to clipboard");
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
  
  // Scenario generator handlers
  scenarioTypeSelect.addEventListener("change", () => {
    if (scenarioTypeSelect.value === 'custom') {
      customScenarioContainer.classList.remove('hidden');
    } else {
      customScenarioContainer.classList.add('hidden');
    }
  });
  
  generateButton.addEventListener("click", () => {
    generateScenario();
  });
  
  copyJsonButton.addEventListener("click", () => {
    copyToClipboard(scenarioOutput.value);
  });
  
  downloadJsonButton.addEventListener("click", () => {
    const scenarioType = scenarioTypeSelect.value === 'custom' 
      ? customScenarioInput.value.replace(/\s+/g, '-').toLowerCase() 
      : scenarioTypeSelect.value.replace(/\s+/g, '-').toLowerCase();
      
    downloadJson(scenarioOutput.value, `${scenarioType}-scenario.json`);
  });
}

init();