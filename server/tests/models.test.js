const mongoose = require('mongoose');

// Test schema definitions without DB connection

describe('User Model Schema', () => {
  const User = require('../models/User');
  const schema = User.schema;

  test('has required username field', () => {
    expect(schema.path('username').isRequired).toBe(true);
  });

  test('has required password field', () => {
    expect(schema.path('password').isRequired).toBe(true);
  });

  test('role defaults to user', () => {
    expect(schema.path('role').defaultValue).toBe('user');
  });

  test('has following array field', () => {
    expect(schema.path('following')).toBeDefined();
  });

  test('has followers array field', () => {
    expect(schema.path('followers')).toBeDefined();
  });

  test('has subscribedSections array field', () => {
    expect(schema.path('subscribedSections')).toBeDefined();
  });
});

describe('Post Model Schema', () => {
  const Post = require('../models/Post');
  const schema = Post.schema;

  test('has title field', () => {
    expect(schema.path('title')).toBeDefined();
  });

  test('has tags array field', () => {
    expect(schema.path('tags')).toBeDefined();
  });

  test('status defaults to approved', () => {
    expect(schema.path('status').defaultValue).toBe('approved');
  });

  test('has likes array field', () => {
    expect(schema.path('likes')).toBeDefined();
  });
});

describe('Notification Model Schema', () => {
  const Notification = require('../models/Notification');
  const schema = Notification.schema;

  test('has recipient field', () => {
    expect(schema.path('recipient')).toBeDefined();
  });

  test('has sender field', () => {
    expect(schema.path('sender')).toBeDefined();
  });

  test('has type field', () => {
    expect(schema.path('type')).toBeDefined();
  });

  test('read defaults to false', () => {
    expect(schema.path('read').defaultValue).toBe(false);
  });

  test('type enum includes expected values', () => {
    const enumValues = schema.path('type').enumValues;
    expect(enumValues).toContain('like_post');
    expect(enumValues).toContain('comment');
    expect(enumValues).toContain('follow');
    expect(enumValues).toContain('like_comment');
  });
});

describe('Comment Model Schema', () => {
  const Comment = require('../models/Comment');
  const schema = Comment.schema;

  test('has content field', () => {
    expect(schema.path('content')).toBeDefined();
  });

  test('has likes array field', () => {
    expect(schema.path('likes')).toBeDefined();
  });
});
