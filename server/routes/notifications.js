const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username avatar')
      .populate('post', 'title')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (e) { res.status(500).send(e.message); }
});

// Mark all as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ message: '已全部标记为已读' });
  } catch (e) { res.status(500).send(e.message); }
});

// Mark one as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { read: true });
    res.json({ message: '已标记为已读' });
  } catch (e) { res.status(500).send(e.message); }
});

module.exports = router;
