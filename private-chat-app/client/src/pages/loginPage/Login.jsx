import { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import io from 'socket.io-client';

const URL = 'http://localhost:3500';

const Login = () => {
  const [socket, setSocket] = useState(() => io(URL, { autoConnect: false }));

  const { auth, setAuth } = useAuth();
  const [loginData, setLoginData] = useState({
    username: '',
    // password: '',
  });

  const onChangeHandler = (e) => {
    const { value, name } = e.target;

    setLoginData((preLoginData) => {
      return { ...preLoginData, [name]: value };
    });
  };

  const submitLoginHandler = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3500/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();
      const accessToken = result.accessToken;
      const username = loginData.username;

      setAuth({ username, accessToken });

      socket.auth = { username };
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <section>
      <form onSubmit={submitLoginHandler}>
        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          onChange={onChangeHandler}
          name="username"
        />

        <br />
        <br />

        {/* <label htmlFor="password" id="password">
          Password
        </label>
        <input
          type="password"
          id="password"
          onChange={onChangeHandler}
          name="password"
        /> */}

        <br />
        <br />

        {/* <label htmlFor="gender">Male</label>
        <input
          type="checkbox"
          name="male"
          id="gender"
          onChange={onChangeHandler}
          checked={loginData.gender === 'male'}
          value="male"
        />

        <br />
        <br />

        <label htmlFor="gender">Female</label>
        <input
          type="checkbox"
          name="female"
          id="gender"
          onChange={onChangeHandler}
          checked={loginData.gender === 'female'}
          value="female"
        /> */}

        <br />
        <br />
        <button type="submit">Login</button>
      </form>
    </section>
  );
};

export default Login;
