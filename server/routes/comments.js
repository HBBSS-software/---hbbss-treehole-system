const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

// Get comments for post
router.get('/post/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId }).populate('author', 'username');
    res.json(comments);
  } catch (e) { res.status(500).send(e.message); }
});

// Create comment
router.post('/', auth, async (req, res) => {
  try {
    const { content, postId } = req.body;
    const comment = new Comment({ content, author: req.user._id, post: postId });
    await comment.save();
    try {
      const post = await Post.findById(postId);
      if (post && post.author && post.author.toString() !== req.user._id.toString()) {
        await new Notification({ recipient: post.author, sender: req.user._id, type: 'comment', post: post._id, comment: comment._id }).save();
      }
    } catch (_) {}
    res.status(201).json(comment);
  } catch (e) { res.status(400).send(e.message); }
});

// Like comment
router.post('/:id/like', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment.likes.includes(req.user._id)) {
      comment.likes.push(req.user._id);
      await comment.save();
      if (comment.author && comment.author.toString() !== req.user._id.toString()) {
        try {
          await new Notification({ recipient: comment.author, sender: req.user._id, type: 'like_comment', post: comment.post, comment: comment._id }).save();
        } catch (_) {}
      }
    }
    res.send('Liked');
  } catch (e) { res.status(400).send(e.message); }
});

module.exports = router;
