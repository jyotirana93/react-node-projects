import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import useAuth from '../../hooks/useAuth';
import './Chat.css';
import User from '../../components/user/User';

const URL = 'http://localhost:3500';

const Chat = () => {
  const { auth } = useAuth();
  const [socket] = useState(() => io(URL, { autoConnect: false }));
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageData, setMessageData] = useState('');
  const selectedUserIDRef = useRef(null);

  const onUserSelectHandler = (userSelected) => {
    setSelectedUser({ ...userSelected });

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

    if (selectedUser) {
      socket.emit('private message', {
        content: messageData,
        to: selectedUser.userID,
        toName: selectedUser.username,
      });

      setUsers((preUsers) => {
        return preUsers.map((user) => {
          if (user.userID === selectedUser?.userID) {
            const updatedUser = {
              ...user,
              hasNewMessages: false,
              messages: [
                ...user.messages,
                { content: messageData, fromSelf: true },
              ],
            };

            setSelectedUser({ ...updatedUser });

            return { ...updatedUser };
          }

          setSelectedUser({ ...user });

          return user;
        });
      });
    }

    setMessageData('');
  };

  useEffect(() => {
    if (auth?.username) {
      socket.auth = { username: auth?.username };
      socket.connect();
    }

    const handleUsers = (userData) => {
      setUsers(
        userData
          .map((user) => {
            if (user.userID === socket.id) {
              return {
                ...user,
                connected: true,
                self: true,
                messages: [],
                hasNewMessages: false,
              };
            } else {
              return {
                ...user,
                connected: true,
                self: false,
                messages: [],
                hasNewMessages: false,
              };
            }
          })
          .sort((a, b) => (a.self ? -1 : a.b ? 1 : 0))
      );
    };

    const handlePrivateMessage = (messageData) => {
      const { from, content, to } = messageData;

      setUsers((preUsers) => {
        return preUsers.map((user) => {
          if (user.userID === from) {
            const updatedUser = {
              ...user,
              hasNewMessages: selectedUserIDRef.current !== user?.userID, // Only set `hasNewMessages` to true if the message is from another user
              messages: [...user.messages, { content, fromSelf: false }],
            };

            setSelectedUser((prevSelectedUser) => {
              selectedUserIDRef.current = prevSelectedUser?.userID;

              if (prevSelectedUser?.userID === from) {
                return { ...updatedUser };
              }
              return prevSelectedUser;
            });

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
      <div className="header">Welcome {auth?.username}</div>
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
                isSelected={user?.userID === selectedUser?.userID}
              />
            );
          })}
        </ul>
      </div>
      {selectedUser && (
        <div className="message-panel">
          <p>
            {selectedUser?.messages.map((message, i) => {
              return (
                <li key={i} style={{ listStyle: 'none' }}>
                  <span>
                    {message?.fromSelf
                      ? '(Yourself):'
                      : `${selectedUser.username}: `}
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
