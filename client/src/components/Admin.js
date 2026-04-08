import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Admin.css';

export default function Admin({ user }) {
    var [sections, setSections] = useState([]);
    var [posts, setPosts] = useState([]);
    var [allUsers, setAllUsers] = useState([]);
    var [activeTab, setActiveTab] = useState('sections');
    var [loading, setLoading] = useState(true);
    var [error, setError] = useState('');
    var [titleInputs, setTitleInputs] = useState({});
    var [colorInputs, setColorInputs] = useState({});
    var [announcements, setAnnouncements] = useState([]);
    var [annTitle, setAnnTitle] = useState('');
    var [annContent, setAnnContent] = useState('');

    var token = localStorage.getItem('token');
    var headers = { Authorization: 'Bearer ' + token };

    useEffect(function() { fetchData(); }, [activeTab]);

    function fetchData() {
        setLoading(true);
        setError('');
        if (activeTab === 'sections') {
            axios.get('/api/sections/admin/all', { headers: headers })
                .then(function(res) { setSections(res.data); })
                .catch(function() { setError('\u52A0\u8F7D\u5931\u8D25'); })
                .finally(function() { setLoading(false); });
        } else if (activeTab === 'posts') {
            axios.get('/api/posts', { headers: headers })
                .then(function(res) { setPosts(res.data); })
                .catch(function() { setError('\u52A0\u8F7D\u5931\u8D25'); })
                .finally(function() { setLoading(false); });
        } else if (activeTab === 'titles') {
            axios.get('/api/auth/all-users', { headers: headers })
                .then(function(res) {
                    setAllUsers(res.data);
                    var ti = {};
                    var ci = {};
                    res.data.forEach(function(u) {
                        ti[u._id] = u.title || '';
                        ci[u._id] = u.titleColor || '#667eea';
                    });
                    setTitleInputs(ti);
                    setColorInputs(ci);
                })
                .catch(function() { setError('\u52A0\u8F7D\u5931\u8D25'); })
                .finally(function() { setLoading(false); });
        } else if (activeTab === 'announcements') {
            axios.get('/api/announcements', { headers: headers })
                .then(function(res) { setAnnouncements(res.data); })
                .catch(function() { setError('\u52A0\u8F7D\u5931\u8D25'); })
                .finally(function() { setLoading(false); });
        }
    }

    function handleApproveSection(id) {
        axios.put('/api/sections/' + id + '/approve', {}, { headers: headers })
            .then(function() { fetchData(); })
            .catch(function() { setError('\u5BA1\u6279\u5931\u8D25'); });
    }

    function handleApprovePost(id) {
        axios.put('/api/posts/' + id + '/approve', {}, { headers: headers })
            .then(function() { fetchData(); })
            .catch(function() { setError('\u5BA1\u6279\u5931\u8D25'); });
    }

    function handleSetTitle(userId) {
        var t = titleInputs[userId] || '';
        var c = colorInputs[userId] || '#667eea';
        axios.put('/api/auth/title/' + userId, { title: t, titleColor: c }, { headers: headers })
            .then(function(res) {
                setAllUsers(function(prev) {
                    return prev.map(function(u) {
                        if (u._id === userId) return Object.assign({}, u, { title: res.data.title, titleColor: res.data.titleColor });
                        return u;
                    });
                });
                setError('');
                alert('\u79F0\u53F7\u8BBE\u7F6E\u6210\u529F');
            })
            .catch(function() { setError('\u8BBE\u7F6E\u5931\u8D25'); });
    }

    function handleRemoveTitle(userId) {
        axios.put('/api/auth/title/' + userId, { title: '', titleColor: '#667eea' }, { headers: headers })
            .then(function() {
                setAllUsers(function(prev) {
                    return prev.map(function(u) {
                        if (u._id === userId) return Object.assign({}, u, { title: '', titleColor: '#667eea' });
                        return u;
                    });
                });
                setTitleInputs(function(prev) { return Object.assign({}, prev, {
                        [userId]: '' }); });
                setColorInputs(function(prev) { return Object.assign({}, prev, {
                        [userId]: '#667eea' }); });
            })
            .catch(function() { setError('\u64CD\u4F5C\u5931\u8D25'); });
    }

    function handleCreateAnnouncement() {
        if (!annTitle || !annContent) { setError('\u8BF7\u586B\u5199\u6807\u9898\u548C\u5185\u5BB9'); return; }
        axios.post('/api/announcements', { title: annTitle, content: annContent }, { headers: headers })
            .then(function() { setAnnTitle('');
                setAnnContent('');
                fetchData(); })
            .catch(function() { setError('\u521B\u5EFA\u5931\u8D25'); });
    }

    function handleToggleAnnouncement(id) {
        axios.put('/api/announcements/' + id + '/toggle', {}, { headers: headers })
            .then(function() { fetchData(); })
            .catch(function() { setError('\u64CD\u4F5C\u5931\u8D25'); });
    }

    function handleDeleteAnnouncement(id) {
        axios.delete('/api/announcements/' + id, { headers: headers })
            .then(function() { fetchData(); })
            .catch(function() { setError('\u5220\u9664\u5931\u8D25'); });
    }

    function renderSections() {
        var pending = sections.filter(function(s) { return s.status === 'pending'; });
        if (pending.length === 0) return React.createElement('div', { className: 'empty-state' }, '\u6CA1\u6709\u5F85\u5BA1\u6838\u7684\u5206\u533A');
        return React.createElement('div', { className: 'sections-list' },
            pending.map(function(section) {
                return React.createElement('div', { key: section._id, className: 'review-item' },
                    React.createElement('div', { className: 'item-content' },
                        React.createElement('h3', null, section.name),
                        React.createElement('p', null, section.description),
                        React.createElement('p', { className: 'creator' }, '\u521B\u5EFA\u8005: ' + (section.creator && section.creator.username || ''))
                    ),
                    React.createElement('button', { onClick: function() { handleApproveSection(section._id); }, className: 'approve-btn' }, '\u2713 \u5BA1\u6838\u901A\u8FC7')
                );
            })
        );
    }

    function renderPosts() {
        var pending = posts.filter(function(p) { return p.status === 'pending'; });
        if (pending.length === 0) return React.createElement('div', { className: 'empty-state' }, '\u6CA1\u6709\u5F85\u5BA1\u6838\u7684\u5E16\u5B50');
        return React.createElement('div', { className: 'posts-list' },
            pending.map(function(post) {
                return React.createElement('div', { key: post._id, className: 'review-item' },
                    React.createElement('div', { className: 'item-content' },
                        React.createElement('h3', null, post.title),
                        React.createElement('p', null, (post.content && post.content.substring(0, 100)) || '(\u975E\u6587\u5B57\u5185\u5BB9)'),
                        React.createElement('p', { className: 'creator' }, '\u4F5C\u8005: ' + (post.author && post.author.username || ''))
                    ),
                    React.createElement('button', { onClick: function() { handleApprovePost(post._id); }, className: 'approve-btn' }, '\u2713 \u5BA1\u6838\u901A\u8FC7')
                );
            })
        );
    }

    function renderTitles() {
        if (allUsers.length === 0) return React.createElement('div', { className: 'empty-state' }, '\u6CA1\u6709\u7528\u6237');
        return React.createElement('div', { className: 'titles-list' },
            allUsers.map(function(u) {
                return React.createElement('div', { key: u._id, className: 'title-item' },
                    React.createElement('div', { className: 'title-user-info' },
                        u.avatar ?
                        React.createElement('img', { src: u.avatar, className: 'title-user-avatar', alt: u.username }) :
                        React.createElement('div', { className: 'title-user-avatar-ph' }, u.username.charAt(0).toUpperCase()),
                        React.createElement('div', null,
                            React.createElement('span', { className: 'title-username' }, u.username),
                            React.createElement('span', { className: 'title-uid' }, ' (UID: ' + u.uid + ')'),
                            u.title ? React.createElement('span', { className: 'user-title-badge', style: { borderColor: u.titleColor || '#667eea', color: u.titleColor || '#667eea' } }, u.title) : null
                        )
                    ),
                    React.createElement('div', { className: 'title-controls' },
                        React.createElement('input', {
                            type: 'text',
                            className: 'title-input',
                            placeholder: '\u8F93\u5165\u79F0\u53F7',
                            value: titleInputs[u._id] || '',
                            onChange: function(e) { setTitleInputs(function(prev) { return Object.assign({}, prev, {
                                        [u._id]: e.target.value }); }); }
                        }),
                        React.createElement('input', {
                            type: 'color',
                            className: 'title-color-input',
                            value: colorInputs[u._id] || '#667eea',
                            onChange: function(e) { setColorInputs(function(prev) { return Object.assign({}, prev, {
                                        [u._id]: e.target.value }); }); },
                            title: '\u79F0\u53F7\u8FB9\u6846\u989C\u8272'
                        }),
                        React.createElement('button', { className: 'title-save-btn', onClick: function() { handleSetTitle(u._id); } }, '\u4FDD\u5B58'),
                        u.title ? React.createElement('button', { className: 'title-remove-btn', onClick: function() { handleRemoveTitle(u._id); } }, '\u79FB\u9664') : null
                    )
                );
            })
        );
    }

    function renderAnnouncements() {
        return React.createElement('div', { className: 'announcements-admin' },
            React.createElement('div', { className: 'ann-create' },
                React.createElement('h3', null, '\u521B\u5EFA\u65B0\u901A\u62A5'),
                React.createElement('input', {
                    type: 'text',
                    className: 'ann-title-input',
                    placeholder: '\u901A\u62A5\u6807\u9898',
                    value: annTitle,
                    onChange: function(e) { setAnnTitle(e.target.value); }
                }),
                React.createElement('textarea', {
                    className: 'ann-content-input',
                    placeholder: '\u901A\u62A5\u5185\u5BB9',
                    rows: 4,
                    value: annContent,
                    onChange: function(e) { setAnnContent(e.target.value); }
                }),
                React.createElement('button', { className: 'ann-create-btn', onClick: handleCreateAnnouncement }, '\u53D1\u5E03\u901A\u62A5')
            ),
            React.createElement('div', { className: 'ann-list' },
                React.createElement('h3', null, '\u5386\u53F2\u901A\u62A5'),
                announcements.length === 0 ?
                React.createElement('div', { className: 'empty-state' }, '\u6682\u65E0\u901A\u62A5') :
                announcements.map(function(ann) {
                    return React.createElement('div', { key: ann._id, className: 'ann-item' + (ann.active ? ' ann-active' : '') },
                        React.createElement('div', { className: 'ann-item-header' },
                            React.createElement('strong', null, ann.title),
                            React.createElement('span', { className: 'ann-status' }, ann.active ? '\u751F\u6548\u4E2D' : '\u5DF2\u5173\u95ED'),
                            React.createElement('span', { className: 'ann-date' }, new Date(ann.createdAt).toLocaleDateString())
                        ),
                        React.createElement('p', { className: 'ann-item-content' }, ann.content),
                        React.createElement('div', { className: 'ann-item-actions' },
                            React.createElement('button', { className: 'ann-toggle-btn', onClick: function() { handleToggleAnnouncement(ann._id); } }, ann.active ? '\u5173\u95ED' : '\u542F\u7528'),
                            React.createElement('button', { className: 'ann-delete-btn', onClick: function() { handleDeleteAnnouncement(ann._id); } }, '\u5220\u9664')
                        )
                    );
                })
            )
        );
    }

    if (loading) return React.createElement('div', { className: 'loading' }, '\u52A0\u8F7D\u4E2D...');

    return React.createElement('div', { className: 'admin-container' },
        React.createElement('h1', null, '\u7BA1\u7406\u540E\u53F0'),
        error ? React.createElement('div', { className: 'error-message' }, error) : null,
        React.createElement('div', { className: 'admin-tabs' },
            React.createElement('button', { className: 'tab' + (activeTab === 'sections' ? ' active' : ''), onClick: function() { setActiveTab('sections'); } }, '\u5F85\u5BA1\u6838\u5206\u533A'),
            React.createElement('button', { className: 'tab' + (activeTab === 'posts' ? ' active' : ''), onClick: function() { setActiveTab('posts'); } }, '\u5F85\u5BA1\u6838\u5E16\u5B50'),
            React.createElement('button', { className: 'tab' + (activeTab === 'titles' ? ' active' : ''), onClick: function() { setActiveTab('titles'); } }, '\u79F0\u53F7\u7BA1\u7406'),
            React.createElement('button', { className: 'tab' + (activeTab === 'announcements' ? ' active' : ''), onClick: function() { setActiveTab('announcements'); } }, '\u5168\u670D\u901A\u62A5')
        ),
        React.createElement('div', { className: 'admin-content' },
            activeTab === 'sections' ? renderSections() : null,
            activeTab === 'posts' ? renderPosts() : null,
            activeTab === 'titles' ? renderTitles() : null,
            activeTab === 'announcements' ? renderAnnouncements() : null
        )
    );
}