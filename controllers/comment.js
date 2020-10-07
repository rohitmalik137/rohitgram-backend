const { validationResult, Result } = require('express-validator');

// const Post = require('../models/post');
const { Comment } = require('../models/comments');
const { ReplyComment } = require('../models/comments');

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
      console.log(data);
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
        .then()
        .catch((err) => {
          res.status(400).json({ msg: err.message });
        });
    } else {
      Comment.findOneAndUpdate(
        { _id: commentId },
        { $push: { likes: username } },
        { new: true }
      )
        .then()
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
              console.log(data);
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
              console.log(data);
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
      ).then((data) => res.json(data));
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
      console.log(data);
      res.status(200).json(data);
    })
    .catch((err) => {
      res.status(400).json({ msg: err.message });
    });
};
