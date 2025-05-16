const mongoose = require('mongoose');

/* simple Message model (no separate file necessary) */
const Message = mongoose.model('Message', new mongoose.Schema({
  roomId:  { type: String, required: true, index: true },
  sender:  { type: String, required: true },
  message: { type: String, required: true },
  time:    { type: Date,   default: () => new Date() }
}));

// module.exports = (socket, io) => {
//   console.log(`💬 ${socket.id} connected`);

//   /* ---------- join room ---------- */
//   socket.on('join-room', async roomId => {
//     socket.join(roomId);
//     console.log(`🟢 ${socket.id} joined ${roomId}`);

//     // Send the last 50 messages to the newcomer
//     const history = await Message.find({ roomId })
//                                  .sort({ time: 1 })
//                                  .limit(50)
//                                  .lean();
//     socket.emit('chat-history', history);

//     // (optional) notify others
//     socket.to(roomId).emit('user-joined', { id: socket.id });
//   });

//   /* ---------- incoming chat ---------- */
//   socket.on('send-message', async ({ roomId, sender, message }) => {
//     // save to DB
//     const saved = await Message.create({ roomId, sender, message });

//     // broadcast to everyone in the room (including sender)
//     io.to(roomId).emit('receive-message', saved);
//   });

//   /* ---------- disconnect ---------- */
//   socket.on('disconnect', () => {
//     console.log(`🔴 ${socket.id} disconnected`);
//     io.emit('user-left', { id: socket.id });
//   });
// };


module.exports = (socket, io) => {
  console.log(`💬 ${socket.id} connected`);

  /* ───────── join room ───────── */
  socket.on('join-room', async payload => {
    /*  The client can now send EITHER
          "abc123"
       OR  { roomId: "abc123", previousId: "old-socket-id" }
    */
    const { roomId, previousId } =
      typeof payload === 'string'
        ? { roomId: payload, previousId: null }
        : payload || {};

    if (!roomId) return;                // guard

    /* replace the old socket-id if the user refreshed < 10 s ago */
    if (previousId && previousId !== socket.id) {
      io.to(roomId).emit('disconnect-user', previousId);
    }

    socket.join(roomId);
    console.log(`🟢 ${socket.id} joined ${roomId}`);

    /* ---- send the last 50 messages to the newcomer ---- */
    try {
      const history = await Message.find({ roomId })
                                   .sort({ time: 1 })
                                   .limit(50)
                                   .lean();
      socket.emit('chat-history', history);
    } catch (err) {
      console.error('💥 Mongo query failed:', err);
    }

    /* ---- tell others a user joined ---- */
    socket.to(roomId).emit('user-joined', { id: socket.id, name: '' });
  });

  /* ───────── incoming chat ───────── */
  socket.on('send-message', async ({ roomId, sender, message }) => {
    try {
      const saved = await Message.create({ roomId, sender, message });
      io.to(roomId).emit('receive-message', saved);      // broadcast
    } catch (err) {
      console.error('💥 failed to save message:', err);
    }
  });

  /* ───────── disconnect ───────── */
  socket.on('disconnect', () => {
    console.log(`🔴 ${socket.id} disconnected`);
    io.emit('user-left', { id: socket.id });
  });
};