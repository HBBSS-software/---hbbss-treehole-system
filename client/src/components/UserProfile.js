import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './UserProfile.css';

export default function UserProfile({ user }) {
  const { userId } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [following, setFollowing] = useState(false);
  const [friendStatus, setFriendStatus] = useState('none');
  const [friendRequestId, setFriendRequestId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`/api/auth/profile/${userId}`);
      setProfileUser(res.data);
      if (user) {
        const token = localStorage.getItem('token');
        const meRes = await axios.get('/api/auth/user', { headers: { Authorization: `Bearer ${token}` } });
        setFollowing(meRes.data.following?.some(id => id === userId || id?._id === userId) || false);
        try {
          const friendRes = await axios.get(`/api/friends/status/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
          setFriendStatus(friendRes.data.status);
          setFriendRequestId(friendRes.data.requestId || null);
        } catch (_) {}
      }
    } catch (err) {
      setError('加载用户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (following) {
        await axios.post(`/api/auth/unfollow/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
        setFollowing(false);
        setProfileUser(prev => ({ ...prev, followersCount: prev.followersCount - 1 }));
      } else {
        await axios.post(`/api/auth/follow/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
        setFollowing(true);
        setProfileUser(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));
      }
    } catch (err) {
      setError(err.response?.data?.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFriendAction = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      if (friendStatus === 'none') {
        await axios.post(`/api/friends/request/${userId}`, {}, { headers });
        setFriendStatus('request_sent');
      } else if (friendStatus === 'request_received') {
        await axios.post(`/api/friends/accept/${friendRequestId}`, {}, { headers });
        setFriendStatus('friends');
      } else if (friendStatus === 'friends') {
        if (window.confirm('确定要删除该好友吗？')) {
          await axios.delete(`/api/friends/${userId}`, { headers });
          setFriendStatus('none');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const getFriendBtnText = () => {
    switch (friendStatus) {
      case 'friends': return '已是好友';
      case 'request_sent': return '请求已发送';
      case 'request_received': return '接受好友请求';
      default: return '+ 添加好友';
    }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (error) return <div className="user-profile-container"><div className="error-message">{error}</div></div>;
  if (!profileUser) return <div className="user-profile-container">用户不存在</div>;

  const isSelf = user?._id === userId;

  return (
    <div className="user-profile-container">
      <div className="user-profile-card">
        <div className="user-profile-avatar-section">
          {profileUser.avatar ? (
            <img src={profileUser.avatar} alt={profileUser.username} className="user-profile-avatar" />
          ) : (
            <div className="user-profile-avatar-placeholder">
              {profileUser.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="user-profile-info">
          <h1 className="user-profile-name">{profileUser.username}</h1>
          <p className="user-profile-description">{profileUser.description || '这个用户很懒，什么都没有写...'}</p>

          <div className="user-profile-stats">
            <div className="stat-item">
              <span className="stat-value">{profileUser.followersCount}</span>
              <span className="stat-label">粉丝</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{profileUser.followingCount}</span>
              <span className="stat-label">关注</span>
            </div>
          </div>

          {!isSelf && (
            <div className="user-profile-actions">
              <button
                className={`follow-btn ${following ? 'following' : ''}`}
                onClick={handleFollowToggle}
                disabled={actionLoading}
              >
                {actionLoading ? '处理中...' : following ? '已关注' : '+ 关注'}
              </button>
              <button
                className={`friend-btn ${friendStatus === 'friends' ? 'is-friend' : friendStatus === 'request_sent' ? 'pending' : ''}`}
                onClick={handleFriendAction}
                disabled={actionLoading || friendStatus === 'request_sent'}
              >
                {actionLoading ? '处理中...' : getFriendBtnText()}
              </button>
            </div>
          )}

          <p className="user-profile-joined">
            加入时间: {new Date(profileUser.createdAt).toLocaleDateString('zh-CN')}
          </p>
        </div>
      </div>
    </div>
  );
}
