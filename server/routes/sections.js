const express = require('express');
const Section = require('../models/Section');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all sections (for admin)
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
    const sections = await Section.find().populate('moderator', 'username').populate('creator', 'username');
    res.json(sections);
  } catch (e) { res.status(500).send(e.message); }
});

// Search sections - MUST be before /:id
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const regex = new RegExp(q, 'i');
    const sections = await Section.find({
      status: 'approved',
      $or: [{ name: regex }, { description: regex }]
    }).populate('moderator', 'username');
    res.json(sections);
  } catch (e) { res.status(500).send(e.message); }
});

// Get subscribed sections - MUST be before /:id
router.get('/subscribed', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('subscribedSections');
    res.json(user.subscribedSections || []);
  } catch (e) { res.status(500).send(e.message); }
});

// Get all approved sections
router.get('/', async (req, res) => {
  try {
    const sections = await Section.find({ status: 'approved' }).populate('moderator', 'username');
    res.json(sections);
  } catch (e) { res.status(500).send(e.message); }
});

// Create section
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const user = req.user;
    const status = user.role === 'admin' ? 'approved' : 'pending';
    const section = new Section({ name, description, creator: user._id, moderator: user._id, status });
    await section.save();
    res.status(201).json(section);
  } catch (e) { res.status(400).send(e.message); }
});

// Get single section
router.get('/:id', async (req, res) => {
  try {
    const section = await Section.findById(req.params.id).populate('moderator', 'username');
    if (!section) return res.status(404).send('Section not found');
    res.json(section);
  } catch (e) { res.status(500).send(e.message); }
});

// Subscribe to section
router.post('/:id/subscribe', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.subscribedSections.includes(req.params.id)) {
      user.subscribedSections.push(req.params.id);
      await user.save();
    }
    res.json({ message: '订阅成功' });
  } catch (e) { res.status(400).send(e.message); }
});

// Unsubscribe from section
router.post('/:id/unsubscribe', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.subscribedSections = user.subscribedSections.filter(s => s.toString() !== req.params.id);
    await user.save();
    res.json({ message: '取消订阅成功' });
  } catch (e) { res.status(400).send(e.message); }
});

// Admin approve section
router.put('/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
    await Section.findByIdAndUpdate(req.params.id, { status: 'approved' });
    res.send('Approved');
  } catch (e) { res.status(400).send(e.message); }
});

module.exports = router;
