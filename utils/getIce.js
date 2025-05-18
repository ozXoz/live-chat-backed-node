//  utils/getIce.js (Node / Express)
import twilio from 'twilio';
const { TWILIO_SID, TWILIO_AUTH } = process.env;

export async function getTwilioIce() {
  const client = twilio(TWILIO_SID, TWILIO_AUTH);
  const token  = await client.tokens.create();  // POST /Tokens.json
  // token.iceServers is *exactly* what the browser wants
  return token.iceServers;          // [{ urls:'stun:…' },{ urls:'turn:…', username:'', credential:'' }, …]
}
