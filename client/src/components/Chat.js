import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Chat.css';

export default function Chat({ user }) {
    var params = useParams();
    var navigate = useNavigate();
    var friendId = params.friendId;
    var [messages, setMessages] = useState([]);
    var [friend, setFriend] = useState(null);
    var [loading, setLoading] = useState(true);
    var [sending, setSending] = useState(false);
    var [error, setError] = useState('');
    var [inputText, setInputText] = useState('');
    var [page, setPage] = useState(1);
    var [hasMore, setHasMore] = useState(true);
    var messagesEndRef = useRef(null);
    var chatBoxRef = useRef(null);
    var pollRef = useRef(null);

    var token = localStorage.getItem('token');
    var headers = { Authorization: 'Bearer ' + token };

    useEffect(function() {
        loadFriend();
        loadMessages(1, true);
        pollRef.current = setInterval(function() { pollNewMessages(); }, 3000);
        return function() { if (pollRef.current) clearInterval(pollRef.current); };
    }, [friendId]);

    function loadFriend() {
        axios.get('/api/auth/profile/' + friendId, { headers: headers })
            .then(function(res) { setFriend(res.data); })
            .catch(function(err) {
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            });
    }

    function loadMessages(p, initial) {
        setLoading(true);
        axios.get('/api/chat/history/' + friendId + '?page=' + p + '&limit=50', { headers: headers })
            .then(function(res) {
                var data = res.data;
                if (data.length < 50) setHasMore(false);
                if (initial) {
                    setMessages(data);
                    setTimeout(scrollToBottom, 100);
                } else {
                    setMessages(function(prev) { return data.concat(prev); });
                }
                setPage(p);
                // mark as read
                axios.put('/api/chat/read/' + friendId, {}, { headers: headers }).catch(function() {});
            })
            .catch(function(err) {
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
                setError('\u83B7\u53D6\u804A\u5929\u8BB0\u5F55\u5931\u8D25');
            })
            .finally(function() { setLoading(false); });
    }

    function pollNewMessages() {
        var tk = localStorage.getItem('token');
        if (!tk) return;
        var h = { Authorization: 'Bearer ' + tk };
        axios.get('/api/chat/history/' + friendId + '?page=1&limit=50', { headers: h })
            .then(function(res) {
                setMessages(function(prev) {
                    var existingIds = {};
                    prev.forEach(function(m) { existingIds[m._id] = true; });
                    var newMsgs = res.data.filter(function(m) { return !existingIds[m._id]; });
                    if (newMsgs.length > 0) {
                        setTimeout(scrollToBottom, 100);
                        axios.put('/api/chat/read/' + friendId, {}, { headers: h }).catch(function() {});
                        return prev.concat(newMsgs);
                    }
                    return prev;
                });
            })
            .catch(function() {});
    }

    function scrollToBottom() {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function handleSend() {
        var text = inputText.trim();
        if (!text || sending) return;
        setSending(true);
        setError('');
        axios.post('/api/chat/send/' + friendId, { content: text }, { headers: headers })
            .then(function(res) {
                setMessages(function(prev) { return prev.concat([res.data]); });
                setInputText('');
                setTimeout(scrollToBottom, 100);
            })
            .catch(function(err) {
                var msg = err.response && err.response.data && err.response.data.message;
                setError(msg || '\u53D1\u9001\u5931\u8D25');
            })
            .finally(function() { setSending(false); });
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    function loadMore() {
        loadMessages(page + 1, false);
    }

    function formatTime(dateStr) {
        var d = new Date(dateStr);
        var h = d.getHours().toString().padStart(2, '0');
        var m = d.getMinutes().toString().padStart(2, '0');
        return h + ':' + m;
    }

    function formatDate(dateStr) {
        var d = new Date(dateStr);
        return d.toLocaleDateString('zh-CN');
    }

    function renderAvatar(u, size) {
        var cls = size === 'big' ? 'chat-friend-avatar' : 'chat-msg-avatar';
        var phCls = size === 'big' ? 'chat-friend-avatar-placeholder' : 'chat-msg-avatar-placeholder';
        if (u && u.avatar) {
            return React.createElement('img', { src: u.avatar, alt: u.username, className: cls });
        }
        var letter = u ? u.username.charAt(0).toUpperCase() : '?';
        return React.createElement('div', { className: phCls }, letter);
    }

    function renderMessages() {
        if (messages.length === 0 && !loading) {
            return React.createElement('div', { className: 'chat-empty' }, '\u5F00\u59CB\u548C\u597D\u53CB\u804A\u5929\u5427\uFF01');
        }

        var items = [];
        var lastDate = '';

        if (hasMore && messages.length >= 50) {
            items.push(React.createElement('div', { key: 'load-more', className: 'chat-load-more' },
                React.createElement('button', { onClick: loadMore, disabled: loading }, loading ? '\u52A0\u8F7D\u4E2D...' : '\u52A0\u8F7D\u66F4\u591A')
            ));
        }

        messages.forEach(function(msg, idx) {
            var msgDate = formatDate(msg.createdAt);
            if (msgDate !== lastDate) {
                lastDate = msgDate;
                items.push(React.createElement('div', { key: 'date-' + idx, className: 'chat-date-divider' },
                    React.createElement('span', null, msgDate)
                ));
            }

            var isMine = msg.sender && (msg.sender._id === user._id || msg.sender === user._id);
            var senderUser = isMine ? user : (msg.sender || friend);
            var msgClass = 'chat-msg ' + (isMine ? 'chat-msg-mine' : 'chat-msg-other');

            items.push(React.createElement('div', { key: msg._id || ('msg-' + idx), className: msgClass },
                renderAvatar(senderUser, 'small'),
                React.createElement('div', null,
                    React.createElement('div', { className: 'chat-msg-bubble' }, msg.content),
                    React.createElement('div', { className: 'chat-msg-time' }, formatTime(msg.createdAt))
                )
            ));
        });

        items.push(React.createElement('div', { key: 'end', ref: messagesEndRef }));
        return items;
    }

    // Main render
    return React.createElement('div', { className: 'chat-container' },
        React.createElement('div', { className: 'chat-header' },
            React.createElement('button', { className: 'chat-back-btn', onClick: function() { navigate('/friends'); } }, '\u2190'),
            friend ? renderAvatar(friend, 'big') : null,
            React.createElement('span', { className: 'chat-friend-name' }, friend ? friend.username : '\u52A0\u8F7D\u4E2D...')
        ),
        React.createElement('div', { className: 'chat-messages', ref: chatBoxRef },
            loading && messages.length === 0 ?
            React.createElement('div', { className: 'chat-loading' }, '\u52A0\u8F7D\u4E2D...') :
            renderMessages()
        ),
        error ? React.createElement('div', { className: 'chat-error' }, error) : null,
        React.createElement('div', { className: 'chat-input-area' },
            React.createElement('textarea', {
                className: 'chat-input',
                value: inputText,
                onChange: function(e) { setInputText(e.target.value); },
                onKeyDown: handleKeyDown,
                placeholder: '\u8F93\u5165\u6D88\u606F...',
                rows: 1
            }),
            React.createElement('button', {
                className: 'chat-send-btn',
                onClick: handleSend,
                disabled: sending || !inputText.trim()
            }, '\u27A4')
        )
    );
}