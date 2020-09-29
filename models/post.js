const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    mediaUrl: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
    },
    likes: {
      type: Array,
      required: true,
    },
    comments: {
      type: Object,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
