const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    const requestBody = JSON.parse(event.body);
    const { messages, systemPrompt, part } = requestBody;
    
    // Determine which part of the scenario to generate based on the 'part' parameter
    let currentPrompt = systemPrompt || "You are a helpful assistant.";
    
    if (part) {
      if (part === 1) {
        // First part - basic structure and patient info
        currentPrompt = `You are creating part 1 of a medical simulation scenario. Focus ONLY on the basic structure, title, participants, purpose, overview, learning objectives, and patient info. 
DO NOT include stages, debriefing points or resources yet. Keep your response as valid JSON with these top-level keys only:
{
  "Type": "Scenario",
  "Sim Title": "",
  "List of Intended Participants": [],
  "Purpose": "",
  "Scenario Overview": "",
  "Learning Objectives": [],
  "Actor/patient info": {}
}`;
      } else if (part === 2) {
        // Second part - stages
        currentPrompt = `You are creating part 2 of a medical simulation scenario. Focus ONLY on the stages section. Create exactly 3 stages with realistic vital signs, technician prompts, and expected actions.
Keep your response as valid JSON with this structure:
{
  "stages": {
    "Stage 1": {},
    "Stage 2": {},
    "Stage 3": {}
  }
}`;
      } else if (part === 3) {
        // Third part - debriefing and handover
        currentPrompt = `You are creating part 3 of a medical simulation scenario. Focus ONLY on the debriefing points and handover. 
Keep your response as valid JSON with this structure:
{
  "Debriefing Points": [],
  "Handover": {}
}`;
      } else if (part === 4) {
        // Fourth part - resources
        currentPrompt = `You are creating part 4 of a medical simulation scenario. Focus ONLY on creating relevant resources like labs, vital signs readings, etc.
Keep your response as valid JSON with this structure:
{
  "resources": {}
}`;
      }
    }
    
    // Make request to Anthropic API with the appropriate prompt
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ANTHROPIC_API_KEY,
        'Anthropic-Version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307", // Use fastest model to avoid timeout
        max_tokens: 2000, // Lower token limit to speed up response
        system: currentPrompt,
        messages: messages
      })
    });
    
    // Handle API errors
    if (!response.ok) {
      const errorData = await response.json();
      return {
        statusCode: response.status,
        body: JSON.stringify(errorData)
      };
    }
    
    // Get the response data
    const responseData = await response.json();
    
    // Add the part number to the response
    responseData.part = part;
    
    // Return the data
    return {
      statusCode: 200,
      body: JSON.stringify(responseData)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to proxy request to Anthropic', message: error.message })
    };
  }
};