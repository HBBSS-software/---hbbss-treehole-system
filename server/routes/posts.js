const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all posts (for admin)
router.get('/', auth, async(req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
        const posts = await Post.find().populate('author', 'username title titleColor');
        res.json(posts);
    } catch (e) { res.status(500).send(e.message); }
});

// Search posts - MUST be before /:id
router.get('/search', async(req, res) => {
    try {
        const q = (req.query.q || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(q, 'i');
        const posts = await Post.find({
            status: 'approved',
            $or: [{ title: regex }, { content: regex }]
        }).populate('author', 'username title titleColor');
        res.json(posts);
    } catch (e) { res.status(500).send(e.message); }
});

// Get posts by tag - MUST be before /:id
router.get('/tag/:tag', async(req, res) => {
    try {
        const posts = await Post.find({
            status: 'approved',
            tags: req.params.tag
        }).populate('author', 'username title titleColor');
        res.json(posts);
    } catch (e) { res.status(500).send(e.message); }
});

// Get posts in section
router.get('/section/:sectionId', async(req, res) => {
    try {
        const posts = await Post.find({ section: req.params.sectionId, status: 'approved' }).populate('author', 'username title titleColor');
        res.json(posts);
    } catch (e) { res.status(500).send(e.message); }
});

// Get user favorites - MUST be before /:id
router.get('/user/favorites', auth, async(req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: 'favorites',
            populate: { path: 'author', select: 'username title titleColor' }
        });
        res.json(user.favorites || []);
    } catch (e) { res.status(500).send(e.message); }
});

// Create post
router.post('/', auth, async(req, res) => {
    try {
        const { title, content, images, poll, sectionId, tags } = req.body;
        const user = req.user;
        const status = user.role === 'admin' ? 'approved' : 'pending';
        const post = new Post({ title, content, images, poll, tags: tags || [], author: user._id, section: sectionId, status });
        await post.save();
        res.status(201).json(post);
    } catch (e) { res.status(400).send(e.message); }
});

// Get single post
router.get('/:id', async(req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', 'username title titleColor');
        res.json(post);
    } catch (e) { res.status(500).send(e.message); }
});

// Like / unlike post (toggle)
router.post('/:id/like', auth, async(req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const userId = req.user._id.toString();
        const alreadyLiked = post.likes.some(id => id.toString() === userId);
        if (alreadyLiked) {
            post.likes = post.likes.filter(id => id.toString() !== userId);
            await post.save();
            res.send('Unliked');
        } else {
            post.likes.push(req.user._id);
            await post.save();
            if (post.author && post.author.toString() !== userId) {
                try {
                    await new Notification({ recipient: post.author, sender: req.user._id, type: 'like_post', post: post._id }).save();
                } catch (_) {}
            }
            res.send('Liked');
        }
    } catch (e) { res.status(400).send(e.message); }
});

// Admin approve post
router.put('/:id/approve', auth, async(req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
        await Post.findByIdAndUpdate(req.params.id, { status: 'approved' });
        res.send('Approved');
    } catch (e) { res.status(400).send(e.message); }
});

// Toggle favorite
router.post('/:id/favorite', auth, async(req, res) => {
    try {
        const userId = req.user._id.toString();
        const postId = req.params.id;
        const user = await User.findById(userId);
        const idx = user.favorites.findIndex(fid => fid.toString() === postId);
        if (idx >= 0) {
            user.favorites.splice(idx, 1);
            await user.save();
            res.send('Unfavorited');
        } else {
            user.favorites.push(postId);
            await user.save();
            res.send('Favorited');
        }
    } catch (e) { res.status(400).send(e.message); }
});

// Check if post is favorited
router.get('/:id/favorite', auth, async(req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const isFav = user.favorites.some(fid => fid.toString() === req.params.id);
        res.json({ favorited: isFav });
    } catch (e) { res.status(500).send(e.message); }
});

module.exports = router;