module.exports = (socket, io) => {
  console.log(`📶 [SIGNAL] ${socket.id} connected`);

  // Forward signaling messages
  socket.on('signal', ({ to, data }) => {
    io.to(to).emit('signal', { from: socket.id, data });
  });

  // Join room for signaling
  socket.on('join-room', roomId => {
    socket.join(roomId);
    console.log(`📡 [SIGNAL JOIN] ${socket.id} joined ${roomId}`);

    const peers = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    peers.forEach(id => {
      if (id !== socket.id) {
        socket.emit('user-joined', { id });
      }
    });
  });

  // On disconnect
  socket.on('disconnect', () => {
    console.log(`🔴 [SIGNAL DISCONNECT] ${socket.id}`);
    io.emit('peer-disconnect', socket.id);
  });
};
