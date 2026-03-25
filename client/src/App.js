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
  if (loading) { return <div className="loading">加载中...</div>; }
  return (
    <Router>
      <Navbar user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
      <Suspense fallback={<div className="loading">加载中...</div>}>
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/login" />} />
          <Route path="/section/:id" element={user ? <Section user={user} /> : <Navigate to="/login" />} />
          <Route path="/post/:id" element={user ? <Post user={user} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile user={user} onUserUpdate={handleUserUpdate} /> : <Navigate to="/login" />} />
          <Route path="/user/:userId" element={user ? <UserProfile user={user} /> : <Navigate to="/login" />} />
          {user?.role === 'admin' && <Route path="/admin" element={<Admin user={user} />} />}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
export default App;
