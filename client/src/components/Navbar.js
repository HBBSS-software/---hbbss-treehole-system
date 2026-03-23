import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          🌳 树洞系统
        </Link>
        
        {user && (
          <div className="nav-right">
            {user.avatar && (
              <img src={user.avatar} alt={user.username} className="user-avatar" title={user.username} />
            )}
            <span className="user-info">
              欢迎，{user.username}
              {user.role === 'admin' && <span className="admin-badge">管理员</span>}
            </span>
            <Link to="/profile" className="nav-link profile-link">
              账户管理
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" className="nav-link admin-link">
                管理后台
              </Link>
            )}
            <button onClick={handleLogout} className="logout-btn">
              退出登录
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}