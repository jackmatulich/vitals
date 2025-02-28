const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Set up headers for streaming
  const responseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const { messages } = JSON.parse(event.body);
    
    // Check if the latest message is requesting a scenario
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

ALWAYS return your response as a complete valid JSON document that follows this exact structure:

{
 "Type": "Scenario",
 "Sim Title":"",
 "List of Intended Participants":[],
 "Purpose":"",
 "Scenario Overview":"",
 "Learning Objectives":[],
 "Required Simulation Tools":[],
 "Actor/patient info":{
   "Name":"",
   "URN":"",
   "Age":"",
   "Address":"",
   "Phone":"",
   "Date of Birth":"",
   "Height":"",
   "Weight":"",
   "Gender":"",
   "Occupation":"",
   "Location":"",
   "Marital Status":"",
   "Support System":"",
   "Lifestyle":"",
   "Medical History":[],
   "Home Medications":[],
   "Recent Procedure/s":[],
   "Current Concerns":[],
   "Personality and Demeanor":"",
   "General Demeanor":"",
   "Communication Style":"",
   "Emotional State":"",
   "Current Scenario Context":"",
   "Possible Questions from Participants":"",
   "What to emphasize":"",
   "How to respond to Care":""
 },
 "stages":{
   "Stage 1":{
     "stage description":"",
     "vital signs":{
       "HR":"/m",
       "Rhythm":"",
       "SBP/DBP":"",
       "(MAP)":"",
       "SpO2":"%",
       "RR":"/m",
       "Temp":"°C",
       "GCS":"T(E V M)",
       "BGL": "mmol/L"
     },
     "technician prompts":[],
     "expected participant actions":[]
   },
   "Stage 2":{
     "stage description":"",
     "vital signs":{},
     "technician prompts":[],
     "expected participant actions":[]
   },
   "Stage 3":{
     "stage description":"",
     "vital signs":{},
     "technician prompts":[],
     "expected participant actions":[]
   }
 },
 "Debriefing Points":[],
 "Handover":{},
 "resources":{}
}

Do not include any explanation text before or after the JSON. Return ONLY the JSON.`;
    }

    // Make streaming request to Anthropic
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.ANTHROPIC_API_KEY,
        'Anthropic-Version': '2023-01-01',
        'Anthropic-Beta': 'messages-2023-12-15'
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        system: systemPrompt,
        messages: messages,
        stream: true
      })
    });

    // Stream the data in chunks
    let streamData = "";
    
    // If response isn't ok, handle error
    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.text();
      console.error("Anthropic API error:", anthropicResponse.status, errorData);
      return {
        statusCode: anthropicResponse.status,
        body: JSON.stringify({ error: `Anthropic API error: ${anthropicResponse.status}`, details: errorData })
      };
    }
    
    // For streaming response, we're going to manually chunk it
    const reader = anthropicResponse.body;
    
    // Process each chunk from the stream
    for await (const chunk of reader) {
      const decodedChunk = new TextDecoder().decode(chunk);
      streamData += decodedChunk;
    }
    
    // Parse the final result to extract content
    const lines = streamData.split('\n');
    let finalMessage = "";
    
    for (const line of lines) {
      if (line.startsWith('data:') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.substring(5));
          if (data.type === 'content_block_delta' && data.delta && data.delta.text) {
            finalMessage += data.delta.text;
          }
        } catch (e) {
          console.error("Error parsing line:", line, e);
        }
      }
    }
    
    // Return the final response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: "assistant",
        content: [{ type: "text", text: finalMessage }]
      })
    };
    
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'An error occurred with the API request',
        message: error.message,
        stack: error.stack
      })
    };
  }
};