import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

export default function Profile({ user, onUserUpdate }) {
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setDescription(user.description || '');
    }
  }, [user]);

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

  const uploadAvatar = async () => {
    if (!avatarFile) return null;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    try {
      const response = await axios.post('/api/auth/upload-avatar', formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.avatar;
    } catch (err) {
      console.error('头像上传失败:', err);
      setError('头像上传失败');
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      // 先上传头像（如果有的话）
      let newAvatarUrl = user.avatar;
      if (avatarFile) {
        const uploadedAvatar = await uploadAvatar();
        if (uploadedAvatar) {
          newAvatarUrl = uploadedAvatar;
        }
      }

      // 更新用户信息
      const response = await axios.put('/api/auth/user', { description }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // 更新本地状态
      const updatedUser = { ...response.data, avatar: newAvatarUrl };
      onUserUpdate(updatedUser);
      
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (err) {
      setError(err.response?.data || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setDescription(user.description || '');
    setIsEditing(false);
    setError('');
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  if (!user) {
    return <div className="profile-container">请先登录</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>个人资料</h1>
      </div>

      <div className="profile-content">
        <div className="profile-avatar-section">
          {avatarPreview ? (
            <img src={avatarPreview} alt={user.username} className="profile-avatar" />
          ) : user.avatar ? (
            <img src={user.avatar} alt={user.username} className="profile-avatar" />
          ) : (
            <div className="profile-avatar-placeholder">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          {isEditing && (
            <div className="avatar-upload-section">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                id="profile-avatar-input"
              />
              <label htmlFor="profile-avatar-input" className="file-label">
                选择新头像
              </label>
              {uploadingAvatar && <div className="uploading">上传中...</div>}
            </div>
          )}
        </div>

        <div className="profile-info-section">
          <div className="profile-field">
            <label>用户名</label>
            <div className="profile-value">{user.username}</div>
          </div>

          <div className="profile-field">
            <label>身份</label>
            <div className="profile-value">
              {user.role === 'admin' ? '管理员' : '普通用户'}
            </div>
          </div>

          <div className="profile-field">
            <label>注册时间</label>
            <div className="profile-value">
              {new Date(user.createdAt).toLocaleDateString('zh-CN')}
            </div>
          </div>

          <div className="profile-field">
            <label>个人简介</label>
            {isEditing ? (
              <div className="edit-section">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="写点什么介绍自己吧..."
                  maxLength={500}
                  rows={4}
                />
                <div className="character-count">
                  {description.length}/500
                </div>
                {error && <div className="error-message">{error}</div>}
                <div className="edit-buttons">
                  <button onClick={handleSave} disabled={loading} className="save-btn">
                    {loading ? '保存中...' : '保存'}
                  </button>
                  <button onClick={handleCancel} className="cancel-btn">
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-value">
                <div className="description-display">
                  {user.description || '暂无简介'}
                </div>
                <button onClick={() => setIsEditing(true)} className="edit-btn">
                  编辑
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}