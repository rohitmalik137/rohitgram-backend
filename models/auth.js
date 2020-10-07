const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const authSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  posts: {
    type: Number,
    required: true,
  },
  followers: {
    type: Array,
    required: true,
  },
  following: {
    type: Array,
    required: true,
  },
  profileUrl: {
    type: String,
  },
  name: {
    type: String,
  },
});

module.exports = mongoose.model('Auth', authSchema);
