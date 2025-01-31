import Groq from "groq-sdk";
import dotenv from "dotenv";
import readlineSync from "readline-sync";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function getWeatherDetails(city = '') {
  if (city.toLowerCase() === 'patiala') return '10°C';
  if (city.toLowerCase() === 'mohali') return '12°C';
  if (city.toLowerCase() === 'bangalore') return '15°C';
  if (city.toLowerCase() === 'chandigarh') return '11°C';
  if (city.toLowerCase() === 'delhi') return '13°C';
  return 'Weather data not available for this city.';
};

const tools = {
  "getWeatherDetails": getWeatherDetails
}

const SYSTEM_PROMPT = `
You are an AI Assistant with START, PLAN, ACTION, Observation and Output State.
Wait for the user prompt and first PLAN using available tools.
After Planning, Take the action with appropriate tools and wait for Observation based on Action.
Once you get the observations, return the AI response based on START prompt and observations.

Strictly follow the JSON output format as in examples

Available Tools:
- function getWeatherDetails(city: string): string
getWeatherDetails is a function which takes city name as string and return weather details

EXAMPLE:

START
{ "type": "user", "user": "What is the weather in Patiala and Mohali?" }
{ "type": "plan", "plan": "I will call getWeatherDetails for Patiala first." }
{ "type": "action", "function": "getWeatherDetails", "input": "patiala" }
{ "type": "observation", "observation": "10°C" }
{ "type": "plan", "plan": "I will now call getWeatherDetails for Mohali." }
{ "type": "action", "function": "getWeatherDetails", "input": "mohali" }
{ "type": "observation", "observation": "12°C" }
{ "type": "output", "output": "The weather in Patiala is 10°C, and in Mohali is 12°C." }
`;

async function getGroqChatCompletion(messages) {
  try {
    return await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
    });
  } catch (error) {
    console.error("Error in Groq API call:", error.message);
    throw error;
  }
}

async function main() {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  while (true) {
    const query = readlineSync.question(">> ");
    const q = {
      type: 'user',
      user: query,
    };
    messages.push({ role: 'user', content: JSON.stringify(q) });

    while (true) {
      try {
        const chat = await getGroqChatCompletion(messages);
        const result = chat.choices[0]?.message?.content;

        if (!result) {
          console.error("Error: No response content from Groq API.");
          return;
        }

        messages.push({ role: 'assistant', content: result });

        let call;
        try {
          call = JSON.parse(result);
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError.message);
          console.error("Raw response:", result);
          return;
        }

        if (call.type === 'output') {
          console.log(`Bot: ${call.output}`);
          break;
        } else if (call.type === "action") {
          const fn = tools[call.function];
          if (typeof fn !== "function") {
            console.error(`Error: Function ${call.function} not found.`);
            return;
          }

          const observation = fn(call.input);
          const obs = { type: "observation", observation };
          messages.push({ role: 'assistant', content: JSON.stringify(obs) });
        }
      } catch (error) {
        console.error("Error during processing:", error.message);
        return;
      }
    }
    messages.splice(1, messages.length - 1);
  }
}

main().catch((error) => console.error("Error:", error));


// import Groq from "groq-sdk";
// import dotenv from "dotenv";
// import readlineSync from "readline-sync";

// dotenv.config();

// // Initialize Groq client
// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// // Define available tools
// function getWeatherDetails(city = "") {
//   const weatherData = {
//     patiala: "10°C",
//     mohali: "12°C",
//     bangalore: "15°C",
//     chandigarh: "11°C",
//     delhi: "13°C",
//   };
//   return weatherData[city.toLowerCase()] || "Weather data not available for this city.";
// }

// const tools = {
//   getWeatherDetails,
// };

// // System prompt for the model
// const SYSTEM_PROMPT = `
// You are an AI Assistant with START, PLAN, ACTION, Observation, and Output states.
// Wait for the user prompt and first PLAN using available tools.
// After planning, take the action with appropriate tools and wait for an Observation based on the action.
// Once you get the observations, return the AI response based on the START prompt and observations.

// Strictly follow the JSON output format as shown in the examples below.

// Available Tools:
// - function getWeatherDetails(city: string): string
// getWeatherDetails is a function that takes a city name as a string and returns weather details.

// EXAMPLE:

// START
// { "type": "user", "user": "What is the weather in Patiala and Mohali?" }
// { "type": "plan", "plan": "I will call getWeatherDetails for Patiala first." }
// { "type": "action", "function": "getWeatherDetails", "input": "patiala" }
// { "type": "observation", "observation": "10°C" }
// { "type": "plan", "plan": "I will now call getWeatherDetails for Mohali." }
// { "type": "action", "function": "getWeatherDetails", "input": "mohali" }
// { "type": "observation", "observation": "12°C" }
// { "type": "output", "output": "The weather in Patiala is 10°C, and in Mohali is 12°C." }
// `;

// async function getGroqChatCompletion(messages) {
//   try {
//     return await groq.chat.completions.create({
//       messages,
//       model: "llama-3.3-70b-versatile",
//     });
//   } catch (error) {
//     console.error("Error in Groq API call:", error.message);
//     throw error;
//   }
// }

// // Main function
// async function main() {
//   const messages = [{ role: "system", content: SYSTEM_PROMPT }];

//   while (true) {
//     const query = readlineSync.question(">> ");
//     const userMessage = { role: "user", content: JSON.stringify({ type: "user", user: query }) };
//     messages.push(userMessage);

//     while (true) {
//       try {
//         const chat = await getGroqChatCompletion(messages);
//         const result = chat.choices[0]?.message?.content;

//         if (!result) {
//           console.error("Error: No response content from Groq API.");
//           break;
//         }

//         let call;
//         try {
//           call = JSON.parse(result);
//         } catch (parseError) {
//           console.error("Error parsing JSON response:", parseError.message);
//           console.error("Raw response:", result);
//           break;
//         }

//         messages.push({ role: "assistant", content: result });

//         if (call.type === "output") {
//           console.log(`Bot: ${call.output}`);
//           break;
//         } else if (call.type === "action") {
//           const fn = tools[call.function];
//           if (typeof fn !== "function") {
//             console.error(`Error: Function ${call.function} not found.`);
//             break;
//           }

//           const observation = fn(call.input);
//           const obsMessage = { type: "observation", observation };
//           messages.push({ role: "developer", content: JSON.stringify(obsMessage) });
//         }
//       } catch (error) {
//         console.error("Error during processing:", error.message);
//         break;
//       }
//     }
//   }
// }

// main().catch((error) => console.error("Error:", error));
