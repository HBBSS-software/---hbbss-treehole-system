const express = require('express');

const Post = require('../models/Post');

const auth = require('../middleware/auth');

const router = express.Router();

// Create post

router.post('/', auth, async (req, res) => {

  try {

    const { title, content, images, poll, sectionId } = req.body;

    const user = req.user;

    const status = user.role === 'admin' ? 'approved' : 'pending';

    const post = new Post({ title, content, images, poll, author: user._id, section: sectionId, status });

    await post.save();

    res.status(201).json(post);

  } catch (e) {

    res.status(400).send(e.message);

  }

});

// Get posts in section

router.get('/section/:sectionId', async (req, res) => {

  try {

    const posts = await Post.find({ section: req.params.sectionId, status: 'approved' }).populate('author', 'username');

    res.json(posts);

  } catch (e) {

    res.status(500).send(e.message);

  }

});

// Get single post

router.get('/:id', async (req, res) => {

  try {

    const post = await Post.findById(req.params.id).populate('author', 'username');

    res.json(post);

  } catch (e) {

    res.status(500).send(e.message);

  }

});

// Like post

router.post('/:id/like', auth, async (req, res) => {

  try {

    const post = await Post.findById(req.params.id);

    if (!post.likes.includes(req.user._id)) {

      post.likes.push(req.user._id);

      await post.save();

    }

    res.send('Liked');

  } catch (e) {

    res.status(400).send(e.message);

  }

});

// Admin approve post

router.put('/:id/approve', auth, async (req, res) => {

  try {

    if (req.user.role !== 'admin') return res.status(403).send('Forbidden');

    await Post.findByIdAndUpdate(req.params.id, { status: 'approved' });

    res.send('Approved');

  } catch (e) {

    res.status(400).send(e.message);

  }

});

module.exports = router;