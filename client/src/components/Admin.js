import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Admin.css';

export default function Admin({ user }) {
  const [sections, setSections] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('sections');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (activeTab === 'sections') {
        const res = await axios.get('/api/sections/admin/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSections(res.data);
      } else if (activeTab === 'posts') {
        const res = await axios.get('/api/posts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPosts(res.data);
      }
    } catch (err) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSection = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/sections/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      setError('审批失败');
    }
  };

  const handleApprovePost = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/posts/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      setError('审批失败');
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div className="admin-container">
      <h1>管理后台</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'sections' ? 'active' : ''}`}
          onClick={() => setActiveTab('sections')}
        >
          待审核分区
        </button>
        <button 
          className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          待审核帖子
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'sections' && (
          <div className="sections-list">
            {sections.filter(s => s.status === 'pending').length === 0 ? (
              <div className="empty-state">没有待审核的分区</div>
            ) : (
              sections
                .filter(s => s.status === 'pending')
                .map((section) => (
                  <div key={section._id} className="review-item">
                    <div className="item-content">
                      <h3>{section.name}</h3>
                      <p>{section.description}</p>
                      <p className="creator">创建者: {section.creator?.username}</p>
                    </div>
                    <button 
                      onClick={() => handleApproveSection(section._id)}
                      className="approve-btn"
                    >
                      ✓ 审核通过
                    </button>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="posts-list">
            {posts.filter(p => p.status === 'pending').length === 0 ? (
              <div className="empty-state">没有待审核的帖子</div>
            ) : (
              posts
                .filter(p => p.status === 'pending')
                .map((post) => (
                  <div key={post._id} className="review-item">
                    <div className="item-content">
                      <h3>{post.title}</h3>
                      <p>{post.content?.substring(0, 100) || '(非文字内容)'}</p>
                      <p className="creator">作者: {post.author?.username}</p>
                    </div>
                    <button 
                      onClick={() => handleApprovePost(post._id)}
                      className="approve-btn"
                    >
                      ✓ 审核通过
                    </button>
                  </div>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}