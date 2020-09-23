const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const feedController = require('../controllers/feed');
const isAuth = require('../middleware/is-auth');

// Post a new post to DB
router.post(
  '/newpost',
  isAuth,
  [body('mediaUrl').trim(), body('caption').trim()],
  feedController.uploadNewPost
);

//get posts from DB of a specific User
router.get('/userPosts/:username', feedController.getPosts);

module.exports = router;
