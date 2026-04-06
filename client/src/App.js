import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Login from './components/Login';

const Home = lazy(() => import('./components/Home'));
const Section = lazy(() => import('./components/Section'));
const Post = lazy(() => import('./components/Post'));
const Admin = lazy(() => import('./components/Admin'));
const Profile = lazy(() => import('./components/Profile'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const Friends = lazy(() => import('./components/Friends'));
const Chat = lazy(() => import('./components/Chat'));

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) { setUser(JSON.parse(userData)); }
    setLoading(false);
  }, []);
  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };
  const handleUserUpdate = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };
  if (loading) { return React.createElement('div', {className: 'loading'}, '\u52A0\u8F7D\u4E2D...'); }
  return React.createElement(Router, null,
    React.createElement(Navbar, {user: user, onLogout: handleLogout, onUserUpdate: handleUserUpdate}),
    React.createElement(Suspense, {fallback: React.createElement('div', {className: 'loading'}, '\u52A0\u8F7D\u4E2D...')},
      React.createElement(Routes, null,
        React.createElement(Route, {path: '/login', element: !user ? React.createElement(Login, {onLogin: handleLogin}) : React.createElement(Navigate, {to: '/'})}),
        React.createElement(Route, {path: '/', element: user ? React.createElement(Home, {user: user}) : React.createElement(Navigate, {to: '/login'})}),
        React.createElement(Route, {path: '/section/:id', element: user ? React.createElement(Section, {user: user}) : React.createElement(Navigate, {to: '/login'})}),
        React.createElement(Route, {path: '/post/:id', element: user ? React.createElement(Post, {user: user}) : React.createElement(Navigate, {to: '/login'})}),
        React.createElement(Route, {path: '/profile', element: user ? React.createElement(Profile, {user: user, onUserUpdate: handleUserUpdate}) : React.createElement(Navigate, {to: '/login'})}),
        React.createElement(Route, {path: '/user/:userId', element: user ? React.createElement(UserProfile, {user: user}) : React.createElement(Navigate, {to: '/login'})}),
        React.createElement(Route, {path: '/friends', element: user ? React.createElement(Friends, {user: user}) : React.createElement(Navigate, {to: '/login'})}),
        React.createElement(Route, {path: '/chat/:friendId', element: user ? React.createElement(Chat, {user: user}) : React.createElement(Navigate, {to: '/login'})}),
        user && user.role === 'admin' ? React.createElement(Route, {path: '/admin', element: React.createElement(Admin, {user: user})}) : null,
        React.createElement(Route, {path: '*', element: React.createElement(Navigate, {to: '/'})})
      )
    )
  );
}
export default App;