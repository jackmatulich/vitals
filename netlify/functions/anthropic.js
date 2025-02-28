const { Anthropic } = require('@anthropic-ai/sdk');

exports.handler = async (event, context) => {
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
    
    // Create API request
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",  
      system: systemPrompt,
      messages: messages,
      max_tokens: 4000,
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: response.role,
        content: response.content,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred with the API request' }),
    };
  }
};