const express = require('express');
const Announcement = require('../models/Announcement');
const auth = require('../middleware/auth');
const router = express.Router();

// Get active announcement (for all users)
router.get('/active', auth, async(req, res) => {
    try {
        const announcement = await Announcement.findOne({ active: true }).sort({ createdAt: -1 });
        res.json(announcement);
    } catch (e) { res.status(500).send(e.message); }
});

// Get all announcements (admin)
router.get('/', auth, async(req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
        const list = await Announcement.find().sort({ createdAt: -1 });
        res.json(list);
    } catch (e) { res.status(500).send(e.message); }
});

// Create announcement (admin)
router.post('/', auth, async(req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
        const { title, content } = req.body;
        if (!title || !content) return res.status(400).send('Title and content required');
        // Deactivate all existing
        await Announcement.updateMany({}, { active: false });
        const ann = await Announcement.create({ title, content, active: true, createdBy: req.user._id });
        res.status(201).json(ann);
    } catch (e) { res.status(400).send(e.message); }
});

// Toggle active status (admin)
router.put('/:id/toggle', auth, async(req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
        const ann = await Announcement.findById(req.params.id);
        if (!ann) return res.status(404).send('Not found');
        if (!ann.active) {
            await Announcement.updateMany({}, { active: false });
        }
        ann.active = !ann.active;
        await ann.save();
        res.json(ann);
    } catch (e) { res.status(400).send(e.message); }
});

// Delete announcement (admin)
router.delete('/:id', auth, async(req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
        await Announcement.findByIdAndDelete(req.params.id);
        res.send('Deleted');
    } catch (e) { res.status(400).send(e.message); }
});

module.exports = router;