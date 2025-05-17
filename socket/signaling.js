// module.exports = (socket, io) => {
//   console.log(`📶 [SIGNAL] ${socket.id} connected`);

//   socket.on('signal', ({ to, data }) => {
//     io.to(to).emit('signal', { from: socket.id, data });
//   });

//   socket.on('ready', roomId => {
//     socket.join(roomId);
//     socket.to(roomId).emit('peer-ready', socket.id);      // tell others

//     // tell the newcomer who’s already there
//     const peers = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
//     peers.forEach(id => id !== socket.id && socket.emit('peer-ready', id));
//   });

//   socket.on('disconnect', () =>
//     io.emit('peer-disconnect', socket.id)
//   );
// };


module.exports = (socket, io) => {
  console.log(`📶 [SIGNAL] ${socket.id} connected`);

  socket.on('signal', ({ to, data }) => {
    io.to(to).emit('signal', { from: socket.id, data });
  });

  socket.on('join-room', roomId => {
    socket.join(roomId);
    console.log(`📡 ${socket.id} signaling joined ${roomId}`);

    const peers = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    peers.forEach(id => {
      if (id !== socket.id) {
        socket.emit('user-joined', { id });
      }
    });
  });

  socket.on('disconnect', () => {
    io.emit('peer-disconnect', socket.id);
  });
};
