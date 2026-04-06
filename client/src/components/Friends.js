import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Friends.css';

export default function Friends({ user }) {
    const [activeTab, setActiveTab] = useState('search');
    const [friends, setFriends] = useState([]);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    var token = localStorage.getItem('token');
    var headers = { Authorization: 'Bearer ' + token };

    useEffect(function() { fetchAll(); }, []);

    function fetchAll() {
        setLoading(true);
        Promise.all([
            axios.get('/api/friends/list', { headers: headers }),
            axios.get('/api/friends/requests/received', { headers: headers }),
            axios.get('/api/friends/requests/sent', { headers: headers })
        ]).then(function(results) {
            setFriends(results[0].data);
            setReceivedRequests(results[1].data);
            setSentRequests(results[2].data);
        }).catch(function(err) {
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return;
            }
            setError('加载失败');
        }).finally(function() { setLoading(false); });
    }

    function handleAccept(requestId) {
        setActionLoading(function(prev) { return Object.assign({}, prev, {
                [requestId]: true }); });
        axios.post('/api/friends/accept/' + requestId, {}, { headers: headers })
            .then(function() { fetchAll(); })
            .catch(function(err) {
                var msg = err.response && err.response.data && err.response.data.message;
                setError(msg || '操作失败');
            })
            .finally(function() { setActionLoading(function(prev) { return Object.assign({}, prev, {
                        [requestId]: false }); }); });
    }

    function handleReject(requestId) {
        setActionLoading(function(prev) { return Object.assign({}, prev, {
                [requestId]: true }); });
        axios.post('/api/friends/reject/' + requestId, {}, { headers: headers })
            .then(function() { setReceivedRequests(function(prev) { return prev.filter(function(r) { return r._id !== requestId; }); }); })
            .catch(function(err) {
                var msg = err.response && err.response.data && err.response.data.message;
                setError(msg || '操作失败');
            })
            .finally(function() { setActionLoading(function(prev) { return Object.assign({}, prev, {
                        [requestId]: false }); }); });
    }

    function handleRemoveFriend(friendId) {
        if (!window.confirm('确定要删除该好友吗？')) return;
        setActionLoading(function(prev) { return Object.assign({}, prev, {
                [friendId]: true }); });
        axios.delete('/api/friends/' + friendId, { headers: headers })
            .then(function() { setFriends(function(prev) { return prev.filter(function(f) { return f._id !== friendId; }); }); })
            .catch(function(err) {
                var msg = err.response && err.response.data && err.response.data.message;
                setError(msg || '操作失败');
            })
            .finally(function() { setActionLoading(function(prev) { return Object.assign({}, prev, {
                        [friendId]: false }); }); });
    }

    function doSearch(uid) {
        if (!uid) return;
        setSearching(true);
        setError('');
        axios.get('/api/auth/search?q=' + encodeURIComponent(uid), { headers: headers })
            .then(function(res) { setSearchResults(res.data); })
            .catch(function() { setError('搜索失败'); })
            .finally(function() { setSearching(false); });
    }

    function handleNumPad(num) {
        setSearchQuery(function(prev) { return prev + num; });
    }

    function handleBackspace() {
        setSearchQuery(function(prev) { return prev.slice(0, -1); });
    }

    function handleClear() {
        setSearchQuery('');
        setSearchResults([]);
    }

    function handleSearchClick() {
        doSearch(searchQuery);
    }

    function handleSendRequest(userId) {
        setActionLoading(function(prev) { return Object.assign({}, prev, {
                [userId]: true }); });
        axios.post('/api/friends/request/' + userId, {}, { headers: headers })
            .then(function() {
                setSearchResults(function(prev) {
                    return prev.map(function(u) { return u._id === userId ? Object.assign({}, u, { requestSent: true }) : u; });
                });
            })
            .catch(function(err) {
                var msg = err.response && err.response.data && err.response.data.message;
                setError(msg || '发送失败');
            })
            .finally(function() { setActionLoading(function(prev) { return Object.assign({}, prev, {
                        [userId]: false }); }); });
    }

    function renderUserAvatar(u) {
        if (u.avatar) {
            return React.createElement('img', { src: u.avatar, alt: u.username, className: 'friend-avatar' });
        }
        return React.createElement('div', { className: 'friend-avatar-placeholder' }, u.username.charAt(0).toUpperCase());
    }

    function renderSearch() {
        var numKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
        return React.createElement('div', { className: 'search-section' },
            React.createElement('div', { className: 'uid-display' },
                React.createElement('span', { className: 'uid-display-label' }, 'UID:'),
                React.createElement('span', { className: 'uid-display-value' }, searchQuery || '请点击数字输入')
            ),
            React.createElement('div', { className: 'numpad' },
                numKeys.map(function(n) {
                    return React.createElement('button', { key: n, className: 'numpad-btn', onClick: function() { handleNumPad(n); } }, n);
                }),
                React.createElement('button', { className: 'numpad-btn numpad-clear', onClick: handleClear }, 'C'),
                React.createElement('button', { className: 'numpad-btn', onClick: function() { handleNumPad('0'); } }, '0'),
                React.createElement('button', { className: 'numpad-btn numpad-del', onClick: handleBackspace }, '\u232B')
            ),
            React.createElement('button', { className: 'search-btn numpad-search', onClick: handleSearchClick, disabled: searching || !searchQuery }, searching ? '搜索中...' : '搜索 UID'),
            searchResults.length > 0 ?
            React.createElement('div', { className: 'friends-list' },
                searchResults.map(function(u) {
                    return React.createElement('div', { key: u._id, className: 'friend-card' },
                        React.createElement(Link, { to: '/user/' + u._id, className: 'friend-info' },
                            renderUserAvatar(u),
                            React.createElement('div', { className: 'friend-details' },
                                React.createElement('span', { className: 'friend-name' }, u.username),
                                React.createElement('span', { className: 'friend-uid' }, 'UID: ' + u.uid),
                                React.createElement('span', { className: 'friend-desc' }, u.description || '这个用户很懒，什么都没写...')
                            )
                        ),
                        u.requestSent ?
                        React.createElement('span', { className: 'pending-label' }, '已发送') :
                        React.createElement('button', { className: 'accept-btn', onClick: function() { handleSendRequest(u._id); }, disabled: actionLoading[u._id] }, actionLoading[u._id] ? '...' : '+ 添加好友')
                    );
                })
            ) :
            searchQuery ?
            React.createElement('div', { className: 'friends-empty' }, '未找到该UID用户') :
            null
        );
    }

    function renderFriends() {
        if (loading) return React.createElement('div', { className: 'friends-empty' }, '加载中...');
        if (friends.length === 0) return React.createElement('div', { className: 'friends-empty' }, '还没有好友，去搜索用户添加好友吧！');
        return React.createElement('div', { className: 'friends-list' },
            friends.map(function(friend) {
                return React.createElement('div', { key: friend._id, className: 'friend-card' },
                    React.createElement(Link, { to: '/user/' + friend._id, className: 'friend-info' },
                        renderUserAvatar(friend),
                        React.createElement('div', { className: 'friend-details' },
                            React.createElement('span', { className: 'friend-name' }, friend.username),
                            React.createElement('span', { className: 'friend-desc' }, friend.description || '这个用户很懒，什么都没写...')
                        )
                    ),
                    React.createElement('div', { className: 'friend-actions' },
                        React.createElement(Link, { to: '/chat/' + friend._id, className: 'chat-btn' }, '\uD83D\uDCAC 聊天'),
                        React.createElement('button', { className: 'remove-friend-btn', onClick: function() { handleRemoveFriend(friend._id); }, disabled: actionLoading[friend._id] }, actionLoading[friend._id] ? '处理中...' : '删除好友')
                    )
                );
            })
        );
    }

    function renderReceived() {
        if (loading) return React.createElement('div', { className: 'friends-empty' }, '加载中...');
        if (receivedRequests.length === 0) return React.createElement('div', { className: 'friends-empty' }, '暂无好友请求');
        return React.createElement('div', { className: 'friends-list' },
            receivedRequests.map(function(req) {
                return React.createElement('div', { key: req._id, className: 'friend-card' },
                    React.createElement(Link, { to: '/user/' + req.from._id, className: 'friend-info' },
                        renderUserAvatar(req.from),
                        React.createElement('div', { className: 'friend-details' },
                            React.createElement('span', { className: 'friend-name' }, req.from.username),
                            req.message ? React.createElement('span', { className: 'friend-message' }, '留言: ' + req.message) : null,
                            React.createElement('span', { className: 'friend-time' }, new Date(req.createdAt).toLocaleDateString('zh-CN'))
                        )
                    ),
                    React.createElement('div', { className: 'request-actions' },
                        React.createElement('button', { className: 'accept-btn', onClick: function() { handleAccept(req._id); }, disabled: actionLoading[req._id] }, actionLoading[req._id] ? '...' : '接受'),
                        React.createElement('button', { className: 'reject-btn', onClick: function() { handleReject(req._id); }, disabled: actionLoading[req._id] }, actionLoading[req._id] ? '...' : '拒绝')
                    )
                );
            })
        );
    }

    function renderSent() {
        if (loading) return React.createElement('div', { className: 'friends-empty' }, '加载中...');
        if (sentRequests.length === 0) return React.createElement('div', { className: 'friends-empty' }, '暂无发出的请求');
        return React.createElement('div', { className: 'friends-list' },
            sentRequests.map(function(req) {
                return React.createElement('div', { key: req._id, className: 'friend-card' },
                    React.createElement(Link, { to: '/user/' + req.to._id, className: 'friend-info' },
                        renderUserAvatar(req.to),
                        React.createElement('div', { className: 'friend-details' },
                            React.createElement('span', { className: 'friend-name' }, req.to.username),
                            req.message ? React.createElement('span', { className: 'friend-message' }, '留言: ' + req.message) : null,
                            React.createElement('span', { className: 'friend-time' }, new Date(req.createdAt).toLocaleDateString('zh-CN'))
                        )
                    ),
                    React.createElement('span', { className: 'pending-label' }, '等待对方处理')
                );
            })
        );
    }

    return React.createElement('div', { className: 'friends-container' },
        React.createElement('div', { className: 'friends-header' },
            React.createElement('h1', null, '好友'),
            user && user.uid ? React.createElement('p', { className: 'my-uid' }, '我的UID: ' + user.uid) : null
        ),
        React.createElement('div', { className: 'friends-tabs' },
            React.createElement('button', { className: 'friends-tab' + (activeTab === 'search' ? ' active' : ''), onClick: function() { setActiveTab('search'); } }, '搜索用户'),
            React.createElement('button', { className: 'friends-tab' + (activeTab === 'friends' ? ' active' : ''), onClick: function() { setActiveTab('friends'); } }, '我的好友 (' + friends.length + ')'),
            React.createElement('button', { className: 'friends-tab' + (activeTab === 'received' ? ' active' : ''), onClick: function() { setActiveTab('received'); } },
                '收到的请求 ',
                receivedRequests.length > 0 ? React.createElement('span', { className: 'tab-badge' }, receivedRequests.length) : null
            ),
            React.createElement('button', { className: 'friends-tab' + (activeTab === 'sent' ? ' active' : ''), onClick: function() { setActiveTab('sent'); } }, '发出的请求 (' + sentRequests.length + ')')
        ),
        error ? React.createElement('div', { className: 'error-message' }, error) : null,
        React.createElement('div', { className: 'friends-content' },
            activeTab === 'search' ? renderSearch() : null,
            activeTab === 'friends' ? renderFriends() : null,
            activeTab === 'received' ? renderReceived() : null,
            activeTab === 'sent' ? renderSent() : null
        )
    );
}