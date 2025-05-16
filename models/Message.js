// backend-node/models/Message.js
const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  roomId:   { type: String, required: true, index: true },
  sender:   { type: String, required: true },
  message:  { type: String, required: true },
  time:     { type: Date,   default: () => new Date() }
});
module.exports = mongoose.model('Message', messageSchema);
