import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import useAuth from '../../hooks/useAuth';
import './Chat.css';
import User from '../../components/user/User';
import { useNavigate } from 'react-router-dom';

const URL = 'http://localhost:3500';

const Chat = () => {
  const { auth } = useAuth();
  const [socket] = useState(() => io(URL, { autoConnect: false }));
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageData, setMessageData] = useState('');
  const selectedUserIDRef = useRef(null);
  const navigate = useNavigate();
  const sessionID = parseInt(localStorage.getItem('sessionID'));
  const userID = parseInt(localStorage.getItem('userID'));
  const username = localStorage.getItem('username');

  const onUserSelectHandler = (userSelected) => {
    selectedUserIDRef.current = userSelected;

    setUsers((preUsers) => {
      return preUsers.map((user) => {
        if (user.userID === userSelected.userID) {
          return {
            ...user,
            hasNewMessages: false,
          };
        }
        return user;
      });
    });
  };

  const onSubmitUserMessageHandler = (e) => {
    e.preventDefault();

    if (selectedUserIDRef.current) {
      socket.emit('private message', {
        content: messageData,

        to: selectedUserIDRef.current?.userID,
        toName: selectedUserIDRef.current?.username,
      });

      setUsers((preUsers) => {
        return preUsers.map((user) => {
          if (user.userID === selectedUserIDRef.current?.userID) {
            const updatedUser = {
              ...user,
              hasNewMessages: false,
              messages: [
                ...user.messages,
                { content: messageData, fromSelf: true },
              ],
            };

            selectedUserIDRef.current = updatedUser;

            return { ...updatedUser };
          }

          return user;
        });
      });
    }

    setMessageData('');
  };

  const handleLogout = () => {
    localStorage.removeItem('sessionID');
    localStorage.removeItem('userID');
    localStorage.removeItem('username');
    navigate('/login');
  };

  useEffect(() => {
    if (sessionID) {
      socket.auth = { username: auth?.username || username, sessionID };
      socket.userID = userID;
      socket.connect();
    }

    const handleUsers = (userData) => {
      setUsers(
        userData
          .map((user) => {
            if (user.userID === socket.userID) {
              return {
                ...user,
                self: user?.userID === socket?.userID,
                messages: [],
                hasNewMessages: false,
              };
            }
            return {
              ...user,
              self: false,
              messages: [],
              hasNewMessages: false,
            };
          })
          .sort((a, b) => {
            if (a.self) return -1;
            if (b.self) return 1;
            if (a.username.toLowerCase() < b.username.toLowerCase()) return -1;
            return a.username.toLowerCase() > b.username.toLowerCase() ? 1 : 0;
          })
      );
    };

    const handlePrivateMessage = (messageData) => {
      const { from, content, to } = messageData;

      setUsers((preUsers) => {
        return preUsers.map((user) => {
          const fromSelf = user?.userID === socket.userID;
          if (user?.userID === from) {
            const updatedUser = {
              ...user,
              hasNewMessages:
                selectedUserIDRef.current?.userID !== user?.userID,
              messages: [...user.messages, { content, fromSelf }],
            };

            if (selectedUserIDRef.current?.userID === from) {
              selectedUserIDRef.current = updatedUser;
            }

            return updatedUser;
          }

          return user;
        });
      });
    };

    const handleUserDisconnected = (id) => {
      setUsers((preUsers) => {
        return preUsers.map((user) => {
          if (user.userID === id) {
            return { ...user, connected: false };
          } else {
            return user;
          }
        });
      });
    };

    socket.on('users', handleUsers);
    socket.on('private message', handlePrivateMessage);
    socket.on('user disconnected', handleUserDisconnected);

    return () => {
      socket.off('users', handleUsers);
      socket.off('private message', handlePrivateMessage);
      socket.off('user disconnected', handleUserDisconnected);
      socket.disconnect();
    };
  }, []);

  return (
    <section className="chat-container">
      <div className="header">
        <span
          style={{ width: '100%', margin: 'auto', textTransform: 'capitalize' }}
        >
          Welcome {auth?.username || username}
        </span>
        <span>
          <button style={{ marginRight: '50px' }} onClick={handleLogout}>
            Logout
          </button>
        </span>
      </div>
      <div className="left-panel">
        <ul
          style={{
            listStyle: 'none',
            textTransform: 'capitalize',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          {users.map((user) => {
            return (
              <User
                key={user?.userID}
                user={user}
                onSelect={onUserSelectHandler}
                isSelected={user?.userID === selectedUserIDRef.current?.userID}
              />
            );
          })}
        </ul>
      </div>
      {selectedUserIDRef.current?.userID && (
        <div className="message-panel">
          <p>
            {selectedUserIDRef.current?.messages.map((message, i) => {
              return (
                <li key={i} style={{ listStyle: 'none' }}>
                  <span>
                    {message?.fromSelf
                      ? '(Yourself):'
                      : `${selectedUserIDRef.current?.username}: `}
                  </span>
                  <span> {message.content}</span>
                </li>
              );
            })}
          </p>
          <form
            onSubmit={onSubmitUserMessageHandler}
            style={{
              display: 'flex',

              position: 'absolute',
              bottom: '0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',

                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <input
                style={{
                  width: '900px',
                  flex: '1',
                  padding: '12px',
                  border: 'none',
                  outline: 'none',
                }}
                type="text"
                name="message"
                id="message"
                placeholder="Enter message"
                onChange={(e) => setMessageData(e.target.value)}
                value={messageData}
              />
              <br />
              <button
                type="submit"
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '0.592rem 20px',
                  cursor: 'pointer',
                  outline: 'none',
                  borderRadius: '0px',
                }}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

export default Chat;
