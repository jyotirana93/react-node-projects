const express = require('express');
const app = express();
const cors = require('cors');
const corsOptionsHandler = require('./config/corsOptions');
const randomId = require('./utilities/randomId');
const { InMemorySessionStore } = require('./utilities/sessionStore');
const sessionStore = new InMemorySessionStore();
const { InMemoryMessageStore } = require('./utilities/messageStore.js');
const messageStore = new InMemoryMessageStore();

app.use(cors(corsOptionsHandler));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 3500;

app.use('/login', require('./routes/auth'));

const server = app.listen(PORT, () =>
  console.log(`server listening on port ${PORT}`)
);
const io = require('socket.io')(server, {
  pingTimeOut: 60000,
  cors: {
    origin: 'http://localhost:5173',
  },
});

io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  const sessionID = socket.handshake.auth.sessionID;

  if (sessionID) {
    const session = sessionStore.findSession(sessionID);

    if (session) {
      socket.sessionID = sessionID;
      socket.userID = session.userID;
      socket.username = session.username;

      return next();
    }
  }

  if (!username) {
    return next(new Error('invalid username'));
  }

  socket.sessionID = randomId();
  socket.userID = randomId();
  socket.username = username;
  next();
});

io.on('connection', (socket) => {
  sessionStore.saveSession(socket.sessionID, {
    userID: socket.userID,
    sessionID: socket.sessionID,
    username: socket.username,
    connected: true,
  });

  socket.emit('session', {
    userID: socket.userID,
    sessionID: socket.sessionID,
  });

  socket.join(socket.userID);

  let users = [];
  const messagesPerUser = new Map();
  messageStore.findMessage(socket.userID).forEach((message) => {
    const otherUser =
      socket.userID === message.from ? message.to : message.from;

    if (messagesPerUser.has(otherUser)) {
      messagesPerUser.get(otherUser).push(message);
    } else {
      messagesPerUser.set(otherUser, [message]);
    }
  });

  sessionStore.findAllSession().forEach((session) => {
    users.push({
      userID: session.userID,
      sessionID: session.sessionID,
      username: session.username,
      connected: session.connected,
      messages: messagesPerUser.get(session.userID) || [],
    });
  });

  const updatedUsers = users.filter((user) => user.connected);
  const disconnectedUser = users.filter((user) => !user.connected).length;

  socket.emit('users', users);

  // socket.emit('users', disconnectedUser >= 3 ? updatedUsers : users);
  //socket.emit('users', disconnectedUser >= 4 ? updatedUsers : users);

  socket.broadcast.emit('user connected', {
    userID: socket.userID,
    sessionID: socket.sessionID,
    username: socket.username,
    connected: true,
    messages: [],
  });

  socket.on('private message', ({ content, to, to_username }) => {
    const message = {
      content,
      from: socket.userID,
      from_username: socket.username,
      to,
      to_username,
    };

    messageStore.saveMessage(message);
    socket.to(to).emit('private message', message);
  });

  socket.on('disconnect', async () => {
    console.log('user disconnected', socket.userID, socket.username);

    const matchingSockets = await io.in(socket.userID).allSockets();
    const isDisconnected = matchingSockets.size === 0;

    if (isDisconnected) {
      const userID = socket.userID;
      const sessionID = socket.sessionID;
      const username = socket.username;

      socket.broadcast.emit('user disconnected', userID);
      sessionStore.saveSession(sessionID, {
        userID,
        sessionID,
        username,
        connected: false,
      });
    }
  });
});
