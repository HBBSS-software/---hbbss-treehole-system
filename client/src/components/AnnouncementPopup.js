import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AnnouncementPopup.css';

export default function AnnouncementPopup({ user }) {
  var [announcement, setAnnouncement] = useState(null);
  var [dismissed, setDismissed] = useState(false);

  useEffect(function() {
    if (!user) return;
    var token = localStorage.getItem('token');
    axios.get('/api/announcements/active', { headers: { Authorization: 'Bearer ' + token } })
      .then(function(res) {
        if (res.data && res.data._id) {
          var dismissedId = sessionStorage.getItem('dismissed_announcement');
          if (dismissedId !== res.data._id) {
            setAnnouncement(res.data);
            setDismissed(false);
          }
        }
      })
      .catch(function() {});
  }, [user]);

  function handleDismiss() {
    if (announcement) {
      sessionStorage.setItem('dismissed_announcement', announcement._id);
    }
    setDismissed(true);
  }

  if (!announcement || dismissed) return null;

  return React.createElement('div', { className: 'announcement-overlay' },
    React.createElement('div', { className: 'announcement-popup' },
      React.createElement('div', { className: 'announcement-popup-header' },
        React.createElement('h2', null, '\uD83D\uDCE2 \u5168\u670D\u901A\u62A5'),
        React.createElement('button', { className: 'announcement-close', onClick: handleDismiss }, '\u2715')
      ),
      React.createElement('div', { className: 'announcement-popup-body' },
        React.createElement('h3', { className: 'announcement-popup-title' }, announcement.title),
        React.createElement('p', { className: 'announcement-popup-content' }, announcement.content),
        React.createElement('div', { className: 'announcement-popup-date' },
          '\u53D1\u5E03\u65F6\u95F4: ' + new Date(announcement.createdAt).toLocaleString()
        )
      ),
      React.createElement('div', { className: 'announcement-popup-footer' },
        React.createElement('button', { className: 'announcement-ok-btn', onClick: handleDismiss }, '\u6211\u77E5\u9053\u4E86')
      )
    )
  );
}