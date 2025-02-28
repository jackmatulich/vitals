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
4. The only part you may edit is the resource section. You will only include resources (lab tests, imaging) that are clinically relevant. If you decide a resource is clinically relevant you will fill and include it in it's entirety. You are only permitted to remove irrelevant resources, not to edit any resources relevant or otherwise. 
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
		"Stage 3":{
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
			},


"Debriefing Points":[],


"Handover":{

	"Context":"",
	"Situation": "",
	"Background":"",
	"Assessment":"",
	"Recommendation": ""
	},

"resources":{

"ABG":{
  "Type": "ABG",
  "Scenario Stage": "",
  "URN": "",
  "First Name": "",
  "Surname:": "",
  "DOB": "",
  "Temperature": {
    "value": "",
    "low": "",
    "high": "",
    "units": "°C"
  },
  "pH": {
    "value": "",
    "low": "7.35",
    "high": "7.45",
    "units": ""
  },
  "pCO2": {
    "value": "",
    "low": "35",
    "high": "45",
    "units": "mmHg"
  },
  "pO2": {
    "value": "",
    "low": "75",
    "high": "100",
    "units": "mmHg"
  },
  "cHCO3-(P)c": {
    "value": "",
    "low": "22",
    "high": "28",
    "units": "mmol/L"
  },
  "cBase(B)c": {
    "value": "",
    "low": "-2",
    "high": "2",
    "units": "mmol/L"
  },
  "ctHb": {
    "value": "",
    "low": "12",
    "high": "16",
    "units": "g/dL"
  },
  "sO2": {
    "value": "",
    "low": "95",
    "high": "100",
    "units": "%"
  },
  "FO2Hb": {
    "value": "",
    "low": "0",
    "high": "100",
    "units": "%"
  },
  "FHHb": {
    "value": "",
    "low": "0",
    "high": "10",
    "units": "%"
  },
  "FmetHb": {
    "value": "",
    "low": "0",
    "high": "1",
    "units": "%"
  },
  "cK+": {
    "value": "",
    "low": "3.5",
    "high": "5.0",
    "units": "mmol/L"
  },
  "cNa+": {
    "value": "",
    "low": "135",
    "high": "145",
    "units": "mmol/L"
  },
  "cCa2+": {
    "value": "",
    "low": "1.1",
    "high": "1.3",
    "units": "mmol/L"
  },
  "cCl-": {
    "value": "",
    "low": "98",
    "high": "106",
    "units": "mmol/L"
  },
  "cGlu": {
    "value": "",
    "low": "3.9",
    "high": "5.5",
    "units": "mmol/L"
  },
  "cLac": {
    "value": "",
    "low": "0.5",
    "high": "2.2",
    "units": "mmol/L"
  }
},

"blood culture":{
  "Type": "blood culture",
  "Scenario Stage": "",
  "Time": "",
  "URN": "",
  "First Name": "",
  "Surname": "",
  "DOB": "",
  "Aerobic Blood Culture": {
    "value": "",
    "low": "0",
    "high": "1",
    "units": "positive/negative"
  },
  "Anaerobic Blood Culture": {
    "value": "",
    "low": "0",
    "high": "1",
    "units": "positive/negative"
  },
  "Organism Identified": {
    "value": "",
    "low": "",
    "high": "",
    "units": "species"
  },
  "Antibiotic Susceptibility": {
    "value": "",
    "low": "",
    "high": "",
    "units": "resistant/sensitive"
  },
  "Time to Positivity": {
    "value": "",
    "low": "1",
    "high": "5",
    "units": "days"
  }
},
"cardiac enzymes":{
  "Type": "cardiac enzymes",
  "Scenario Stage": "",
  "Time": "",
  "URN": "",
  "First Name": "",
  "Surname": "",
  "DOB": "",
  "Troponin I": {
    "value": "",
    "low": "0.0",
    "high": "0.04",
    "units": "µg/L"
  },
  "Troponin T": {
    "value": "",
    "low": "0.0",
    "high": "0.01",
    "units": "µg/L"
  },
  "CK-MB": {
    "value": "",
    "low": "0",
    "high": "5",
    "units": "U/L"
  },
  "Creatine Kinase (CK)": {
    "value": "",
    "low": "30",
    "high": "200",
    "units": "U/L"
  },
  "Myoglobin": {
    "value": "",
    "low": "0",
    "high": "70",
    "units": "µg/L"
  },
  "LDH": {
    "value": "",
    "low": "125",
    "high": "243",
    "units": "U/L"
  },
  "BNP": {
    "value": "",
    "low": "0",
    "high": "100",
    "units": "pg/mL"
  },
  "ANP": {
    "value": "",
    "low": "0",
    "high": "30",
    "units": "pg/mL"
  },
  "C-Reactive Protein (CRP)": {
    "value": "",
    "low": "0",
    "high": "5",
    "units": "mg/L"
  }
},

"biochemistry":{
  "Type": "biochemistry",
  "Scenario Stage": "",
  "Time": "",
  "URN": "",
  "First Name": "",
  "Surname": "",
  "DOB": "",
  "Sodium": {
    "value": "",
    "low": "135",
    "high": "145",
    "units": "mmol/L"
  },
  "Potassium": {
    "value": "",
    "low": "3.5",
    "high": "5.0",
    "units": "mmol/L"
  },
  "Chloride": {
    "value": "",
    "low": "98",
    "high": "106",
    "units": "mmol/L"
  },
  "Bicarbonate": {
    "value": "",
    "low": "22",
    "high": "28",
    "units": "mmol/L"
  },
  "Urea": {
    "value": "",
    "low": "2.5",
    "high": "7.5",
    "units": "mmol/L"
  },
  "Creat. (IDMS)": {
    "value": "",
    "low": "60",
    "high": "110",
    "units": "µmol/L"
  },
  "eGFR": {
    "value": "",
    "low": "90",
    "high": "120",
    "units": "mL/min/1.73m²"
  },
  "Anion Gap": {
    "value": "",
    "low": "8",
    "high": "16",
    "units": "mmol/L"
  },
  "Lactate": {
    "value": "",
    "low": "0.5",
    "high": "2.2",
    "units": "mmol/L"
  },
  "CRP": {
    "value": "",
    "low": "0",
    "high": "5",
    "units": "mg/L"
  },
  "Lipase": {
    "value": "",
    "low": "10",
    "high": "140",
    "units": "U/L"
  },
  "Total protein": {
    "value": "",
    "low": "60",
    "high": "80",
    "units": "g/L"
  },
  "Albumin": {
    "value": "",
    "low": "35",
    "high": "50",
    "units": "g/L"
  },
  "AST": {
    "value": "",
    "low": "10",
    "high": "40",
    "units": "U/L"
  },
  "ALT": {
    "value": "",
    "low": "7",
    "high": "56",
    "units": "U/L"
  },
  "GGT": {
    "value": "",
    "low": "10",
    "high": "40",
    "units": "U/L"
  },
  "ALP": {
    "value": "",
    "low": "30",
    "high": "120",
    "units": "U/L"
  },
  "Bilirubin": {
    "value": "",
    "low": "5",
    "high": "21",
    "units": "µmol/L"
  },
  "Calcium": {
    "value": "",
    "low": "2.1",
    "high": "2.6",
    "units": "mmol/L"
  },
  "Calcium Corr": {
    "value": "",
    "low": "2.1",
    "high": "2.6",
    "units": "mmol/L"
  },
  "Phosphate": {
    "value": "",
    "low": "0.8",
    "high": "1.5",
    "units": "mmol/L"
  },
  "Magnesium": {
    "value": "",
    "low": "0.7",
    "high": "1.0",
    "units": "mmol/L"
  },
  "Urate": {
    "value": "",
    "low": "150",
    "high": "420",
    "units": "µmol/L"
  }
},
"coagulation":{
  "Type": "coagulation",
  "Scenario Stage": "",
  "Time": "",
  "URN": "",
  "First Name": "",
  "Surname": "",
  "DOB": "",
  "Prothrombin Time (PT)": {
    "value": "",
    "low": "11",
    "high": "15",
    "units": "seconds"
  },
  "International Normalized Ratio (INR)": {
    "value": "",
    "low": "0.9",
    "high": "1.1",
    "units": "unitless"
  },
  "Activated Partial Thromboplastin Time (aPTT)": {
    "value": "",
    "low": "28",
    "high": "35",
    "units": "seconds"
  },
  "Fibrinogen": {
    "value": "",
    "low": "2.0",
    "high": "4.0",
    "units": "g/L"
  },
  "D-dimer": {
    "value": "",
    "low": "0",
    "high": "0.5",
    "units": "mg/L"
  },
  "Thrombin Time (TT)": {
    "value": "",
    "low": "12",
    "high": "16",
    "units": "seconds"
  },
  "Platelet Count": {
    "value": "",
    "low": "150",
    "high": "400",
    "units": "x10^9/L"
  },
  "Anti-Thrombin III": {
    "value": "",
    "low": "80",
    "high": "120",
    "units": "percent (%)"
  },
  "Protein C": {
    "value": "",
    "low": "70",
    "high": "140",
    "units": "percent (%)"
  },
  "Protein S": {
    "value": "",
    "low": "60",
    "high": "130",
    "units": "percent (%)"
  }
},
"culture":{
  "Type": "culture",
  "Scenario Stage": "",
  "Time": "",
  "URN": "",
  "First Name": "",
  "Surname": "",
  "DOB": "",
  "Culture Type": {
    "value": "",
    "low": "",
    "high": "",
    "units": "type (e.g., urine, wound, sputum)"
  },
  "Culture Result": {
    "value": "",
    "low": "0",
    "high": "1",
    "units": "positive/negative"
  },
  "Organism Identified": {
    "value": "",
    "low": "",
    "high": "",
    "units": "species"
  },
  "Antibiotic Susceptibility": {
    "value": "",
    "low": "",
    "high": "",
    "units": "resistant/sensitive"
  },
  "Time to Positivity": {
    "value": "",
    "low": "1",
    "high": "5",
    "units": "days"
  }
},

"haematology":{
  "Type": "haematology",
  "Scenario Stage": "",
  "Time": "",
  "URN": "",
  "First Name": "",
  "Surname": "",
  "DOB": "",
  "Haemoglobin": {
    "value": "",
    "low": "120",
    "high": "160",
    "units": "g/L"
  },
  "RBC": {
    "value": "",
    "low": "4.0",
    "high": "5.5",
    "units": "x10^12/L"
  },
  "PCV": {
    "value": "",
    "low": "0.40",
    "high": "0.54",
    "units": "L/L"
  },
  "MCV": {
    "value": "",
    "low": "80",
    "high": "100",
    "units": "fL"
  },
  "MCH": {
    "value": "",
    "low": "27",
    "high": "34",
    "units": "pg"
  },
  "RDW": {
    "value": "",
    "low": "11.5",
    "high": "14.5",
    "units": "%"
  },
  "WCC": {
    "value": "",
    "low": "4.0",
    "high": "11.0",
    "units": "x10^9/L"
  },
  "Neutrophils": {
    "value": "",
    "low": "2.0",
    "high": "7.5",
    "units": "x10^9/L"
  },
  "Lymphocytes": {
    "value": "",
    "low": "1.0",
    "high": "4.0",
    "units": "x10^9/L"
  },
  "Monocytes": {
    "value": "",
    "low": "0.2",
    "high": "1.0",
    "units": "x10^9/L"
  },
  "Eosinophils": {
    "value": "",
    "low": "0.0",
    "high": "0.5",
    "units": "x10^9/L"
  },
  "Basophils": {
    "value": "",
    "low": "0.0",
    "high": "0.1",
    "units": "x10^9/L"
  },
  "Platelets": {
    "value": "",
    "low": "150",
    "high": "400",
    "units": "x10^9/L"
  }
},


"tox screen":{
  "Type": "tox screen",
  "Scenario Stage": "",
  "Time": "",
  "URN": "",
  "First Name": "",
  "Surname": "",
  "DOB": "",
  "Alcohol": {
    "value": "",
    "low": "0",
    "high": "0.08",
    "units": "g/dL"
  },
  "Amphetamines": {
    "value": "",
    "low": "0",
    "high": "500",
    "units": "ng/mL"
  },
  "Benzodiazepines": {
    "value": "",
    "low": "0",
    "high": "200",
    "units": "ng/mL"
  },
  "Cannabis (THC)": {
    "value": "",
    "low": "0",
    "high": "50",
    "units": "ng/mL"
  },
  "Cocaine": {
    "value": "",
    "low": "0",
    "high": "300",
    "units": "ng/mL"
  },
  "Opiates": {
    "value": "",
    "low": "0",
    "high": "200",
    "units": "ng/mL"
  },
  "Barbiturates": {
    "value": "",
    "low": "0",
    "high": "100",
    "units": "ng/mL"
  },
  "Phencyclidine (PCP)": {
    "value": "",
    "low": "0",
    "high": "25",
    "units": "ng/mL"
  },
  "Methadone": {
    "value": "",
    "low": "0",
    "high": "300",
    "units": "ng/mL"
  },
  "Propoxyphene": {
    "value": "",
    "low": "0",
    "high": "300",
    "units": "ng/mL"
  },
  "Tricyclic Antidepressants (TCA)": {
    "value": "",
    "low": "0",
    "high": "500",
    "units": "ng/mL"
  },
  "Ethanol (EtOH)": {
    "value": "",
    "low": "0",
    "high": "0.08",
    "units": "g/dL"
  },
  "Salicylates": {
    "value": "",
    "low": "0",
    "high": "300",
    "units": "mg/dL"
  },
  "Acetaminophen (Paracetamol)": {
    "value": "",
    "low": "0",
    "high": "200",
    "units": "µg/mL"
  },
  "Carbon Monoxide (COHb)": {
    "value": "",
    "low": "0",
    "high": "5",
    "units": "%"
  }
},

 
"VBG":{
  "Type": "VBG",
  "Scenario Stage": "",
  "URN": "",
  "First Name": "",
  "Surname:": "",
  "DOB": "",
  "Temperature": {
    "value": "",
    "low": "",
    "high": "",
    "units": "°C"
  },
  "pH": {
    "value": "",
    "low": "7.31",
    "high": "7.41",
    "units": "unitless"
  },
  "pCO2": {
    "value": "",
    "low": "41",
    "high": "51",
    "units": "mmHg"
  },
  "pO2": {
    "value": "",
    "low": "35",
    "high": "45",
    "units": "mmHg"
  },
  "cHCO3-(P)c": {
    "value": "",
    "low": "22",
    "high": "28",
    "units": "mmol/L"
  },
  "cBase(B)c": {
    "value": "",
    "low": "-2",
    "high": "2",
    "units": "mmol/L"
  },
  "ctHb": {
    "value": "",
    "low": "12",
    "high": "16",
    "units": "g/dL"
  },
  "sO2": {
    "value": "",
    "low": "60",
    "high": "85",
    "units": "%"
  },
  "FO2Hb": {
    "value": "",
    "low": "0",
    "high": "100",
    "units": "%"
  },
  "FHHb": {
    "value": "",
    "low": "0",
    "high": "10",
    "units": "%"
  },
  "FmetHb": {
    "value": "",
    "low": "0",
    "high": "1",
    "units": "%"
  },
  "cK+": {
    "value": "",
    "low": "3.5",
    "high": "5.0",
    "units": "mmol/L"
  },
  "cNa+": {
    "value": "",
    "low": "135",
    "high": "145",
    "units": "mmol/L"
  },
  "cCa2+": {
    "value": "",
    "low": "1.1",
    "high": "1.3",
    "units": "mmol/L"
  },
  "cCl-": {
    "value": "",
    "low": "98",
    "high": "106",
    "units": "mmol/L"
  },
  "cGlu": {
    "value": "",
    "low": "3.9",
    "high": "5.5",
    "units": "mmol/L"
  },
  "cLac": {
    "value": "",
    "low": "0.5",
    "high": "2.2",
    "units": "mmol/L"
  }
}


		}

}


`;
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