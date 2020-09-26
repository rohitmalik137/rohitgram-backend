const Auth = require('../models/auth');

exports.getUsers = (req, res, next) => {
  Auth.find()
    .select('username')
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
