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

  useEffect(function() {
    if (user) { setDescription(user.description || ''); }
  }, [user]);

  function handleAvatarChange(e) {
    var file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      var reader = new FileReader();
      reader.onloadend = function() { setAvatarPreview(reader.result); };
      reader.readAsDataURL(file);
    }
  }

  function uploadAvatar() {
    if (!avatarFile) return Promise.resolve(null);
    setUploadingAvatar(true);
    var formData = new FormData();
    formData.append('avatar', avatarFile);
    return axios.post('/api/auth/upload-avatar', formData, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'multipart/form-data' }
    }).then(function(response) {
      return response.data.avatar;
    }).catch(function() {
      setError('头像上传失败');
      return null;
    }).finally(function() {
      setUploadingAvatar(false);
    });
  }

  function handleSave() {
    setLoading(true);
    setError('');
    var newAvatarUrl = user.avatar;
    var p = avatarFile ? uploadAvatar() : Promise.resolve(null);
    p.then(function(uploaded) {
      if (uploaded) newAvatarUrl = uploaded;
      return axios.put('/api/auth/user', { description: description }, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
    }).then(function(response) {
      var updatedUser = Object.assign({}, response.data, { avatar: newAvatarUrl });
      onUserUpdate(updatedUser);
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    }).catch(function(err) {
      var msg = err.response && err.response.data ? err.response.data : '更新失败';
      setError(typeof msg === 'string' ? msg : '更新失败');
    }).finally(function() {
      setLoading(false);
    });
  }

  function handleCancel() {
    setDescription(user.description || '');
    setIsEditing(false);
    setError('');
    setAvatarFile(null);
    setAvatarPreview(null);
  }

  if (!user) {
    return React.createElement('div', {className: 'profile-container'}, '请先登录');
  }

  return React.createElement('div', {className: 'profile-container'},
    React.createElement('div', {className: 'profile-header'},
      React.createElement('h1', null, '个人资料')
    ),
    React.createElement('div', {className: 'profile-content'},
      React.createElement('div', {className: 'profile-avatar-section'},
        avatarPreview
          ? React.createElement('img', {src: avatarPreview, alt: user.username, className: 'profile-avatar'})
          : user.avatar
            ? React.createElement('img', {src: user.avatar, alt: user.username, className: 'profile-avatar'})
            : React.createElement('div', {className: 'profile-avatar-placeholder'}, user.username.charAt(0).toUpperCase()),
        user.uid ? React.createElement('p', {className: 'profile-uid'}, 'UID: ' + user.uid) : null,
        isEditing ? React.createElement('div', {className: 'avatar-upload-section'},
          React.createElement('input', {type: 'file', accept: 'image/*', onChange: handleAvatarChange, id: 'profile-avatar-input'}),
          React.createElement('label', {htmlFor: 'profile-avatar-input', className: 'file-label'}, '选择新头像'),
          uploadingAvatar ? React.createElement('div', {className: 'uploading'}, '上传中...') : null
        ) : null
      ),
      React.createElement('div', {className: 'profile-info-section'},
        React.createElement('div', {className: 'profile-field'},
          React.createElement('label', null, '用户名'),
          React.createElement('div', {className: 'profile-value'}, user.username)
        ),
        React.createElement('div', {className: 'profile-field'},
          React.createElement('label', null, '身份'),
          React.createElement('div', {className: 'profile-value'}, user.role === 'admin' ? '管理员' : '普通用户')
        ),
        React.createElement('div', {className: 'profile-field'},
          React.createElement('label', null, '注册时间'),
          React.createElement('div', {className: 'profile-value'}, new Date(user.createdAt).toLocaleDateString('zh-CN'))
        ),
        React.createElement('div', {className: 'profile-field'},
          React.createElement('label', null, '个人简介'),
          isEditing
            ? React.createElement('div', {className: 'edit-section'},
                React.createElement('textarea', {value: description, onChange: function(e) { setDescription(e.target.value); }, placeholder: '写点什么介绍自己吧...', maxLength: 500, rows: 4}),
                React.createElement('div', {className: 'character-count'}, description.length + '/500'),
                error ? React.createElement('div', {className: 'error-message'}, error) : null,
                React.createElement('div', {className: 'edit-buttons'},
                  React.createElement('button', {onClick: handleSave, disabled: loading, className: 'save-btn'}, loading ? '保存中...' : '保存'),
                  React.createElement('button', {onClick: handleCancel, className: 'cancel-btn'}, '取消')
                )
              )
            : React.createElement('div', {className: 'profile-value'},
                React.createElement('div', {className: 'description-display'}, user.description || '暂无简介'),
                React.createElement('button', {onClick: function() { setIsEditing(true); }, className: 'edit-btn'}, '编辑')
              )
        )
      )
    )
  );
}