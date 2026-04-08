import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

var PRESET_BACKGROUNDS = [
  { name: '\u9ED8\u8BA4', value: '' },
  { name: '\u661F\u7A7A', value: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80' },
  { name: '\u5C71\u8109', value: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80' },
  { name: '\u6D77\u6D0B', value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80' },
  { name: '\u68EE\u6797', value: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80' },
  { name: '\u57CE\u5E02', value: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80' },
  { name: '\u6A31\u82B1', value: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1920&q=80' }
];

export default function Profile({ user, onUserUpdate }) {
  var [description, setDescription] = useState('');
  var [isEditing, setIsEditing] = useState(false);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState('');
  var [avatarFile, setAvatarFile] = useState(null);
  var [avatarPreview, setAvatarPreview] = useState(null);
  var [uploadingAvatar, setUploadingAvatar] = useState(false);
  var [showBgPicker, setShowBgPicker] = useState(false);
  var [uploadingBg, setUploadingBg] = useState(false);

  var token = localStorage.getItem('token');
  var headers = { Authorization: 'Bearer ' + token };

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
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'multipart/form-data' }
    }).then(function(response) {
      return response.data.avatar;
    }).catch(function() {
      setError('\u5934\u50CF\u4E0A\u4F20\u5931\u8D25');
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
      return axios.put('/api/auth/user', { description: description }, { headers: headers });
    }).then(function(response) {
      var updatedUser = Object.assign({}, response.data, { avatar: newAvatarUrl, background: user.background || '' });
      onUserUpdate(updatedUser);
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    }).catch(function(err) {
      var msg = err.response && err.response.data ? err.response.data : '\u66F4\u65B0\u5931\u8D25';
      setError(typeof msg === 'string' ? msg : '\u66F4\u65B0\u5931\u8D25');
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

  function handleSetPresetBg(bgValue) {
    axios.put('/api/auth/background', { background: bgValue }, { headers: headers })
      .then(function(res) {
        var updated = Object.assign({}, user, { background: res.data.background });
        onUserUpdate(updated);
      })
      .catch(function() { setError('\u80CC\u666F\u8BBE\u7F6E\u5931\u8D25'); });
  }

  function handleUploadBg(e) {
    var file = e.target.files[0];
    if (!file) return;
    setUploadingBg(true);
    var formData = new FormData();
    formData.append('background', file);
    axios.post('/api/auth/upload-background', formData, {
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'multipart/form-data' }
    }).then(function(res) {
      var updated = Object.assign({}, user, { background: res.data.background });
      onUserUpdate(updated);
    }).catch(function() {
      setError('\u80CC\u666F\u4E0A\u4F20\u5931\u8D25');
    }).finally(function() {
      setUploadingBg(false);
    });
  }

  if (!user) {
    return React.createElement('div', {className: 'profile-container'}, '\u8BF7\u5148\u767B\u5F55');
  }

  return React.createElement('div', {className: 'profile-container'},
    React.createElement('div', {className: 'profile-header'},
      React.createElement('h1', null, '\u4E2A\u4EBA\u8D44\u6599')
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
          React.createElement('label', {htmlFor: 'profile-avatar-input', className: 'file-label'}, '\u9009\u62E9\u65B0\u5934\u50CF'),
          uploadingAvatar ? React.createElement('div', {className: 'uploading'}, '\u4E0A\u4F20\u4E2D...') : null
        ) : null
      ),
      React.createElement('div', {className: 'profile-info-section'},
        React.createElement('div', {className: 'profile-field'},
          React.createElement('label', null, '\u7528\u6237\u540D'),
          React.createElement('div', {className: 'profile-value'}, user.username)
        ),
        React.createElement('div', {className: 'profile-field'},
          React.createElement('label', null, '\u8EAB\u4EFD'),
          React.createElement('div', {className: 'profile-value'}, user.role === 'admin' ? '\u7BA1\u7406\u5458' : '\u666E\u901A\u7528\u6237')
        ),
        React.createElement('div', {className: 'profile-field'},
          React.createElement('label', null, '\u4E2A\u4EBA\u7B80\u4ECB'),
          isEditing
            ? React.createElement('div', {className: 'edit-section'},
                React.createElement('textarea', {value: description, onChange: function(e) { setDescription(e.target.value); }, placeholder: '\u5199\u70B9\u4EC0\u4E48\u4ECB\u7ECD\u81EA\u5DF1\u5427...', maxLength: 500, rows: 4}),
                React.createElement('div', {className: 'character-count'}, description.length + '/500'),
                error ? React.createElement('div', {className: 'error-message'}, error) : null,
                React.createElement('div', {className: 'edit-buttons'},
                  React.createElement('button', {onClick: handleSave, disabled: loading, className: 'save-btn'}, loading ? '\u4FDD\u5B58\u4E2D...' : '\u4FDD\u5B58'),
                  React.createElement('button', {onClick: handleCancel, className: 'cancel-btn'}, '\u53D6\u6D88')
                )
              )
            : React.createElement('div', {className: 'profile-value'},
                React.createElement('div', {className: 'description-display'}, user.description || '\u6682\u65E0\u7B80\u4ECB'),
                React.createElement('button', {onClick: function() { setIsEditing(true); }, className: 'edit-btn'}, '\u7F16\u8F91')
              )
        ),
        React.createElement('div', {className: 'profile-field'},
          React.createElement('label', null, '\u80CC\u666F\u8BBE\u7F6E'),
          React.createElement('div', {className: 'profile-value'},
            React.createElement('button', {onClick: function() { setShowBgPicker(!showBgPicker); }, className: 'edit-btn'}, showBgPicker ? '\u6536\u8D77' : '\u66F4\u6362\u80CC\u666F'),
            user.background ? React.createElement('span', {className: 'current-bg-hint'}, '\u5DF2\u8BBE\u7F6E\u81EA\u5B9A\u4E49\u80CC\u666F') : null
          )
        ),
        showBgPicker ? React.createElement('div', {className: 'bg-picker-section'},
          React.createElement('div', {className: 'bg-presets'},
            PRESET_BACKGROUNDS.map(function(preset) {
              var isActive = (user.background || '') === preset.value;
              return React.createElement('div', {
                key: preset.name,
                className: 'bg-preset-item' + (isActive ? ' active' : ''),
                onClick: function() { handleSetPresetBg(preset.value); }
              },
                preset.value
                  ? React.createElement('img', {src: preset.value, alt: preset.name, className: 'bg-preset-img'})
                  : React.createElement('div', {className: 'bg-preset-none'}, '\u65E0'),
                React.createElement('span', {className: 'bg-preset-name'}, preset.name)
              );
            })
          ),
          React.createElement('div', {className: 'bg-upload-section'},
            React.createElement('input', {type: 'file', accept: 'image/*', onChange: handleUploadBg, id: 'bg-upload-input', className: 'hidden-file-input'}),
            React.createElement('label', {htmlFor: 'bg-upload-input', className: 'bg-upload-label'},
              uploadingBg ? '\u4E0A\u4F20\u4E2D...' : '\uD83D\uDCE4 \u4E0A\u4F20\u81EA\u5B9A\u4E49\u80CC\u666F'
            )
          )
        ) : null
      )
    ),
    error && !isEditing ? React.createElement('div', {className: 'error-message'}, error) : null
  );
}