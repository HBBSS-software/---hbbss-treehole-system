import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Post.css';

export default function Post({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      const postRes = await axios.get(`/api/posts/${id}`);
      setPost(postRes.data);
      setLiked(postRes.data.likes?.includes(user._id) || false);
      const commentsRes = await axios.get(`/api/comments/post/${id}`);
      setComments(commentsRes.data);
    } catch (err) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/posts/${id}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setLiked(true);
      setPost({ ...post, likes: [...(post.likes || []), user._id] });
    } catch (err) {
      setError('点赞失败');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/comments', { content: commentText, postId: id }, { headers: { Authorization: `Bearer ${token}` } });
      setCommentText('');
      fetchData();
    } catch (err) {
      setError('评论失败');
    }
  };

  const handleCommentLike = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/comments/${commentId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) {
      setError('点赞失败');
    }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (!post) return <div className="error">帖子不存在</div>;

  return (
    <div className="post-container">
      <button className="back-btn" onClick={() => navigate(-1)}>← 返回</button>

      <div className="post-detail">
        <h1>{post.title}</h1>
        <div className="post-meta">
          <span>
            作者:{' '}
            <Link to={`/user/${post.author?._id}`} className="author-link" onClick={e => e.stopPropagation()}>
              {post.author?.username}
            </Link>
          </span>
          <span>发布时间: {new Date(post.createdAt).toLocaleDateString()}</span>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="tags-row">
            {post.tags.map((tag, i) => (
              <span key={i} className="tag-pill">{tag}</span>
            ))}
          </div>
        )}

        <div className="post-content">
          {post.content && <p>{post.content}</p>}
          {post.images?.length > 0 && (
            <div className="images-gallery">
              {post.images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`图片${i + 1}`}
                  className="clickable-image"
                  onClick={() => setLightboxImg(img)}
                />
              ))}
            </div>
          )}
          {post.poll && (
            <div className="poll-section">
              <h3>{post.poll.question}</h3>
              <div className="poll-options">
                {post.poll.options?.map((opt, i) => (
                  <div key={i} className="poll-option">
                    <label>
                      <input type="radio" name="poll" />
                      {opt}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="post-actions">
          <button onClick={handleLike} className={`like-btn ${liked ? 'liked' : ''}`}>
            ❤️ {post.likes?.length || 0}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="comments-section">
        <h2>评论 ({comments.length})</h2>
        <form onSubmit={handleComment} className="comment-form">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            required
            placeholder="输入评论..."
            rows="3"
          />
          <button type="submit">发表评论</button>
        </form>
        <div className="comments-list">
          {comments.length === 0 ? (
            <div className="empty-state">暂无评论</div>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="comment-item">
                <div className="comment-header">
                  <strong>
                    <Link to={`/user/${comment.author?._id}`} className="author-link">
                      {comment.author?.username}
                    </Link>
                  </strong>
                  <span className="time">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="comment-text">{comment.content}</p>
                <button onClick={() => handleCommentLike(comment._id)} className="comment-like">
                  👍 {comment.likes?.length || 0}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {lightboxImg && (
        <div className="lightbox-overlay" onClick={() => setLightboxImg(null)}>
          <button className="lightbox-close" onClick={() => setLightboxImg(null)}>✕</button>
          <img src={lightboxImg} alt="预览" className="lightbox-image" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
