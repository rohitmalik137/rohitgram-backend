const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const passwordResetTokenSchema = new Schema({
  token: {
    type: String,
    required: true,
  },
  _userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: { type: Date, required: true, default: Date.now, expires: '10m' },
});

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
