import React from 'react';
import messageIcon from '../../assets/message.svg';

const User = ({ user, onSelect, isSelected }) => {
  return (
    <li
      style={{
        background: isSelected ? 'blue' : '',
        width: '180px',
        marginLeft: '-40px',
        padding: '10px',
        marginTop: '5px',
        position: 'relative',
      }}
      onClick={() => onSelect(user)}
    >
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <span>
          {user?.self ? `${user?.username} (yourself)` : user?.username}
        </span>
        <span style={{ fontSize: '0.8rem', marginLeft: '-0.2rem' }}>
          {user.connected ? '🟢 online' : '🔴 offline'}
        </span>
      </span>
      {user.hasNewMessages ? (
        <img
          style={{ position: 'absolute', top: '18px', right: '100px' }}
          src={messageIcon}
          alt="message icon"
        />
      ) : (
        ''
      )}
    </li>
  );
};

export default User;
