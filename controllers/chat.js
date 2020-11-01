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
            messages: {
              user: user,
              message: message,
              likes: [],
              sentAt: new Date(),
            },
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
        messages: [{ user, message, likes: [], sentAt: new Date() }],
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

exports.blockUser = (req, res, next) => {
  const { username, chatId } = req.body;

  Chat.find({ chatId }).then((data) => {
    if (data[0].blocked.includes(username)) {
      Chat.findOneAndUpdate(
        { chatId },
        { $pull: { blocked: username } },
        { new: true }
      )
        .then(() => {
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
        })
        .catch((err) => {
          if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
        });
    } else {
      Chat.findOneAndUpdate(
        { chatId },
        { $push: { blocked: username } },
        { new: true }
      )
        .then(() => {
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

exports.unsendMessage = (req, res, next) => {
  const { chatId, msgId } = req.body;
  Chat.findOneAndUpdate(
    { chatId },
    {
      $pull: {
        messages: { _id: msgId },
      },
    },
    { new: true }
  )
    .then(() => {
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
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.isUserTyping = (req, res, next) => {
  const { user, userTypingFor, isTyping } = req.body;
  io.getIO().emit('isTyping', {
    action: 'isTyping',
    isTyping,
    userTypingFor,
    user,
  });
  res.json({});
};

exports.likeToggleSingleMessage = (req, res, next) => {
  const { chatId, msgId, userWhoLiked } = req.body;
  Chat.findOne({ chatId })
    .then((result) => {
      if (result.messages.length > 0) {
        result.messages.map((messgaeInfo) => {
          if (messgaeInfo._id.toString() === msgId.toString()) {
            if (messgaeInfo.likes.includes(userWhoLiked))
              messgaeInfo.likes.pull(userWhoLiked);
            else messgaeInfo.likes.push(userWhoLiked);
          }
        });
        result
          .save()
          .then(() => {
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
          })
          .catch((err) => {
            if (!err.statusCode) {
              err.statusCode = 500;
            }
            next(err);
          });
      }
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
