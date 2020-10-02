const express = require('express');
const router = express.Router();
// const { body } = require('express-validator');

const commentController = require('../controllers/comment');
const isAuth = require('../middleware/is-auth');

router.patch('/addComment', isAuth, commentController.addComment);

router.patch(
  '/likeCommentToggle/',
  isAuth,
  commentController.likeCommentToggle
);

module.exports = router;
