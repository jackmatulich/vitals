const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const body = JSON.parse(event.body);
    const { messages, systemPrompt, apiKey } = body;

    // Validate API key
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('sk-ant-')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid API key' })
      };
    }

    // Forward request to Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'Anthropic-Version': '2023-06-01'
      },
      body: JSON.stringify({
        model: body.model || "claude-3-haiku-20240307",
        max_tokens: body.max_tokens || 4000,
        system: systemPrompt || "You are a helpful assistant.",
        messages: messages
      })
    });

    // Get response data
    const responseData = await response.json();

    // Return the Anthropic response
    return {
      statusCode: response.status,
      body: JSON.stringify(responseData)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error', message: error.message })
    };
  }
};