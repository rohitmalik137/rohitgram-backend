const Auth = require('../models/auth');
const { validationResult } = require('express-validator');
const io = require('../socket');

exports.getUsers = (req, res, next) => {
  Auth.find()
    .select('-password')
    .then((users) => {
      res.json(users);
    });
};

exports.getUserInfo = (req, res, next) => {
  const username = req.params.username;
  // console.log(username);
  Auth.findOne({ username })
    .select('-password')
    .then((info) => {
      res.json(info);
    })
    .catch((err) => {
      res.status(400).json({ msg: err.message });
    });
};

exports.updateFollow = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'error in following',
      errors: errors.array(),
    });
  }

  const { username, followedUser } = req.body;
  console.log(username, followedUser);

  Auth.findOneAndUpdate(
    { username },
    { $push: { following: followedUser } },
    { new: true }
  )
    .then(() => {
      Auth.findOneAndUpdate(
        { username: followedUser },
        { $push: { followers: username } },
        { new: true }
      )
        .then((data) => {
          io.getIO().emit('updateFollow', { action: 'updateFollow', data })
          res.json({ data });
        })
        .catch((err) => {
          res.status(400).json({ msg: err.message });
        });
    })
    .catch((err) => {
      res.status(400).json({ msg: err.message });
    });
};

exports.updateUnfollow = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'error in unfollowing',
      errors: errors.array(),
    });
  }
  const { username, followedUser } = req.body;
  console.log(username, followedUser);

  Auth.findOneAndUpdate(
    { username },
    { $pull: { following: followedUser } },
    { new: true }
  )
    .then(() => {
      Auth.findOneAndUpdate(
        { username: followedUser },
        { $pull: { followers: username } },
        { new: true }
      )
        .then((data) => {
          io.getIO().emit('updateUnfollow', { action: 'updateUnfollow', data })
          res.json({ data });
        })
        .catch((err) => {
          res.status(400).json({ msg: err.message });
        });
    })
    .catch((err) => {
      res.status(400).json({ msg: err.message });
    });
};

exports.updateProfile = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'validation failed, Please enter an image only',
      errors: errors.array(),
    });
  }
  if (!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    throw error;
  }
  const username = req.body.username;
  const profileUrl = req.file.path;
  Auth.findOneAndUpdate({ username }, { profileUrl: profileUrl }, { new: true })
    .then((data) => res.json({ data }))
    .catch((err) => {
      res.status(400).json({ msg: err.message });
    });
};
