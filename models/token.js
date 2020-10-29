const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const tokenSchema = new Schema({
  token: {
    type: String,
    required: true,
  },
  _userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: { type: Date, required: true, default: Date.now, expires: 43200 },
});

module.exports = mongoose.model('Token', tokenSchema);
