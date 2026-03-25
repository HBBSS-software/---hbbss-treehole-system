import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './Section.css';

export default function Section({ user }) {
  const { id } = useParams();
  const [section, setSection] = useState(null);
  const [posts, setPosts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [tagsInput, setTagsInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    checkSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      const sectionRes = await axios.get(`/api/sections/${id}`);
      setSection(sectionRes.data);
      const postsRes = await axios.get(`/api/posts/section/${id}`);
      setPosts(postsRes.data);
    } catch (err) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/sections/subscribed', { headers: { Authorization: `Bearer ${token}` } });
      setSubscribed(res.data.some(s => s._id === id));
    } catch (_) {}
  };

  const handleSubscribe = async () => {
    try {
      const token = localStorage.getItem('token');
      if (subscribed) {
        await axios.post(`/api/sections/${id}/unsubscribe`, {}, { headers: { Authorization: `Bearer ${token}` } });
        setSubscribed(false);
      } else {
        await axios.post(`/api/sections/${id}/subscribe`, {}, { headers: { Authorization: `Bearer ${token}` } });
        setSubscribed(true);
      }
    } catch (err) {
      setError('操作失败');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const postData = {
        title,
        content: postType === 'text' ? content : '',
        images: postType === 'image' ? [content] : [],
        sectionId: id,
        tags,
        poll: postType === 'poll' ? {
          question: pollQuestion,
          options: pollOptions.filter(opt => opt.trim())
        } : null
      };
      await axios.post('/api/posts', postData, { headers: { Authorization: `Bearer ${token}` } });
      setTitle(''); setContent(''); setPollQuestion(''); setPollOptions(['', '']); setTagsInput('');
      setShowModal(false);
      if (user.role === 'admin') { fetchData(); }
      else { alert('帖子发布成功！需要管理员审核后才能显示。'); }
    } catch (err) {
      setError(err.response?.data || '发布失败');
    }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (!section) return <div className="error">分区不存在</div>;

  return (
    <div className="section-container">
      <div className="section-header">
        <div>
          <h1>{section.name}</h1>
          <p className="section-desc">{section.description}</p>
          <p className="moderator">吧主: {section.moderator?.username}</p>
        </div>
        <div className="section-actions">
          <button
            className={`subscribe-btn ${subscribed ? 'subscribed' : ''}`}
            onClick={handleSubscribe}
          >
            {subscribed ? '✓ 已订阅' : '+ 订阅'}
          </button>
          <button className="post-btn" onClick={() => setShowModal(true)}>
            + 发布内容
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>发布新内容</h2>
            <form onSubmit={handleCreatePost}>
              <div className="form-group">
                <label>标题</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="输入标题" />
              </div>
              <div className="form-group">
                <label>内容类型</label>
                <select value={postType} onChange={(e) => setPostType(e.target.value)}>
                  <option value="text">文字</option>
                  <option value="image">图片</option>
                  <option value="poll">投票</option>
                </select>
              </div>
              {postType === 'text' && (
                <div className="form-group">
                  <label>内容</label>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} required placeholder="输入内容" rows="6" />
                </div>
              )}
              {postType === 'image' && (
                <div className="form-group">
                  <label>图片URL</label>
                  <input type="url" value={content} onChange={(e) => setContent(e.target.value)} required placeholder="输入图片URL" />
                </div>
              )}
              {postType === 'poll' && (
                <>
                  <div className="form-group">
                    <label>投票问题</label>
                    <input type="text" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} required placeholder="输入投票问题" />
                  </div>
                  <div className="form-group">
                    <label>投票选项</label>
                    {pollOptions.map((opt, i) => (
                      <input key={i} type="text" value={opt} onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[i] = e.target.value;
                        setPollOptions(newOpts);
                      }} placeholder={`选项 ${i + 1}`} />
                    ))}
                  </div>
                </>
              )}
              <div className="form-group">
                <label>标签（逗号分隔）</label>
                <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="例如: 技术, 生活, 学习" />
              </div>
              <div className="modal-buttons">
                <button type="submit">发布</button>
                <button type="button" onClick={() => setShowModal(false)}>取消</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="posts-list">
        <h2>所有帖子</h2>
        {posts.length === 0 ? (
          <div className="empty-state">暂无帖子</div>
        ) : (
          posts.map((post) => (
            <Link key={post._id} to={`/post/${post._id}`} className="post-item">
              <h3>{post.title}</h3>
              <p className="post-preview">{post.content?.substring(0, 100) || '(图片/投票内容)'}</p>
              {post.tags && post.tags.length > 0 && (
                <div className="tags-row">
                  {post.tags.map((tag, i) => (
                    <span key={i} className="tag-pill">{tag}</span>
                  ))}
                </div>
              )}
              <div className="post-meta">
                <span>作者: {post.author?.username}</span>
                <span>❤️ {post.likes?.length || 0}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
