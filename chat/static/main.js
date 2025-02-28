const messages = [];

const messagesContainer = document.querySelector(".messages-container");
const messagesHolder = document.getElementById("messages");
const textInput = document.getElementById("text-input");
const submitButton = document.getElementById("submit-btn");

const STREAM_DATA = false;

let submitDisabled = false;

function debugLog(message, data) {
  console.log(`[DEBUG] ${message}`, data);
}


function updateMessages() {
  messagesHolder.innerHTML = "";
  messages.forEach((message) => {
    const messageElement = document.createElement("div");
    messageElement.className = `message ${message.role}`;
    
    // Check if this is a JSON response from the assistant
    if (message.role === "assistant" && message.content.trim().startsWith("{") && message.content.trim().endsWith("}")) {
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
  try {
    // Detect if this is likely a scenario request
    const latestMessage = messages[messages.length - 1].content.toLowerCase();
    debugLog("Latest message:", latestMessage);
    
    const isScenarioRequest = 
      latestMessage.includes("scenario") || 
      latestMessage.includes("simulation") || 
      latestMessage.includes("generate a") || 
      latestMessage.includes("create a");
    
    // Choose which endpoint to call
    const endpoint = isScenarioRequest 
      ? "/.netlify/functions/anthropic-stream" 
      : "/.netlify/functions/anthropic";
    
    debugLog("Using endpoint:", endpoint);
    
    const req = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });
    
    debugLog("Response status:", req.status);
    
    if (!req.ok) {
      console.error(`Error ${req.status} from endpoint ${endpoint}`);
      try {
        const errorText = await req.text();
        console.error("Error details:", errorText);
      } catch (e) {
        console.error("Could not read error details");
      }
      showError(`Error ${req.status}: Failed to get response`);
      return;
    }
    
    const data = await req.json();
    debugLog("Response data:", data);
    
    const message = {
      role: data.role || "assistant",
      content: data.content?.[0]?.text || JSON.stringify(data, null, 2),
    };
    
    messages.push(message);
    updateMessages();
  } catch (error) {
    console.error("Error in requestAPI:", error);
    showError("An error occurred while processing your request.");
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