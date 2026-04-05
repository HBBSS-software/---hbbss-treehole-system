import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Friends.css';

export default function Friends({ user }) {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [friendsRes, receivedRes, sentRes] = await Promise.all([
        axios.get('/api/friends/list', { headers }),
        axios.get('/api/friends/requests/received', { headers }),
        axios.get('/api/friends/requests/sent', { headers })
      ]);
      setFriends(friendsRes.data);
      setReceivedRequests(receivedRes.data);
      setSentRequests(sentRes.data);
    } catch (err) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      await axios.post(`/api/friends/accept/${requestId}`, {}, { headers });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || '操作失败');
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleReject = async (requestId) => {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      await axios.post(`/api/friends/reject/${requestId}`, {}, { headers });
      setReceivedRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      setError(err.response?.data?.message || '操作失败');
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('确定要删除该好友吗？')) return;
    setActionLoading(prev => ({ ...prev, [friendId]: true }));
    try {
      await axios.delete(`/api/friends/${friendId}`, { headers });
      setFriends(prev => prev.filter(f => f._id !== friendId));
    } catch (err) {
      setError(err.response?.data?.message || '操作失败');
    } finally {
      setActionLoading(prev => ({ ...prev, [friendId]: false }));
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div className="friends-container">
      <div className="friends-header">
        <h1>好友</h1>
      </div>

      <div className="friends-tabs">
        <button
          className={`friends-tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          我的好友 ({friends.length})
        </button>
        <button
          className={`friends-tab ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          收到的请求 {receivedRequests.length > 0 && <span className="tab-badge">{receivedRequests.length}</span>}
        </button>
        <button
          className={`friends-tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          发出的请求 ({sentRequests.length})
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="friends-content">
        {activeTab === 'friends' && (
          friends.length === 0 ? (
            <div className="friends-empty">还没有好友，去用户主页添加好友吧！</div>
          ) : (
            <div className="friends-list">
              {friends.map(friend => (
                <div key={friend._id} className="friend-card">
                  <Link to={`/user/${friend._id}`} className="friend-info">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt={friend.username} className="friend-avatar" />
                    ) : (
                      <div className="friend-avatar-placeholder">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="friend-details">
                      <span className="friend-name">{friend.username}</span>
                      <span className="friend-desc">{friend.description || '这个用户很懒，什么都没写...'}</span>
                    </div>
                  </Link>
                  <button
                    className="remove-friend-btn"
                    onClick={() => handleRemoveFriend(friend._id)}
                    disabled={actionLoading[friend._id]}
                  >
                    {actionLoading[friend._id] ? '处理中...' : '删除好友'}
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'received' && (
          receivedRequests.length === 0 ? (
            <div className="friends-empty">暂无好友请求</div>
          ) : (
            <div className="friends-list">
              {receivedRequests.map(req => (
                <div key={req._id} className="friend-card">
                  <Link to={`/user/${req.from._id}`} className="friend-info">
                    {req.from.avatar ? (
                      <img src={req.from.avatar} alt={req.from.username} className="friend-avatar" />
                    ) : (
                      <div className="friend-avatar-placeholder">
                        {req.from.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="friend-details">
                      <span className="friend-name">{req.from.username}</span>
                      {req.message && <span className="friend-message">留言: {req.message}</span>}
                      <span className="friend-time">{new Date(req.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </Link>
                  <div className="request-actions">
                    <button
                      className="accept-btn"
                      onClick={() => handleAccept(req._id)}
                      disabled={actionLoading[req._id]}
                    >
                      {actionLoading[req._id] ? '...' : '接受'}
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleReject(req._id)}
                      disabled={actionLoading[req._id]}
                    >
                      {actionLoading[req._id] ? '...' : '拒绝'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'sent' && (
          sentRequests.length === 0 ? (
            <div className="friends-empty">暂无发出的请求</div>
          ) : (
            <div className="friends-list">
              {sentRequests.map(req => (
                <div key={req._id} className="friend-card">
                  <Link to={`/user/${req.to._id}`} className="friend-info">
                    {req.to.avatar ? (
                      <img src={req.to.avatar} alt={req.to.username} className="friend-avatar" />
                    ) : (
                      <div className="friend-avatar-placeholder">
                        {req.to.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="friend-details">
                      <span className="friend-name">{req.to.username}</span>
                      {req.message && <span className="friend-message">留言: {req.message}</span>}
                      <span className="friend-time">{new Date(req.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </Link>
                  <span className="pending-label">等待对方处理</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
