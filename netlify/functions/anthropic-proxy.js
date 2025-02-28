const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    const requestBody = JSON.parse(event.body);
    const { messages, systemPrompt } = requestBody;
    
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
        system: systemPrompt || "You are a helpful assistant.",
        messages: messages
      })
    });
    
    // Get the raw response
    const responseData = await response.json();
    
    // Return the data
    return {
      statusCode: 200,
      body: JSON.stringify(responseData)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to proxy request to Anthropic' })
    };
  }
};