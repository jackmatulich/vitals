const messages = [];

const messagesContainer = document.querySelector(".messages-container");
const messagesHolder = document.getElementById("messages");
const textInput = document.getElementById("text-input");
const submitButton = document.getElementById("submit-btn");
const authModal = document.getElementById("auth-modal");
const passwordInput = document.getElementById("password-input");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const authError = document.getElementById("auth-error");

const STREAM_DATA = false;
let submitDisabled = false;
let apiKey = null;

// Check if user is already authenticated
function checkAuthentication() {
  // Check local storage for API key
  const storedKey = localStorage.getItem('apiKey');
  if (storedKey) {
    apiKey = storedKey;
    hideAuthModal();
  } else {
    showAuthModal();
  }
}

// Show authentication modal
function showAuthModal() {
  authModal.classList.remove('hidden');
  passwordInput.focus();
}

// Hide authentication modal
function hideAuthModal() {
  authModal.classList.add('hidden');
}

// Handle authentication submission
async function authenticateUser() {
  console.log("Authentication started");
  const password = passwordInput.value;
  console.log("Password entered:", password ? "Yes (not shown)" : "No");
  
  if (!password) {
    authError.textContent = "Please enter a password";
    return;
  }

  try {
    console.log("Submitting authentication request...");
    authSubmitBtn.disabled = true;
    
    const response = await fetch("/.netlify/functions/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password })
    });

    console.log("Auth response status:", response.status);
    const data = await response.json();
    console.log("Auth response received:", data.success ? "Success" : "Failed");

    if (data.success) {
      // Store API key in local storage
      apiKey = data.apiKey;
      localStorage.setItem('apiKey', apiKey);
      hideAuthModal();
      showError("Authentication successful", "success", 3000);
    } else {
      authError.textContent = data.error || "Authentication failed";
    }
  } catch (error) {
    console.error("Authentication error:", error);
    authError.textContent = "An error occurred during authentication";
  } finally {
    authSubmitBtn.disabled = false;
  }
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
  
  // Check if authenticated
  if (!apiKey) {
    showAuthModal();
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
    // Check if authenticated
    if (!apiKey) {
      showAuthModal();
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
        "X-API-Key": apiKey,
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
      
      // Check if we got a 401 unauthorized (API key invalid)
      if (response.status === 401) {
        // Clear stored API key and show auth modal
        localStorage.removeItem('apiKey');
        apiKey = null;
        showAuthModal();
        showError("API key is invalid or expired. Please authenticate again.");
        return;
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
    
    // Remove loading message if it exists
    if (messages.length > 0 && messages[messages.length - 1].isLoading) {
      messages.pop();
    }
    
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
  // Check authentication on page load
  checkAuthentication();
  
  // Auth event listeners
  authSubmitBtn.addEventListener("click", authenticateUser);
  passwordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      authenticateUser();
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
