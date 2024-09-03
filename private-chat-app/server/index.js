const express = require('express');
const app = express();
const cors = require('cors');
const corsOptionsHandler = require('./config/corsOptions');
const randomId = require('./utilities/randomId');
const { InMemorySessionStore } = require('./utilities/sessionStore');
const sessionStore = new InMemorySessionStore();

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
  sessionStore.findAllSession().forEach((session) => {
    users.push({
      userID: session.userID,
      sessionID: session.sessionID,
      username: session.username,
      connected: session.connected,
    });
  });

  const updatedUsers = users.filter((user) => user.connected);
  const disconnectedUser = users.filter((user) => !user.connected).length;

  io.emit('users', disconnectedUser >= 3 ? updatedUsers : users);

  socket.on('private message', ({ content, to }) => {
    socket.to(to).emit('private message', {
      content,
      from: socket.userID,
      to,
    });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.userID, socket.username);

    const userID = socket.userID;
    const sessionID = socket.sessionID;
    const username = socket.username;
    io.emit('user disconnected', userID);
    sessionStore.saveSession(sessionID, {
      userID,
      sessionID,
      username,
      connected: false,
    });
  });
});
