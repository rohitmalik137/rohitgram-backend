const { validationResult } = require('express-validator');

const Post = require('../models/post');
const Comment = require('../models/comments');

exports.addComment = (req, res, next) => {
  const { userId, comment, postId } = req.body;
  console.log(userId, comment, postId);
  const myComment = new Comment({
    comment,
    likes: [],
    replies: {},
    userId,
    postId,
  });
  myComment
    .save()
    .then((data) => {
      res.json({ data });
    })
    .catch((err) => {
      res.status(400).json({ msg: err.message });
    });
};

exports.likeCommentToggle = (req, res, next) => {
  const { username, commentId } = req.body;
  Comment.findById(commentId).then((data) => {
    if (data.likes.find((name) => name === username)) {
      Comment.findOneAndUpdate(
        { _id: commentId },
        { $pull: { likes: username } },
        { new: true }
      )
        .then((comment) => {
          Post.findById(comment.postId)
            .populate('userId')
            .then((data) => {
              Comment.find({ postId: comment.postId })
                .populate('userId')
                .sort({ createdAt: -1 })
                .then((commentData) => {
                  res.json({ data, commentData });
                });
            });
        })
        .catch((err) => {
          res.status(400).json({ msg: err.message });
        });
    } else {
      Comment.findOneAndUpdate(
        { _id: commentId },
        { $push: { likes: username } },
        { new: true }
      )
        .then((comment) => {
          Post.findById(comment.postId)
            .populate('userId')
            .then((data) => {
              Comment.find({ postId: comment.postId })
                .populate('userId')
                .sort({ createdAt: -1 })
                .then((commentData) => {
                  res.json({ data, commentData });
                });
            });
        })
        .catch((err) => {
          res.status(400).json({ msg: err.message });
        });
    }
  });
};
