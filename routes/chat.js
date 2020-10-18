const express = require('express');
const router = express.Router();
// const { body } = require('express-validator');

const chatController = require('../controllers/chat');
const isAuth = require('../middleware/is-auth');

// Get messages of a particular chat
router.get('/getChat/:chatId', chatController.getChat);

// Store Chat message to DB
router.post('/postMessage', isAuth, chatController.postMessage);

module.exports = router;
