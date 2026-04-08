import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Favorites.css';

export default function Favorites({ user }) {
  var navigate = useNavigate();
  var [favorites, setFavorites] = useState([]);
  var [loading, setLoading] = useState(true);
  var token = localStorage.getItem('token');
  var headers = { Authorization: 'Bearer ' + token };

  useEffect(function() { fetchFavorites(); }, []);

  function fetchFavorites() {
    axios.get('/api/posts/user/favorites', { headers: headers })
      .then(function(res) { setFavorites(res.data); })
      .catch(function() {})
      .finally(function() { setLoading(false); });
  }

  function handleRemove(postId) {
    axios.post('/api/posts/' + postId + '/favorite', {}, { headers: headers })
      .then(function() {
        setFavorites(function(prev) {
          return prev.filter(function(p) { return p._id !== postId; });
        });
      })
      .catch(function() {});
  }

  if (loading) return React.createElement('div', { className: 'loading' }, '\u52A0\u8F7D\u4E2D...');

  return React.createElement('div', { className: 'favorites-container' },
    React.createElement('div', { className: 'favorites-header' },
      React.createElement('button', { className: 'back-btn', onClick: function() { navigate(-1); } }, '\u2190 \u8FD4\u56DE'),
      React.createElement('h1', null, '\u2B50 \u6211\u7684\u6536\u85CF (' + favorites.length + ')')
    ),
    favorites.length === 0
      ? React.createElement('div', { className: 'empty-state' }, '\u8FD8\u6CA1\u6709\u6536\u85CF\u4EFB\u4F55\u5E16\u5B50')
      : React.createElement('div', { className: 'favorites-list' },
          favorites.map(function(post) {
            if (!post) return null;
            var author = post.author;
            return React.createElement('div', { key: post._id, className: 'favorite-item' },
              React.createElement('div', { className: 'favorite-content' },
                React.createElement(Link, { to: '/post/' + post._id, className: 'favorite-title' }, post.title || '\u65E0\u6807\u9898'),
                React.createElement('div', { className: 'favorite-meta' },
                  React.createElement('span', null, '\u4F5C\u8005: ' + (author && author.username ? author.username : '\u672A\u77E5')),
                  React.createElement('span', null, new Date(post.createdAt).toLocaleDateString()),
                  React.createElement('span', null, '\u2764\uFE0F ' + ((post.likes && post.likes.length) || 0))
                ),
                post.content ? React.createElement('p', { className: 'favorite-preview' }, post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '')) : null
              ),
              React.createElement('button', {
                className: 'remove-fav-btn',
                onClick: function() { handleRemove(post._id); },
                title: '\u53D6\u6D88\u6536\u85CF'
              }, '\u2716')
            );
          })
        )
  );
}