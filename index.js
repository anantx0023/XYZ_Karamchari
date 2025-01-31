import OpenAI from "openai";
import dotenv from "dotenv";
import readlineSync from "readline-sync";

dotenv.config();

const Api_Key = process.env.Api_Key;

const client = new OpenAI({
  apiKey: Api_Key,
});

function getWeatherDetails(city = '') {
  if (city.toLowerCase() === 'patiala') return '10°C';
  if (city.toLowerCase() === 'mohali') return '10°C';
  if (city.toLowerCase() === 'banglore') return '10°C';
  if (city.toLowerCase() === 'chandigarh') return '10°C';
  if (city.toLowerCase() === 'delhi') return '10°C';
};

const tools = {
  "getWeatherDetails": getWeatherDetails
}

const SYSTEM_PROMPT = `
You are an AI Assistant with START, PLAN, ACTION, Observation and Output State.
Wait for the user prompt and first PLAN using available tools.
After Planning, Take the action with appropriate tools and wait for Observation based on Action.
Once you get the observations, return the AI response based on START prompt and observations.

strictly follow the json output format as in examples

Available Tools:
- function getWeatherDetails(city: string): string
getWeatherDetails is a function which takes city name as string and return weather details

EXAMPLE:

START
{ "type": "user", "user": "What is the sum of weather of Patiala and Mohali?" }
{ "type": "plan", "plan": "I will call the getWeatherDetails for Patiala" }
{ "type": "action", "function": "getWeatherDetails", "input": "patiala" }
{ "type": "observation", "observation": "10°C" }
{ "type": "plan", "plan": "I will call getWeatherDetails for Mohali" }
{ "type": "action", "function": "getWeatherDetails", "input": "mohali" }
{ "type": "observation", "observation": "14°C" }
{ "type": "output", "output": "The sum of weather of Patiala and Mohali is 24°C" }


`;



const messages = [
       {"role": "system", content: SYSTEM_PROMPT},
 ]

while(true){
  const query = readlineSync.question('>> ');
  const q = {
    type: 'user',
    user: query,
  };
  messages.push({role: 'user', content: JSON.stringify(q)});

  while(true){
    const chat = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      message: messages,
      response_format: {type: 'json_object'}
    });

    const result = chat.choices[0].message.content;
    messages.push({ role: 'assistant', content: result});

    const call = JSON.parse(result);

    if(call.type == 'output'){
      console.log(`bot: ${call.output}`);
      break;
    }else if(call.type == "action"){
      const fn = tools[call.function]
      const observation = fn(call.input)
      const obs = {"type": "observation", "observation": observation};
      messages.push({role: 'developer', content: JSON.stringify(obs)});
    }
  }
}


// dotenv.config();

// Api_Key = process.env.Api_Key;

// const openai = new OpenAI({
//   apiKey: Api_Key,
// });

// const completion = openai.chat.completions.create({
//   model: "gpt-4o-mini",
//   store: true,
//   messages: [
//     {"role": "user", "content": "write a haiku about ai"},
//   ],
// });

// completion.then((result) => console.log(result.choices[0].message));