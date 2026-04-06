import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Post.css';

export default function Post({ user }) {
    var params = useParams();
    var id = params.id;
    var navigate = useNavigate();
    var [post, setPost] = useState(null);
    var [comments, setComments] = useState([]);
    var [commentText, setCommentText] = useState('');
    var [liked, setLiked] = useState(false);
    var [loading, setLoading] = useState(true);
    var [error, setError] = useState('');
    var [lightboxImg, setLightboxImg] = useState(null);

    var token = localStorage.getItem('token');
    var headers = { Authorization: 'Bearer ' + token };

    useEffect(function() { fetchData(); }, [id]);

    function fetchData() {
        Promise.all([
            axios.get('/api/posts/' + id),
            axios.get('/api/comments/post/' + id)
        ]).then(function(results) {
            var p = results[0].data;
            setPost(p);
            setLiked(p.likes && p.likes.includes(user._id) ? true : false);
            setComments(results[1].data);
        }).catch(function() {
            setError('\u52A0\u8F7D\u5931\u8D25');
        }).finally(function() { setLoading(false); });
    }

    function handleLike() {
        axios.post('/api/posts/' + id + '/like', {}, { headers: headers })
            .then(function(res) {
                var isLiked = res.data === 'Liked';
                setLiked(isLiked);
                setPost(function(prev) {
                    var prevLikes = prev.likes || [];
                    if (isLiked) {
                        return Object.assign({}, prev, { likes: prevLikes.concat([user._id]) });
                    } else {
                        return Object.assign({}, prev, { likes: prevLikes.filter(function(lid) { return lid !== user._id; }) });
                    }
                });
            })
            .catch(function() { setError('\u70B9\u8D5E\u5931\u8D25'); });
    }

    function handleComment(e) {
        e.preventDefault();
        setError('');
        axios.post('/api/comments', { content: commentText, postId: id }, { headers: headers })
            .then(function() { setCommentText('');
                fetchData(); })
            .catch(function() { setError('\u8BC4\u8BBA\u5931\u8D25'); });
    }

    function handleCommentLike(commentId) {
        axios.post('/api/comments/' + commentId + '/like', {}, { headers: headers })
            .then(function() { fetchData(); })
            .catch(function() { setError('\u70B9\u8D5E\u5931\u8D25'); });
    }

    if (loading) return React.createElement('div', { className: 'loading' }, '\u52A0\u8F7D\u4E2D...');
    if (!post) return React.createElement('div', { className: 'error' }, '\u5E16\u5B50\u4E0D\u5B58\u5728');

    function renderTitleBadge(author) {
        if (!author || !author.title) return null;
        return React.createElement('span', {
            className: 'author-title-badge',
            style: { borderColor: author.titleColor || '#667eea', color: author.titleColor || '#667eea' }
        }, author.title);
    }

    return React.createElement('div', { className: 'post-container' },
        React.createElement('button', { className: 'back-btn', onClick: function() { navigate(-1); } }, '\u2190 \u8FD4\u56DE'),
        React.createElement('div', { className: 'post-detail' },
            React.createElement('h1', null, post.title),
            React.createElement('div', { className: 'post-meta' },
                React.createElement('span', null,
                    '\u4F5C\u8005: ',
                    React.createElement(Link, { to: '/user/' + (post.author && post.author._id), className: 'author-link' }, post.author && post.author.username),
                    renderTitleBadge(post.author)
                ),
                React.createElement('span', null, '\u53D1\u5E03\u65F6\u95F4: ' + new Date(post.createdAt).toLocaleDateString())
            ),
            post.tags && post.tags.length > 0 ?
            React.createElement('div', { className: 'tags-row' },
                post.tags.map(function(tag, i) {
                    return React.createElement('span', { key: i, className: 'tag-pill' }, tag);
                })
            ) :
            null,
            React.createElement('div', { className: 'post-content' },
                post.content ? React.createElement('p', null, post.content) : null,
                post.images && post.images.length > 0 ?
                React.createElement('div', { className: 'images-gallery' },
                    post.images.map(function(img, i) {
                        return React.createElement('img', {
                            key: i,
                            src: img,
                            alt: '\u56FE\u7247' + (i + 1),
                            className: 'clickable-image',
                            onClick: function() { setLightboxImg(img); }
                        });
                    })
                ) :
                null,
                post.poll ?
                React.createElement('div', { className: 'poll-section' },
                    React.createElement('h3', null, post.poll.question),
                    React.createElement('div', { className: 'poll-options' },
                        post.poll.options ? post.poll.options.map(function(opt, i) {
                            return React.createElement('div', { key: i, className: 'poll-option' },
                                React.createElement('label', null,
                                    React.createElement('input', { type: 'radio', name: 'poll' }),
                                    opt
                                )
                            );
                        }) : null
                    )
                ) :
                null
            ),
            React.createElement('div', { className: 'post-actions' },
                React.createElement('button', { onClick: handleLike, className: 'like-btn' + (liked ? ' liked' : '') },
                    '\u2764\uFE0F ' + ((post.likes && post.likes.length) || 0)
                )
            )
        ),
        error ? React.createElement('div', { className: 'error-message' }, error) : null,
        React.createElement('div', { className: 'comments-section' },
            React.createElement('h2', null, '\u8BC4\u8BBA(' + comments.length + ')'),
            React.createElement('form', { onSubmit: handleComment, className: 'comment-form' },
                React.createElement('textarea', {
                    value: commentText,
                    onChange: function(e) { setCommentText(e.target.value); },
                    required: true,
                    placeholder: '\u8F93\u5165\u8BC4\u8BBA...',
                    rows: 3
                }),
                React.createElement('button', { type: 'submit' }, '\u53D1\u8868\u8BC4\u8BBA')
            ),
            React.createElement('div', { className: 'comments-list' },
                comments.length === 0 ?
                React.createElement('div', { className: 'empty-state' }, '\u6682\u65E0\u8BC4\u8BBA') :
                comments.map(function(comment) {
                    return React.createElement('div', { key: comment._id, className: 'comment-item' },
                        React.createElement('div', { className: 'comment-header' },
                            React.createElement('strong', null,
                                React.createElement(Link, { to: '/user/' + (comment.author && comment.author._id), className: 'author-link' }, comment.author && comment.author.username)
                            ),
                            React.createElement('span', { className: 'time' }, new Date(comment.createdAt).toLocaleDateString())
                        ),
                        React.createElement('p', { className: 'comment-text' }, comment.content),
                        React.createElement('button', { onClick: function() { handleCommentLike(comment._id); }, className: 'comment-like' },
                            '\uD83D\uDC4D ' + ((comment.likes && comment.likes.length) || 0)
                        )
                    );
                })
            )
        ),
        lightboxImg ?
        React.createElement('div', { className: 'lightbox-overlay', onClick: function() { setLightboxImg(null); } },
            React.createElement('button', { className: 'lightbox-close', onClick: function() { setLightboxImg(null); } }, '\u2715'),
            React.createElement('img', { src: lightboxImg, alt: '\u9884\u89C8', className: 'lightbox-image', onClick: function(e) { e.stopPropagation(); } })
        ) :
        null
    );
}