// const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Auth = require('../models/auth');

exports.signup = (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }
  Auth.findOne({ $or: [{ email: email }, { username: username }] })
    .then((user) => {
      if (user) throw Error('User already exists');
      bcrypt.hash(password, 12).then((hashedPwd) => {
        const newUser = new Auth({
          username: username,
          email: email,
          password: hashedPwd,
          posts: 0,
          followers: [],
          following: [],
        });
        newUser
          .save()
          .then((result) => {
            const token = jwt.sign(
              {
                username: result.username,
                email: result.email,
                userId: result._id,
              },
              process.env.JWT_SECRET_KEY,
              { expiresIn: '1h' }
            );
            res.status(201).json({
              token: token,
              user: {
                id: result._id,
                username: result.username,
                email: result.email,
                posts: result.posts,
                followers: result.followers,
                following: result.following,
              },
            });
          })
          .catch((err) => {
            if (!err.statusCode) {
              err.statusCode = 500;
            }
            next(err);
          });
      });
    })
    .catch((err) => {
      res.status(400).json({ msg: err.message });
    });
};

exports.login = (req, res, next) => {
  const { uname_or_email, password } = req.body;
  if (!uname_or_email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }
  let loadedUser;
  Auth.findOne({
    $or: [{ email: uname_or_email }, { username: uname_or_email }],
  })
    .then((user) => {
      if (!user) {
        const error = new Error('User could not be found.');
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error('Wrong password!');
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          username: loadedUser.username,
          email: loadedUser.email,
          userId: loadedUser._id,
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1h' }
      );
      console.log(loadedUser);
      res.status(200).json({
        token: token,
        user: {
          id: loadedUser._id,
          username: loadedUser.username,
          email: loadedUser.email,
          followers: loadedUser.followers,
          following: loadedUser.following,
        },
      });
    })
    .catch((err) => {
      res.status(400).json({ msg: err.message });
    });
};

exports.userData = (req, res, next) => {
  // console.log(req.user);
  Auth.findById(req.user.userId)
    .select('-password')
    .then((user) => res.json(user));
};
