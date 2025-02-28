const messages = [];

const messagesContainer = document.querySelector(".messages-container");
const messagesHolder = document.getElementById("messages");
const textInput = document.getElementById("text-input");
const submitButton = document.getElementById("submit-btn");

const STREAM_DATA = false;
let submitDisabled = false;

// For testing - hardcode your API key here or set it as a constant
// In production, you would want to get this securely from a server
const API_KEY = "PASTE_YOUR_API_KEY_HERE";  // ⚠️ WARNING: Only for testing!

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

async function requestAPI(messages) {
  try {
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
4. Only include resources (lab tests, imaging) that are clinically relevant
5. Provide detailed technician prompts for simulation delivery
6. Create appropriate expected actions for participants
7. Include clear debriefing points focused on learning objectives

ALWAYS return your response as a complete valid JSON document.`;
    }
    
    // Make direct request to Anthropic API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        "Anthropic-Version": "2023-06-01"
      },
      body: JSON.stringify({
        model: isScenarioRequest ? "claude-3-opus-20240229" : "claude-3-haiku-20240307",
        max_tokens: 4000,
        system: systemPrompt,
        messages: messages.filter(m => !m.isLoading).map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });
    
    // Remove loading message
    messages.pop();
    
    if (!response.ok) {
      console.error("Anthropic API error:", response.status);
      let errorMessage = `Error from Anthropic API: ${response.status}`;
      
      try {
        const errorData = await response.json();
        console.error("Error details:", errorData);
        if (errorData.error && errorData.error.message) {
          errorMessage += ` - ${errorData.error.message}`;
        }
      } catch (e) {
        // Couldn't parse error as JSON
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