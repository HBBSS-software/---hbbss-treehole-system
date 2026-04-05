import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './UserProfile.css';

export default function UserProfile({ user }) {
  var params = useParams();
  var userId = params.userId;
  var _pf = useState(null); var profileUser = _pf[0]; var setProfileUser = _pf[1];
  var _fo = useState(false); var following = _fo[0]; var setFollowing = _fo[1];
  var _fs = useState('none'); var friendStatus = _fs[0]; var setFriendStatus = _fs[1];
  var _fri = useState(null); var friendRequestId = _fri[0]; var setFriendRequestId = _fri[1];
  var _lo = useState(true); var loading = _lo[0]; var setLoading = _lo[1];
  var _er = useState(''); var error = _er[0]; var setError = _er[1];
  var _al = useState(false); var actionLoading = _al[0]; var setActionLoading = _al[1];

  useEffect(function() { fetchProfile(); }, [userId]);

  function fetchProfile() {
    setLoading(true);
    var token = localStorage.getItem('token');
    axios.get('/api/auth/profile/' + userId)
      .then(function(res) {
        setProfileUser(res.data);
        if (user && token) {
          return axios.get('/api/auth/user', { headers: { Authorization: 'Bearer ' + token } })
            .then(function(meRes) {
              var fl = meRes.data.following || [];
              setFollowing(fl.some(function(id) { return id === userId || (id && id._id === userId); }));
              return axios.get('/api/friends/status/' + userId, { headers: { Authorization: 'Bearer ' + token } })
                .then(function(friendRes) {
                  setFriendStatus(friendRes.data.status);
                  setFriendRequestId(friendRes.data.requestId || null);
                }).catch(function() {});
            });
        }
      })
      .catch(function() { setError('加载用户信息失败'); })
      .finally(function() { setLoading(false); });
  }

  function handleFollowToggle() {
    setActionLoading(true);
    var token = localStorage.getItem('token');
    var headers = { Authorization: 'Bearer ' + token };
    var p = following
      ? axios.post('/api/auth/unfollow/' + userId, {}, { headers: headers })
      : axios.post('/api/auth/follow/' + userId, {}, { headers: headers });
    p.then(function() {
      if (following) {
        setFollowing(false);
        setProfileUser(function(prev) { return Object.assign({}, prev, { followersCount: prev.followersCount - 1 }); });
      } else {
        setFollowing(true);
        setProfileUser(function(prev) { return Object.assign({}, prev, { followersCount: prev.followersCount + 1 }); });
      }
    }).catch(function(err) {
      var msg = err.response && err.response.data && err.response.data.message;
      setError(msg || '操作失败');
    }).finally(function() { setActionLoading(false); });
  }

  function handleFriendAction() {
    setActionLoading(true);
    var token = localStorage.getItem('token');
    var headers = { Authorization: 'Bearer ' + token };
    var p;
    if (friendStatus === 'none') {
      p = axios.post('/api/friends/request/' + userId, {}, { headers: headers }).then(function() { setFriendStatus('request_sent'); });
    } else if (friendStatus === 'request_received') {
      p = axios.post('/api/friends/accept/' + friendRequestId, {}, { headers: headers }).then(function() { setFriendStatus('friends'); });
    } else if (friendStatus === 'friends') {
      if (!window.confirm('确定要删除该好友吗？')) { setActionLoading(false); return; }
      p = axios.delete('/api/friends/' + userId, { headers: headers }).then(function() { setFriendStatus('none'); });
    } else { setActionLoading(false); return; }
    p.catch(function(err) {
      var msg = err.response && err.response.data && err.response.data.message;
      setError(msg || '操作失败');
    }).finally(function() { setActionLoading(false); });
  }

  function getFriendBtnText() {
    if (friendStatus === 'friends') return '已是好友';
    if (friendStatus === 'request_sent') return '请求已发送';
    if (friendStatus === 'request_received') return '接受好友请求';
    return '+ 添加好友';
  }

  if (loading) return React.createElement('div', {className: 'loading'}, '加载中...');
  if (error) return React.createElement('div', {className: 'user-profile-container'}, React.createElement('div', {className: 'error-message'}, error));
  if (!profileUser) return React.createElement('div', {className: 'user-profile-container'}, '用户不存在');

  var isSelf = user && user._id === userId;

  return React.createElement('div', {className: 'user-profile-container'},
    React.createElement('div', {className: 'user-profile-card'},
      React.createElement('div', {className: 'user-profile-avatar-section'},
        profileUser.avatar
          ? React.createElement('img', {src: profileUser.avatar, alt: profileUser.username, className: 'user-profile-avatar'})
          : React.createElement('div', {className: 'user-profile-avatar-placeholder'}, profileUser.username.charAt(0).toUpperCase())
      ),
      React.createElement('div', {className: 'user-profile-info'},
        React.createElement('h1', {className: 'user-profile-name'}, profileUser.username),
        profileUser.uid ? React.createElement('p', {className: 'user-profile-uid'}, 'UID: ' + profileUser.uid) : null,
        React.createElement('p', {className: 'user-profile-description'}, profileUser.description || '这个用户很懒，什么都没有写...'),
        React.createElement('div', {className: 'user-profile-stats'},
          React.createElement('div', {className: 'stat-item'},
            React.createElement('span', {className: 'stat-value'}, profileUser.followersCount),
            React.createElement('span', {className: 'stat-label'}, '粉丝')
          ),
          React.createElement('div', {className: 'stat-item'},
            React.createElement('span', {className: 'stat-value'}, profileUser.followingCount),
            React.createElement('span', {className: 'stat-label'}, '关注')
          )
        ),
        !isSelf ? React.createElement('div', {className: 'user-profile-actions'},
          React.createElement('button', {
            className: 'follow-btn' + (following ? ' following' : ''),
            onClick: handleFollowToggle,
            disabled: actionLoading
          }, actionLoading ? '处理中...' : following ? '已关注' : '+ 关注'),
          React.createElement('button', {
            className: 'friend-btn' + (friendStatus === 'friends' ? ' is-friend' : friendStatus === 'request_sent' ? ' pending' : ''),
            onClick: handleFriendAction,
            disabled: actionLoading || friendStatus === 'request_sent'
          }, actionLoading ? '处理中...' : getFriendBtnText())
        ) : null,
        React.createElement('p', {className: 'user-profile-joined'},
          '加入时间: ' + new Date(profileUser.createdAt).toLocaleDateString('zh-CN')
        )
      )
    )
  );
}