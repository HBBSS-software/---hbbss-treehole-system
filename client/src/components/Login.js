import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [adminKey, setAdminKey] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (token) => {
    if (!avatar) return null;
    
    const formData = new FormData();
    formData.append('avatar', avatar);

    try {
      const response = await axios.post('/api/auth/upload-avatar', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.avatar;
    } catch (err) {
      console.error('头像上传失败:', err);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const data = isLogin ? { username, password } : { username, password, role, adminKey };
      
      const response = await axios.post(endpoint, data);
      
      if (isLogin) {
        onLogin(response.data.token, response.data.user);
        navigate('/');
      } else {
        // 注册后上传头像
        const token = response.data?.token;
        if (avatar && token) {
          const avatarUrl = await uploadAvatar(token);
        }
        
        setError('');
        setUsername('');
        setPassword('');
        setRole('user');
        setAdminKey('');
        setAvatar(null);
        setAvatarPreview(null);
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
            <>
              <div className="form-group">
                <label>身份</label>
                <select value={role} onChange={(e) => {
                  setRole(e.target.value);
                  setAdminKey('');
                }}>
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                </select>
              </div>

              {role === 'admin' && (
                <div className="form-group">
                  <label>管理员认证密钥（首位管理员必填；已有管理员则可不填）</label>
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="请输入管理员注册密钥"
                  />
                  <small style={{ color: '#666' }}>
                    如果已经存在管理员账户，可留空；若是首位管理员则必须用密钥注册。
                  </small>
                </div>
              )}

              <div className="form-group">
                <label>头像</label>
                <div className="avatar-input-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    id="avatar-input"
                  />
                  <label htmlFor="avatar-input" className="file-label">
                    选择头像文件
                  </label>
                </div>
                {avatarPreview && (
                  <div className="avatar-preview">
                    <img src={avatarPreview} alt="头像预览" />
                  </div>
                )}
              </div>
            </>
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
            setAvatarPreview(null);
            setAvatar(null);
          }}>
            {isLogin ? '注册' : '登录'}
          </button>
        </p>
      </div>
    </div>
  );
}
