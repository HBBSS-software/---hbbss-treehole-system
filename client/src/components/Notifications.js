import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Notifications.css';

const typeLabels = {
  like_post: '赞了你的帖子',
  like_comment: '赞了你的评论',
  comment: '评论了你的帖子',
  follow: '关注了你',
  friend_request: '请求添加你为好友',
  friend_accept: '接受了你的好友请求'
};

export default function Notifications({ user, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(res.data);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/notifications/read-all', {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (_) {}
  };

  const markRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (_) {}
  };

  return (
    <div className="notifications-dropdown">
      <div className="notifications-header">
        <span>消息通知</span>
        <div className="notif-header-actions">
          <button className="mark-all-btn" onClick={markAllRead}>全部已读</button>
          <button className="notif-close-btn" onClick={onClose}>✕</button>
        </div>
      </div>
      <div className="notifications-list">
        {loading ? (
          <div className="notif-loading">加载中...</div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty">暂无通知</div>
        ) : (
          notifications.map(n => (
            <div
              key={n._id}
              className={`notif-item ${n.read ? 'read' : 'unread'}`}
              onClick={() => !n.read && markRead(n._id)}
            >
              <div className="notif-avatar">
                {n.sender?.avatar ? (
                  <img src={n.sender.avatar} alt={n.sender.username} />
                ) : (
                  <div className="notif-avatar-placeholder">
                    {n.sender?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="notif-body">
                <span className="notif-sender">{n.sender?.username}</span>
                {' '}{typeLabels[n.type] || n.type}
                {n.post?.title && <span className="notif-post-title">「{n.post.title}」</span>}
                <div className="notif-time">{new Date(n.createdAt).toLocaleDateString('zh-CN')}</div>
              </div>
              {!n.read && <div className="notif-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
