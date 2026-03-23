import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const data = isLogin ? { username, password } : { username, password, role };
      
      const response = await axios.post(endpoint, data);
      
      if (isLogin) {
        onLogin(response.data.token, response.data.user);
        navigate('/');
      } else {
        setError('');
        setUsername('');
        setPassword('');
        alert('注册成功！请登录');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{isLogin ? '登录' : '注册'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="输入用户名"
            />
          </div>

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="输入密码"
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>身份</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <p className="toggle-auth">
          {isLogin ? '还没账号？' : '已有账号？'}
          <button type="button" onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}>
            {isLogin ? '注册' : '登录'}
          </button>
        </p>
      </div>
    </div>
  );
}