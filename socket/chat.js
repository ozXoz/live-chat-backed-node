const mongoose = require('mongoose');

// Chat message schema
const Message = mongoose.model('Message', new mongoose.Schema({
  roomId:   { type: String, required: true, index: true },
  sender:   { type: String, required: true },
  message:  { type: String, default: '' },
  fileName: { type: String },
  fileData: { type: String },
  time:     { type: Date, default: () => new Date() }
}));

module.exports = (socket, io) => {
  console.log(`💬 [CHAT] ${socket.id} connected`);

  // Join chat room and send history
  socket.on('join-room', async payload => {
    const { roomId, previousId } =
      typeof payload === 'string'
        ? { roomId: payload, previousId: null }
        : payload || {};

    if (!roomId) return;

    if (previousId && previousId !== socket.id) {
      io.to(roomId).emit('disconnect-user', previousId);
    }

    socket.join(roomId);
    console.log(`💬 [JOIN] ${socket.id} joined ${roomId}`);

    try {
      const history = await Message.find({ roomId })
                                   .sort({ time: 1 })
                                   .limit(50)
                                   .lean();
      socket.emit('chat-history', history);
    } catch (err) {
      console.error('💥 MongoDB history error:', err);
    }

    socket.to(roomId).emit('user-joined', { id: socket.id });
  });

  // Receive chat message
  socket.on('send-message', async ({ roomId, sender, message }) => {
    try {
      const saved = await Message.create({ roomId, sender, message });
      io.to(roomId).emit('receive-message', saved);
    } catch (err) {
      console.error('💥 Failed to save message:', err);
    }
  });

  // Receive file
  socket.on('send-file', async ({ roomId, sender, fileName, fileData }) => {
    try {
      if (fileData.length > 5_000_000) {
        console.warn(`⚠️ File too large from ${sender}: ${fileName}`);
        return;
      }

      const saved = await Message.create({ roomId, sender, fileName, fileData });
      io.to(roomId).emit('receive-file', saved);
    } catch (err) {
      console.error('💥 Failed to send file:', err);
    }
  });

  // On disconnect
  socket.on('disconnect', () => {
    console.log(`🔴 [CHAT DISCONNECT] ${socket.id}`);
    io.emit('user-left', { id: socket.id });
  });
};
