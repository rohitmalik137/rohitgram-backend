const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const replyCommentSchema = new Schema(
  {
    comment: {
      type: String,
    },
    likes: {
      type: Array,
    },
    repliedTo: {
      type: String,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Auth',
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
  },
  { timestamps: true }
);

const commentSchema = new Schema(
  {
    comment: {
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
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model('Comment', commentSchema);
const ReplyComment = mongoose.model('ReplyComment', replyCommentSchema);

module.exports = {
  Comment,
  ReplyComment,
};
