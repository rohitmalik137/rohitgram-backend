const express = require('express');
const router = express.Router();
// const { body } = require('express-validator');

const chatController = require('../controllers/chat');
const isAuth = require('../middleware/is-auth');

// Get messages of a particular chat
router.get('/getChat/:chatId', chatController.getChat);

// Store Chat message to DB
router.post('/postMessage', isAuth, chatController.postMessage);

//delete user chat by chatId
router.patch('/blockUser', chatController.blockUser);

// unsend chat msg
router.patch('/unsendMessage', isAuth, chatController.unsendMessage);

//check if other user is typing
router.post('/isTyping', isAuth, chatController.isUserTyping);
module.exports = router;
