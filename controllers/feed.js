const { validationResult } = require('express-validator');

const Post = require('../models/post');
const Auth = require('../models/auth');
const { Comment } = require('../models/comments');
// const { ReplyComment } = require('../models/comments');
const io = require('../socket');

exports.uploadNewPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'validation failed, Please enter valid details',
      errors: errors.array(),
    });
  }
  if (!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    throw error;
  }

  const mediaUrl = req.file.path;
  const { caption, userId } = req.body;
  const newPost = new Post({
    mediaUrl,
    caption,
    likes: [],
    comments: {},
    caption,
    userId,
  });
  newPost
    .save()
    .then((result) => {
      Auth.updateOne({ _id: userId }, { $inc: { posts: 1 } }).then(() => {
        Post.find()
          .sort({ createdAt: -1 })
          .populate('userId')
          .then((allPosts) => {
            io.getIO().emit('posts', { action: 'create', post: allPosts });
            res.status(201).json({
              message: 'Post uploaded successfully!',
              post: result,
            });
          });
      });
      // return result;
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getPosts = (req, res, next) => {
  const username = req.params.username;
  Auth.findOne({ username }).then((result) => {
    const userId = result._id;
    Post.find({ userId })
      .sort({ createdAt: -1 })
      .then((posts) => {
        io.getIO().emit('userPosts', {
          action: 'getUserPosts',
          userPosts: posts,
        });
        res.status(200).json({
          message: 'Posts Fetched Successfully',
          userPosts: posts,
        });
      })
      .catch((err) => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
  });
};

exports.getAllPosts = (req, res, next) => {
  Post.find()
    .sort({ createdAt: -1 })
    .populate('userId')
    .then((data) => res.json(data));
};

exports.getSinglePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .populate('userId')
    .then((data) => {
      Comment.find({ postId })
        .populate('userId')
        .sort({ createdAt: -1 })
        .then((commentData) => {
          res.json({ data, commentData });
        });
    });
};

exports.updateLikes = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'error in updating likes',
      errors: errors.array(),
    });
  }
  const { username, postId } = req.body;
  Post.findById(postId).then((data) => {
    if (data.likes.find((name) => name === username)) {
      Post.findOneAndUpdate(
        { _id: postId },
        { $pull: { likes: username } },
        { new: true }
      )
        .populate('userId')
        .then((data) => {
          Comment.find({ postId })
            .populate('userId')
            .sort({ createdAt: -1 })
            .then((commentData) => {
              io.getIO().emit('likesUpdated', {
                action: 'updateLikes',
                data,
                commentData,
              });
              res.json({ data, commentData });
            });
        })
        .catch((err) => {
          res.status(400).json({ msg: err.message });
        });
    } else {
      Post.findOneAndUpdate(
        { _id: postId },
        { $push: { likes: username } },
        { new: true }
      )
        .populate('userId')
        .then((data) => {
          Comment.find({ postId })
            .populate('userId')
            .sort({ createdAt: -1 })
            .then((commentData) => {
              io.getIO().emit('likesUpdated', {
                action: 'updateLikes',
                data,
                commentData,
              });
              res.json({ data, commentData });
            });
        })
        .catch((err) => {
          res.status(400).json({ msg: err.message });
        });
    }
  });
};
