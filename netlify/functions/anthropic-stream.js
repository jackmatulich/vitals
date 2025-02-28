const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    // Log incoming request for debugging
    console.log("Received request for anthropic-stream");
    
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request body' })
      };
    }
    
    const { messages } = requestBody;
    
    if (!messages || !Array.isArray(messages)) {
      console.error("Messages not provided or not an array");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Messages must be provided as an array' })
      };
    }
    
    // Check latest message
    const latestMessage = messages[messages.length - 1].content;
    console.log("Latest message:", latestMessage);
    
    // Create system prompt
    let systemPrompt = "You are a helpful assistant that specializes in healthcare education.";
    
    if (latestMessage.toLowerCase().includes("scenario") || 
        latestMessage.toLowerCase().includes("simulation")) {
      systemPrompt = "You are a clinical instructional designer..."; // Your full prompt here
    }
    
    // Log that we're making the Anthropic API call
    console.log("Making Anthropic API call");
    
    // Make request to Anthropic API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ANTHROPIC_API_KEY,
        'Anthropic-Version': '2023-06-01' // Ensure this is correct version
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229", // Using a faster model for testing
        max_tokens: 4000,
        system: systemPrompt,
        messages: messages
      })
    });
    
    // Log the response status
    console.log("Anthropic API response status:", anthropicResponse.status);
    
    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.text();
      console.error("Error from Anthropic API:", errorData);
      return {
        statusCode: anthropicResponse.status,
        body: JSON.stringify({ 
          error: `Error from Anthropic API: ${anthropicResponse.status}`,
          details: errorData
        })
      };
    }
    
    // Process successful response
    const responseData = await anthropicResponse.json();
    console.log("Successfully received Anthropic API response");
    
    // Return the processed response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responseData)
    };
    
  } catch (error) {
    console.error("Unhandled error in anthropic-stream function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'An error occurred with the API request',
        message: error.message,
        stack: error.stack
      })
    };
  }
};