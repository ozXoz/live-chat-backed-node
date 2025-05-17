const mongoose = require('mongoose');

/* Define message schema */
const Message = mongoose.model('Message', new mongoose.Schema({
  roomId:   { type: String, required: true, index: true },
  sender:   { type: String, required: true },
  message:  { type: String, required: true },
  time:     { type: Date,   default: () => new Date() }
}));

module.exports = (socket, io) => {
  console.log(`💬 ${socket.id} connected`);

  /* ───────── join room ───────── */
  socket.on('join-room', async payload => {
    const { roomId, previousId } =
      typeof payload === 'string'
        ? { roomId: payload, previousId: null }
        : payload || {};

    if (!roomId) return;

    // Handle reconnection (optional)
    if (previousId && previousId !== socket.id) {
      io.to(roomId).emit('disconnect-user', previousId);
    }

    socket.join(roomId);
    console.log(`🟢 ${socket.id} joined ${roomId}`);

    try {
      const history = await Message.find({ roomId })
                                   .sort({ time: 1 })
                                   .limit(50)
                                   .lean();
      socket.emit('chat-history', history);
    } catch (err) {
      console.error('💥 Mongo query failed:', err);
    }

    socket.to(roomId).emit('user-joined', { id: socket.id, name: '' });
  });

  /* ───────── incoming chat message ───────── */
  socket.on('send-message', async ({ roomId, sender, message }) => {
    try {
      const saved = await Message.create({ roomId, sender, message });
      io.to(roomId).emit('receive-message', saved);
    } catch (err) {
      console.error('💥 failed to save message:', err);
    }
  });

  /* ───────── incoming file ───────── */
  socket.on('send-file', ({ roomId, sender, fileName, fileData }) => {
    try {
      // Optionally limit file size (e.g. 5MB)
      if (fileData.length > 5_000_000) {
        console.warn(`⚠️ File too large from ${sender}: ${fileName}`);
        return;
      }

      // Send file to all in the room
      io.to(roomId).emit('receive-file', {
        sender,
        fileName,
        fileData
      });
    } catch (err) {
      console.error('💥 failed to broadcast file:', err);
    }
  });

  /* ───────── disconnect ───────── */
  socket.on('disconnect', () => {
    console.log(`🔴 ${socket.id} disconnected`);
    io.emit('user-left', { id: socket.id });
  });
};
