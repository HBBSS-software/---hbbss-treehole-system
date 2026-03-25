import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

export default function Home({ user }) {
  const [sections, setSections] = useState([]);
  const [subscribedSections, setSubscribedSections] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchSections(); fetchSubscribed(); }, []);

  const fetchSections = async () => {
    try {
      const response = await axios.get('/api/sections');
      setSections(response.data);
    } catch (err) { setError('加载分区失败'); }
    finally { setLoading(false); }
  };

  const fetchSubscribed = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/sections/subscribed', { headers: { Authorization: `Bearer ${token}` } });
      setSubscribedSections(response.data);
    } catch (err) { /* not critical */ }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/sections', { name, description }, { headers: { Authorization: `Bearer ${token}` } });
      setName(''); setDescription(''); setShowModal(false);
      if (user.role === 'admin') { fetchSections(); }
      else { alert('分区创建成功！需要管理员审核后才能显示。'); }
    } catch (err) { setError(err.response?.data?.message || '创建失败'); }
  };

  const filteredSections = () => {
    const source = activeTab === 'subscribed' ? subscribedSections : sections;
    if (!searchQuery.trim()) return source;
    const q = searchQuery.toLowerCase();
    return source.filter(s =>
      s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
    );
  };

  if (loading) return <div className="loading">加载中...</div>;
  return (
    <div className="home-container">
      <div className="home-header">
        <h1>分区列表</h1>
        <button className="create-btn" onClick={() => setShowModal(true)}>+ 创建新分区</button>
      </div>

      <div className="home-controls">
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >全部分区</button>
          <button
            className={`tab-btn ${activeTab === 'subscribed' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscribed')}
          >我的订阅</button>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="搜索分区..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>创建新分区</h2>
            <form onSubmit={handleCreateSection}>
              <div className="form-group">
                <label>分区名称</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="输入分区名称" />
              </div>
              <div className="form-group">
                <label>分区描述</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="输入分区描述" rows="4" />
              </div>
              <div className="modal-buttons">
                <button type="submit">创建</button>
                <button type="button" onClick={() => setShowModal(false)}>取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="sections-grid">
        {filteredSections().length === 0 ? (
          <div className="empty-state">
            {activeTab === 'subscribed' ? '暂无订阅，去分区页面订阅吧！' : '暂无分区，快去创建一个吧！'}
          </div>
        ) : (
          filteredSections().map((section) => (
            <Link key={section._id} to={`/section/${section._id}`} className="section-card">
              <h3>{section.name}</h3>
              <p className="description">{section.description || '暂无描述'}</p>
              <p className="moderator">吧主: {section.moderator?.username || '未知'}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
