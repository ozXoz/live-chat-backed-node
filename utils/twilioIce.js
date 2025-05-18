// server/utils/twilioIce.js
import twilio from 'twilio';
export async function fetchTwilioIce() {
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
  const token  = await client.tokens.create();      // POST /Tokens.json
  return token.iceServers;                          // array
}
