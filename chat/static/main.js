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
    // Check if this is a scenario request
    const latestMessage = messages[messages.length - 1].content.toLowerCase();
    const isScenarioRequest = 
      latestMessage.includes("scenario") || 
      latestMessage.includes("simulation") || 
      latestMessage.includes("generate a") || 
      latestMessage.includes("create a");
    
    // For scenario requests, use the chunked approach
    if (isScenarioRequest) {
      await generateScenarioInChunks(messages);
      return;
    }
    
    // Normal request for non-scenario questions
    const loadingMessage = {
      role: "assistant",
      content: "Generating response...",
      isLoading: true
    };
    messages.push(loadingMessage);
    updateMessages();
    
    // Use regular anthropic function for non-scenarios
    const response = await fetch("/.netlify/functions/anthropic", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages.filter(m => !m.isLoading).map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    });
    
    // Remove the loading message
    messages.pop();
    
    if (!response.ok) {
      console.error("API error:", response.status);
      showError(`Error from API: ${response.status}`);
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










async function generateScenarioInChunks(messages) {
  // Show loading message
  const loadingMessage = {
    role: "assistant",
    content: "Generating medical simulation scenario... (1/4: Basic structure)",
    isLoading: true
  };
  messages.push(loadingMessage);
  updateMessages();
  
  try {
    // Generate the scenario in 4 parts
    let scenarioParts = {};
    
    // Helper function to safely parse JSON
    function safeJsonParse(text) {
      try {
        // First try direct parsing
        return JSON.parse(text);
      } catch (e) {
        console.error("Initial JSON parse error:", e);
        
        // Try to clean the JSON string before parsing
        try {
          // Find the first '{' and last '}'
          const startIdx = text.indexOf('{');
          const endIdx = text.lastIndexOf('}') + 1;
          
          if (startIdx >= 0 && endIdx > 0) {
            const jsonText = text.substring(startIdx, endIdx);
            return JSON.parse(jsonText);
          }
        } catch (e2) {
          console.error("Secondary JSON parse error:", e2);
        }
        
        // If all parsing attempts fail, return a minimal object
        console.error("Could not parse JSON, using fallback");
        return {};
      }
    }
    
    // Part 1: Basic structure and patient info
    loadingMessage.content = "Generating medical simulation scenario... (1/4: Basic structure)";
    updateMessages();
    
    const part1Response = await fetch("/.netlify/functions/anthropic-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.filter(m => !m.isLoading).map(m => ({
          role: m.role, content: m.content
        })),
        part: 1
      })
    });
    
    if (!part1Response.ok) {
      throw new Error(`Failed to generate part 1: ${part1Response.status}`);
    }
    
    const part1Data = await part1Response.json();
    const part1Content = part1Data.content[0].text;
    scenarioParts.part1 = safeJsonParse(part1Content);
    
    // Part 2: Stages
    loadingMessage.content = "Generating medical simulation scenario... (2/4: Stages)";
    updateMessages();
    
    const part2Response = await fetch("/.netlify/functions/anthropic-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          ...messages.filter(m => !m.isLoading).map(m => ({
            role: m.role, content: m.content
          })),
          { role: "assistant", content: JSON.stringify(scenarioParts.part1) }
        ],
        part: 2
      })
    });
    
    if (!part2Response.ok) {
      throw new Error(`Failed to generate part 2: ${part2Response.status}`);
    }
    
    const part2Data = await part2Response.json();
    const part2Content = part2Data.content[0].text;
    scenarioParts.part2 = safeJsonParse(part2Content);
    
    // Part 3: Debriefing and handover
    loadingMessage.content = "Generating medical simulation scenario... (3/4: Debriefing)";
    updateMessages();
    
    const part3Response = await fetch("/.netlify/functions/anthropic-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          ...messages.filter(m => !m.isLoading).map(m => ({
            role: m.role, content: m.content
          })),
          { 
            role: "assistant", 
            content: JSON.stringify(scenarioParts.part1) + "\n" + JSON.stringify(scenarioParts.part2)
          }
        ],
        part: 3
      })
    });
    
    if (!part3Response.ok) {
      throw new Error(`Failed to generate part 3: ${part3Response.status}`);
    }
    
    const part3Data = await part3Response.json();
    const part3Content = part3Data.content[0].text;
    scenarioParts.part3 = safeJsonParse(part3Content);
    
    // Part 4: Resources
    loadingMessage.content = "Generating medical simulation scenario... (4/4: Resources)";
    updateMessages();
    
    const part4Response = await fetch("/.netlify/functions/anthropic-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          ...messages.filter(m => !m.isLoading).map(m => ({
            role: m.role, content: m.content
          })),
          { 
            role: "assistant", 
            content: JSON.stringify(scenarioParts.part1) + "\n" + 
                     JSON.stringify(scenarioParts.part2) + "\n" + 
                     JSON.stringify(scenarioParts.part3)
          }
        ],
        part: 4
      })
    });
    
    if (!part4Response.ok) {
      throw new Error(`Failed to generate part 4: ${part4Response.status}`);
    }
    
    const part4Data = await part4Response.json();
    const part4Content = part4Data.content[0].text;
    scenarioParts.part4 = safeJsonParse(part4Content);
    
    // Combine all parts into a single JSON object
    const combinedScenario = {
      ...scenarioParts.part1,
      ...scenarioParts.part2,
      ...scenarioParts.part3,
      ...scenarioParts.part4
    };
    
    // Remove loading message
    messages.pop();
    
    // Add combined scenario as a message
    const scenarioMessage = {
      role: "assistant",
      content: JSON.stringify(combinedScenario, null, 2)
    };
    
    messages.push(scenarioMessage);
    updateMessages();
    
  } catch (error) {
    console.error("Error generating scenario:", error);
    // Remove loading message
    messages.pop();
    showError("Failed to generate scenario: " + error.message);
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