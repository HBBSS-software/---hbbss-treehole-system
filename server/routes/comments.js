const express = require('express');

const Comment = require('../models/Comment');

const auth = require('../middleware/auth');

const router = express.Router();

// Create comment

router.post('/', auth, async (req, res) => {

  try {

    const { content, postId } = req.body;

    const comment = new Comment({ content, author: req.user._id, post: postId });

    await comment.save();

    res.status(201).json(comment);

  } catch (e) {

    res.status(400).send(e.message);

  }

});

// Get comments for post

router.get('/post/:postId', async (req, res) => {

  try {

    const comments = await Comment.find({ post: req.params.postId }).populate('author', 'username');

    res.json(comments);

  } catch (e) {

    res.status(500).send(e.message);

  }

});

// Like comment

router.post('/:id/like', auth, async (req, res) => {

  try {

    const comment = await Comment.findById(req.params.id);

    if (!comment.likes.includes(req.user._id)) {

      comment.likes.push(req.user._id);

      await comment.save();

    }

    res.send('Liked');

  } catch (e) {

    res.status(400).send(e.message);

  }

});

module.exports = router;