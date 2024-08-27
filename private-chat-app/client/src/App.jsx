import { useState } from 'react';
import './App.css';
import Login from './pages/loginPage/Login';
import useAuth from './hooks/useAuth';
import Chat from './pages/chatPage/Chat';

function App() {
  const { auth } = useAuth();

  return <>{auth?.accessToken ? <Chat /> : <Login />}</>;
}

export default App;
