import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css';

export default function Navbar({ user, onLogout, onUserUpdate }) {
  const navigate = useNavigate();
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleAvatarClick = () => {
    setShowAvatarModal(true);
    setError('');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;

    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    try {
      const response = await axios.post('/api/auth/upload-avatar', formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const updatedUser = { ...user, avatar: response.data.avatar };
      onUserUpdate(updatedUser);
      
      setShowAvatarModal(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      setError(err.response?.data || '头像上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleCloseModal = () => {
    setShowAvatarModal(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setError('');
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            🌳 树洞系统
          </Link>
          
          {user && (
            <div className="nav-right">
              <div className="avatar-wrapper" title="点击编辑头像">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={user.username} className="user-avatar" onClick={handleAvatarClick} />
                ) : user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="user-avatar" onClick={handleAvatarClick} />
                ) : (
                  <div className="user-avatar-placeholder" onClick={handleAvatarClick}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
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

      {/* Avatar Edit Modal */}
      {showAvatarModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>编辑头像</h2>
              <button className="close-btn" onClick={handleCloseModal}>✕</button>
            </div>
            
            <div className="modal-content">
              <div className="avatar-preview-area">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="preview" className="preview-avatar" />
                ) : user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="preview-avatar" />
                ) : (
                  <div className="preview-avatar-placeholder">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="file-input-area">
                <input
                  type="file"
                  accept="image/jpeg,.jpg"
                  onChange={handleAvatarChange}
                  id="navbar-avatar-input"
                  className="hidden-file-input"
                />
                <label htmlFor="navbar-avatar-input" className="file-label">
                  📁 选择 JPG 图片
                </label>
                <p className="file-hint">建议使用圆形或正方形图片，大小不超过 5MB</p>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="modal-actions">
                <button 
                  onClick={handleUploadAvatar} 
                  disabled={!avatarFile || uploading}
                  className="upload-btn"
                >
                  {uploading ? '上传中...' : '上传头像'}
                </button>
                <button 
                  onClick={handleCloseModal} 
                  disabled={uploading}
                  className="cancel-btn"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}