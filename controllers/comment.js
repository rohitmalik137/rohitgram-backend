const { validationResult, Result } = require('express-validator');

const Post = require('../models/post');
const { Comment } = require('../models/comments');
const { ReplyComment } = require('../models/comments');
const io = require('../socket');

exports.addComment = (req, res, next) => {
  const { userId, comment, postId } = req.body;
  console.log(userId, comment, postId);
  const myComment = new Comment({
    comment,
    likes: [],
    userId,
    postId,
  });
  myComment
    .save()
    .then((data) => {
      Post.findById(postId)
        .populate('userId')
        .then((data) => {
          Comment.find({ postId })
            .populate('userId')
            .sort({ createdAt: -1 })
            .then((commentData) => {
              io.getIO().emit('addComment', { action: 'commentAdded', data, commentData })
              res.json({ data, commentData });
            });
        });
    })
    .catch((err) => {
      res.status(400).json({ msg: err.message });
    });
};

exports.likeCommentToggle = (req, res, next) => {
  const { username, commentId, postId } = req.body;
  Comment.findById(commentId).then((data) => {
    if (data.likes.find((name) => name === username)) {
      Comment.findOneAndUpdate(
        { _id: commentId },
        { $pull: { likes: username } },
        { new: true }
      )
        .then(() => {
          Post.findById(postId)
          .populate('userId')
          .then((data) => {
            Comment.find({ postId })
              .populate('userId')
              .sort({ createdAt: -1 })
              .then((commentData) => {
                io.getIO().emit('likeToggleComment', { action: 'likeToggleComment', data, commentData })
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
        .then(() => {
          Post.findById(postId)
          .populate('userId')
          .then((data) => {
            Comment.find({ postId })
              .populate('userId')
              .sort({ createdAt: -1 })
              .then((commentData) => {
                io.getIO().emit('likeToggleComment', { action: 'likeToggleComment', data, commentData })
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

exports.likeRepliedCommentToggle = (req, res, next) => {
  const { username, commentId, parentCommentId } = req.body;
  // console.log(commentId);
  ReplyComment.findById(commentId).then((data) => {
    if (data.likes.find((name) => name === username)) {
      ReplyComment.findOneAndUpdate(
        { _id: commentId },
        { $pull: { likes: username } },
        { new: true }
      )
        .then(() => {
          ReplyComment.find({ parentCommentId })
            .populate('userId')
            .then((data) => {
              io.getIO().emit('likeToggleRepliedComment', { action: 'likeToggleRepliedComment', data })
              res.status(200).json(data);
            })
            .catch((err) => {
              res.status(400).json({ msg: err.message });
            });
        })
        .catch((err) => {
          res.status(400).json({ msg: err.message });
        });
    } else {
      ReplyComment.findOneAndUpdate(
        { _id: commentId },
        { $push: { likes: username } },
        { new: true }
      )
        .then(() => {
          ReplyComment.find({ parentCommentId })
            .populate('userId')
            .then((data) => {
              io.getIO().emit('likeToggleRepliedComment', { action: 'likeToggleRepliedComment', data })
              res.status(200).json(data);
            })
            .catch((err) => {
              res.status(400).json({ msg: err.message });
            });
        })
        .catch((err) => {
          res.status(400).json({ msg: err.message });
        });
    }
  });
};

exports.replyComment = (req, res, next) => {
  const { comment, replyTo_commentId, repliedTo, userId } = req.body;
  console.log(comment, repliedTo, userId, replyTo_commentId);
  const replyObject = new ReplyComment({
    comment,
    likes: [],
    userId,
    repliedTo,
    parentCommentId: replyTo_commentId,
  });
  replyObject
    .save()
    .then((data) => {
      Comment.findOneAndUpdate(
        { _id: replyTo_commentId },
        {
          replyCommentId: data._id,
        }
      ).then(() => {
        ReplyComment.find({ parentCommentId: replyTo_commentId })
        .populate('userId')
        .then((data) => {
          io.getIO().emit('repliedComment', { action: 'commentReplied', data })
          res.status(200).json(data);
        })
      });
    })
    .catch((err) => {
      res.status(400).json({ msg: err.message });
    });
};

exports.getCommentReplies = (req, res, next) => {
  const parentCommentId = req.params.parentCommentId;
  ReplyComment.find({ parentCommentId })
    .populate('userId')
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      res.status(400).json({ msg: err.message });
    });
};
