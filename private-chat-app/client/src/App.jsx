import { useEffect, useState } from 'react';
import './App.css';
import Login from './pages/loginPage/Login';
import useAuth from './hooks/useAuth';
import Chat from './pages/chatPage/Chat';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';

function App() {
  const { auth } = useAuth();
  const sessionID = localStorage.getItem('sessionID');
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionID) {
      navigate('/login');
    }
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="login" element={<Login />} />
        <Route path="chat" element={<Chat />} />

        <Route element={<Navigate to={sessionID ? '/chat' : '/login'} />} />
      </Routes>
    </>
  );
}

export default App;
