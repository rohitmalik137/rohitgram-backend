const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const chatSchema = new Schema(
  {
    chatId: {
      type: String,
      required: true,
    },
    blocked: {
      type: Array,
      default: [],
    },
    messages: [
      {
        user: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        sentAt: { type: String, required: true },
      },
    ],
  },
  { timestamps: { type: Number, default: Date.now() } }
);

module.exports = mongoose.model('Chat', chatSchema);
