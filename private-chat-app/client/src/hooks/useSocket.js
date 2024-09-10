import { useState } from 'react';
import { io } from 'socket.io-client';

const useSocket = () => {
  const SERVER_URL = 'http://localhost:3500';
  const [socket, setSocket] = useState(() =>
    io(SERVER_URL, { autoConnect: false })
  );

  socket.onAny((event, ...args) => {
    console.log(event, args);
  });
  return [socket];
};

export default useSocket;
