const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  try {
    console.log("Streaming function called");
    
    const { messages } = JSON.parse(event.body);
    
    // Regular system prompt for normal queries
    let systemPrompt = "You are a helpful assistant that specializes in healthcare education.";
    
    // Check if this is a scenario request and use special prompt
    const latestMessage = messages[messages.length - 1].content.toLowerCase();
    if (latestMessage.includes("scenario") || 
        latestMessage.includes("simulation")) {
      systemPrompt = "You are a clinical instructional designer..."; // Your full prompt
    }
    
    // Make request to Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ANTHROPIC_API_KEY,
        'Anthropic-Version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",  
        max_tokens: 4000,
        system: systemPrompt,
        messages: messages
      })
    });
    
    // Get the response data
    const data = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Function execution error' })
    };
  }
};

