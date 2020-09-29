const { validationResult } = require('express-validator');

const Post = require('../models/post');
const Auth = require('../models/auth');

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
  // const userId = '5f4b21d71d824c2ee8966f96';
  console.log(mediaUrl, caption, userId);
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
      Auth.updateOne({ _id: userId }, { $inc: { posts: 1 } }).then((res) =>
        console.log(res)
      );
      res.status(201).json({
        message: 'Post uploaded successfully!',
        post: result,
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
  // console.log(username);
  Auth.findOne({ username }).then((result) => {
    const userId = result._id;
    Post.find({ userId })
      .then((posts) => {
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
  // console.log(postId);
  Post.findById(postId)
    .populate('userId')
    .then((data) => res.json(data));
};

exports.updateLikes = (req, res, next) => {
  const { username, postId } = req.body;
  // console.log(username, postId);

  Post.findById(postId).then((data) => {
    if (data.likes.find((name) => name === username)) {
      Post.findOneAndUpdate(
        { _id: postId },
        { $pull: { likes: username } },
        { new: true }
      )
        .populate('userId')
        .then((data) => res.json({ data }))
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
        .then((data) => res.json({ data }))
        .catch((err) => {
          res.status(400).json({ msg: err.message });
        });
    }
  });
};
