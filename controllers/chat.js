const Chat = require('../models/chat');
const io = require('../socket');

exports.postMessage = (req, res, next) => {
  const { chatId, user, message } = req.body;
  Chat.find({ chatId }).then((ress) => {
    if (ress.length) {
      Chat.findOneAndUpdate(
        { chatId },
        {
          $push: {
            messages: { user: user, message: message, sentAt: new Date() },
          },
        },
        { new: true }
      )
        .then((data) => {
          io.getIO().emit('postMessage', { action: 'postMessage', data });
          res.json(data);
        })
        .catch((err) => {
          if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
        });
    } else {
      const messageData = new Chat({
        chatId,
        messages: [{ user, message, sentAt: new Date() }],
      });
      messageData
        .save()
        .then((data) => {
          io.getIO().emit('postMessage', { action: 'postMessage', data });
          res.json(data);
        })
        .catch((err) => {
          if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
        });
    }
  });
};

exports.getChat = (req, res, next) => {
  const { chatId } = req.params;
  Chat.find({ chatId })
    .then((data) => {
      io.getIO().emit('getChat', { action: 'getChat', data });
      res.json(data);
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
