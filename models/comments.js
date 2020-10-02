const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const replySchema = new Schema({
  comment: {
    type: String,
  },
  likes: {
    type: Array,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'Auth',
  },
});

const commentSchema = new Schema(
  {
    comment: {
      type: String,
    },
    likes: {
      type: Array,
      required: true,
    },
    replies: [replySchema],
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    child: replySchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
