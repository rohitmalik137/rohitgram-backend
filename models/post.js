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
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
    },
  },
  { timestamps: { type: Number, default: Date.now() } }
);

module.exports = mongoose.model('Post', postSchema);
