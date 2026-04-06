import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './Section.css';

export default function Section({ user }) {
  var params = useParams();
  var id = params.id;
  var [section, setSection] = useState(null);
  var [posts, setPosts] = useState([]);
  var [showModal, setShowModal] = useState(false);
  var [title, setTitle] = useState('');
  var [content, setContent] = useState('');
  var [postType, setPostType] = useState('text');
  var [pollQuestion, setPollQuestion] = useState('');
  var [pollOptions, setPollOptions] = useState(['', '']);
  var [tagsInput, setTagsInput] = useState('');
  var [subscribed, setSubscribed] = useState(false);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState('');

  var token = localStorage.getItem('token');
  var headers = { Authorization: 'Bearer ' + token };

  useEffect(function() { fetchData(); checkSubscription(); }, [id]);

  function fetchData() {
    Promise.all([
      axios.get('/api/sections/' + id),
      axios.get('/api/posts/section/' + id)
    ]).then(function(results) {
      setSection(results[0].data);
      setPosts(results[1].data);
    }).catch(function() {
      setError('\u52A0\u8F7D\u5931\u8D25');
    }).finally(function() { setLoading(false); });
  }

  function checkSubscription() {
    axios.get('/api/sections/subscribed', { headers: headers })
      .then(function(res) { setSubscribed(res.data.some(function(s) { return s._id === id; })); })
      .catch(function() {});
  }

  function handleSubscribe() {
    if (subscribed) {
      axios.post('/api/sections/' + id + '/unsubscribe', {}, { headers: headers })
        .then(function() { setSubscribed(false); })
        .catch(function() { setError('\u64CD\u4F5C\u5931\u8D25'); });
    } else {
      axios.post('/api/sections/' + id + '/subscribe', {}, { headers: headers })
        .then(function() { setSubscribed(true); })
        .catch(function() { setError('\u64CD\u4F5C\u5931\u8D25'); });
    }
  }

  function handleCreatePost(e) {
    e.preventDefault();
    setError('');
    var tags = tagsInput.split(',').map(function(t) { return t.trim(); }).filter(Boolean);
    var postData = {
      title: title,
      content: postType === 'text' ? content : '',
      images: postType === 'image' ? [content] : [],
      sectionId: id,
      tags: tags,
      poll: postType === 'poll' ? { question: pollQuestion, options: pollOptions.filter(function(o) { return o.trim(); }) } : null
    };
    axios.post('/api/posts', postData, { headers: headers })
      .then(function() {
        setTitle(''); setContent(''); setPollQuestion(''); setPollOptions(['', '']); setTagsInput('');
        setShowModal(false);
        if (user.role === 'admin') { fetchData(); }
        else { alert('\u5E16\u5B50\u53D1\u5E03\u6210\u529F\uFF01\u9700\u8981\u7BA1\u7406\u5458\u5BA1\u6838\u540E\u624D\u80FD\u663E\u793A\u3002'); }
      })
      .catch(function(err) {
        setError((err.response && err.response.data) || '\u53D1\u5E03\u5931\u8D25');
      });
  }

  function renderTitleBadge(author) {
    if (!author || !author.title) return null;
    return React.createElement('span', {
      className: 'author-title-badge',
      style: { borderColor: author.titleColor || '#667eea', color: author.titleColor || '#667eea' }
    }, author.title);
  }

  if (loading) return React.createElement('div', {className: 'loading'}, '\u52A0\u8F7D\u4E2D...');
  if (!section) return React.createElement('div', {className: 'error'}, '\u5206\u533A\u4E0D\u5B58\u5728');

  function renderModal() {
    if (!showModal) return null;
    var formChildren = [
      React.createElement('div', {key: 'fg-title', className: 'form-group'},
        React.createElement('label', null, '\u6807\u9898'),
        React.createElement('input', {type: 'text', value: title, onChange: function(e) { setTitle(e.target.value); }, required: true, placeholder: '\u8F93\u5165\u6807\u9898'})
      ),
      React.createElement('div', {key: 'fg-type', className: 'form-group'},
        React.createElement('label', null, '\u5185\u5BB9\u7C7B\u578B'),
        React.createElement('select', {value: postType, onChange: function(e) { setPostType(e.target.value); }},
          React.createElement('option', {value: 'text'}, '\u6587\u5B57'),
          React.createElement('option', {value: 'image'}, '\u56FE\u7247'),
          React.createElement('option', {value: 'poll'}, '\u6295\u7968')
        )
      )
    ];
    if (postType === 'text') {
      formChildren.push(React.createElement('div', {key: 'fg-content', className: 'form-group'},
        React.createElement('label', null, '\u5185\u5BB9'),
        React.createElement('textarea', {value: content, onChange: function(e) { setContent(e.target.value); }, required: true, placeholder: '\u8F93\u5165\u5185\u5BB9', rows: 6})
      ));
    }
    if (postType === 'image') {
      formChildren.push(React.createElement('div', {key: 'fg-image', className: 'form-group'},
        React.createElement('label', null, '\u56FE\u7247URL'),
        React.createElement('input', {type: 'url', value: content, onChange: function(e) { setContent(e.target.value); }, required: true, placeholder: '\u8F93\u5165\u56FE\u7247URL'})
      ));
    }
    if (postType === 'poll') {
      formChildren.push(React.createElement('div', {key: 'fg-poll-q', className: 'form-group'},
        React.createElement('label', null, '\u6295\u7968\u95EE\u9898'),
        React.createElement('input', {type: 'text', value: pollQuestion, onChange: function(e) { setPollQuestion(e.target.value); }, required: true, placeholder: '\u8F93\u5165\u6295\u7968\u95EE\u9898'})
      ));
      formChildren.push(React.createElement('div', {key: 'fg-poll-opts', className: 'form-group'},
        React.createElement('label', null, '\u6295\u7968\u9009\u9879'),
        pollOptions.map(function(opt, i) {
          return React.createElement('input', {key: i, type: 'text', value: opt, onChange: function(e) {
            var newOpts = pollOptions.slice();
            newOpts[i] = e.target.value;
            setPollOptions(newOpts);
          }, placeholder: '\u9009\u9879 ' + (i + 1)});
        })
      ));
    }
    formChildren.push(React.createElement('div', {key: 'fg-tags', className: 'form-group'},
      React.createElement('label', null, '\u6807\u7B7E\uFF08\u9017\u53F7\u5206\u9694\uFF09'),
      React.createElement('input', {type: 'text', value: tagsInput, onChange: function(e) { setTagsInput(e.target.value); }, placeholder: '\u4F8B\u5982: \u6280\u672F, \u751F\u6D3B, \u5B66\u4E60'})
    ));
    formChildren.push(React.createElement('div', {key: 'fg-btns', className: 'modal-buttons'},
      React.createElement('button', {type: 'submit'}, '\u53D1\u5E03'),
      React.createElement('button', {type: 'button', onClick: function() { setShowModal(false); }}, '\u53D6\u6D88')
    ));

    return React.createElement('div', {className: 'modal'},
      React.createElement('div', {className: 'modal-content'},
        React.createElement('h2', null, '\u53D1\u5E03\u65B0\u5185\u5BB9'),
        React.createElement('form', {onSubmit: handleCreatePost}, formChildren)
      )
    );
  }

  return React.createElement('div', {className: 'section-container'},
    React.createElement('div', {className: 'section-header'},
      React.createElement('div', null,
        React.createElement('h1', null, section.name),
        React.createElement('p', {className: 'section-desc'}, section.description),
        React.createElement('p', {className: 'moderator'}, '\u5427\u4E3B: ' + (section.moderator && section.moderator.username || ''))
      ),
      React.createElement('div', {className: 'section-actions'},
        React.createElement('button', {className: 'subscribe-btn' + (subscribed ? ' subscribed' : ''), onClick: handleSubscribe}, subscribed ? '\u2713 \u5DF2\u8BA2\u9605' : '+ \u8BA2\u9605'),
        React.createElement('button', {className: 'post-btn', onClick: function() { setShowModal(true); }}, '+ \u53D1\u5E03\u5185\u5BB9')
      )
    ),
    error ? React.createElement('div', {className: 'error-message'}, error) : null,
    renderModal(),
    React.createElement('div', {className: 'posts-list'},
      React.createElement('h2', null, '\u6240\u6709\u5E16\u5B50'),
      posts.length === 0
        ? React.createElement('div', {className: 'empty-state'}, '\u6682\u65E0\u5E16\u5B50')
        : posts.map(function(post) {
            return React.createElement(Link, {key: post._id, to: '/post/' + post._id, className: 'post-item'},
              React.createElement('h3', null, post.title),
              React.createElement('p', {className: 'post-preview'}, (post.content && post.content.substring(0, 100)) || '(\u56FE\u7247/\u6295\u7968\u5185\u5BB9)'),
              post.tags && post.tags.length > 0
                ? React.createElement('div', {className: 'tags-row'},
                    post.tags.map(function(tag, i) {
                      return React.createElement('span', {key: i, className: 'tag-pill'}, tag);
                    })
                  )
                : null,
              React.createElement('div', {className: 'post-meta'},
                React.createElement('span', null, '\u4F5C\u8005: ' + (post.author && post.author.username || ''), renderTitleBadge(post.author)),
                React.createElement('span', null, '\u2764\uFE0F ' + ((post.likes && post.likes.length) || 0))
              )
            );
          })
    )
  );
}