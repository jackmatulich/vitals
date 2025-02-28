const { Anthropic } = require('@anthropic-ai/sdk');

exports.handler = async (event, context) => {
  try {
    const { messages, scenarioType, patientDetails } = JSON.parse(event.body);
    
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    // Construct the system prompt
    const systemPrompt = `You are a clinical instructional designer focused on creating medical simulation scenarios for postgraduate hospital training. You specialize in scenarios where a patient's condition deteriorates, requiring emergency management.

When creating a scenario:
1. Follow the exact JSON structure provided
2. Include realistic vital signs that show appropriate progression
3. Ensure all medical details are clinically accurate
4. Only include resources (lab tests, imaging) that are clinically relevant
5. Provide detailed technician prompts to guide simulation delivery
6. Create appropriate expected actions for participants
7. Include clear debriefing points focused on learning objectives

Return the complete JSON structure with all fields filled in.`;

    // Determine if this is a scenario generation request
    let userPrompt = '';
    let contextMessages = messages;
    
    if (scenarioType) {
      // This is a direct scenario generation request
      userPrompt = `Create a medical simulation scenario for "${scenarioType}". 
${patientDetails ? `Include these patient details: ${JSON.stringify(patientDetails)}` : ''}

The scenario should follow this JSON structure:
\`\`\`json
{
 "Type": "Scenario",
 "Sim Title":"",
 "List of Intended Participants":[],
 "Purpose":"",
 "Scenario Overview":"",
 "Learning Objectives":[],
 "Required Simulation Tools":[],
 "Actor/patient info":{
   // All patient fields here
 },
 "stages":{
   // All stages here with vital signs
 },
 "Debriefing Points":[],
 "Handover":{},
 "resources":{}
}
\`\`\`

Return ONLY the complete JSON with no additional explanation.`;
      
      // For direct scenario requests, we'll use just this prompt
      contextMessages = [{
        role: 'user',
        content: userPrompt
      }];
    }
    
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      system: systemPrompt,
      messages: contextMessages,
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