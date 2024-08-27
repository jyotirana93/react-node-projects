const express = require('express');
const app = express();
const cors = require('cors');
const corsOptionsHandler = require('./config/corsOptions');

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

  console.log({ username });

  if (!username) {
    return next(new Error('invalid username'));
  }

  socket.username = username;

  next();
});

io.on('connection', (socket) => {
  console.log('socket id=>', socket.id);

  let users = [];
  io.of('/').sockets.forEach((socket, id) => {
    users.push({ userID: id, username: socket.username });
  });

  io.emit('users', users);

  socket.on('private message', ({ content, to }) => {
    socket.to(to).emit('private message', {
      content,
      from: socket.id,
      to,
    });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
    const socketId = socket.id;
    io.emit('user disconnected', socketId);
  });
});
