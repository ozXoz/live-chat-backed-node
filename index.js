// entry: node index.js
require('dotenv').config();             // ← loads .env

const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const { Server } = require('socket.io');
const mongoose   = require('mongoose');

const chatHandler      = require('./socket/chat');
const signalingHandler = require('./socket/signaling');
const { fetchTwilioIce } = require('./utils/twilioIce');

/* ---------- MongoDB ---------- */
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('✅ Mongo connected'))
  .catch(err => {
    console.error('❌ Mongo connection error:', err);
    process.exit(1);
  });

/* ---------- Express / Socket.IO ---------- */
const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('👋 Welcome to the Node.js Live Chat Backend');
});

app.get('/get-ice', async (req, res) => {
  res.json(await getTwilioIce());
});

app.get('/api/ice', async (req, res) => {
  try {
    const ice = await fetchTwilioIce();
    res.json(ice);
  } catch (err) {
    console.error('❌ ICE fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch ICE servers' });
  }
});


const server = http.createServer(app);
const io = new Server(server, {
  transports: ['websocket', 'polling'],
  cors: { origin: ['http://localhost:3000'], methods: ['GET', 'POST'] }
});

io.on('connection', socket => {
  chatHandler(socket, io);        // chat & history
  signalingHandler(socket, io);   // WebRTC signalling
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () =>
  console.log(`✅ Socket.IO server running → http://localhost:${PORT}`)
);
