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
    // First get the API key from our secure function
    const tokenResponse = await fetch("/.netlify/functions/get-anthropic-token");
    
    if (!tokenResponse.ok) {
      console.error("Failed to get API token");
      showError("Authentication failed. Please try again.");
      return;
    }
    
    const { apiKey, expires } = await tokenResponse.json();
    
    // Validate token hasn't expired
    if (expires && Date.now() > expires) {
      console.error("Token expired");
      showError("Authentication expired. Please refresh the page.");
      return;
    }
    
    debugLog("Got API token, making direct Anthropic request");
    
    // Check if this is a scenario request
    const latestMessage = messages[messages.length - 1].content.toLowerCase();
    const isScenarioRequest = 
      latestMessage.includes("scenario") || 
      latestMessage.includes("simulation") || 
      latestMessage.includes("generate a") || 
      latestMessage.includes("create a");
    
    // Use enhanced system prompt for scenario requests
    let systemPrompt = "You are a helpful assistant that specializes in healthcare education.";
    
    if (isScenarioRequest) {
      systemPrompt = `You are a clinical instructional designer focused on creating medical simulation scenarios for postgraduate hospital training. You specialize in scenarios where a patient's condition deteriorates, requiring emergency management.

When creating a scenario:
1. Follow the exact JSON structure provided below
2. Include realistic vital signs that show appropriate progression
3. Ensure all medical details are clinically accurate
4. Only include resources (lab tests, imaging) that are clinically relevant
5. Provide detailed technician prompts for simulation delivery
6. Create appropriate expected actions for participants
7. Include clear debriefing points focused on learning objectives

ALWAYS return your response as a complete valid JSON document.`;
    }
    
    // Show a loading indicator
    const loadingMessage = {
      role: "assistant",
      content: "Generating response... (this may take a moment for complex scenarios)",
      isLoading: true
    };
    messages.push(loadingMessage);
    updateMessages();
    
    // Make direct request to Anthropic API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "Anthropic-Version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        system: systemPrompt,
        messages: messages.filter(m => !m.isLoading).map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });
    
    // Remove the loading message
    messages.pop();
    
    if (!response.ok) {
      console.error("Anthropic API error:", response.status);
      let errorDetails = "Unknown error";
      try {
        const errorData = await response.text();
        console.error("Error details:", errorData);
        errorDetails = errorData;
      } catch (e) {
        console.error("Could not read error details");
      }
      
      showError(`Error from Anthropic API: ${response.status}`);
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