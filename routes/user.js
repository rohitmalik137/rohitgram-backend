const express = require('express');
const router = express.Router();
// const { body } = require('express-validator');

const userController = require('../controllers/user');
const isAuth = require('../middleware/is-auth');

//get users list from DB
router.get('/usersList', userController.getUsers);

//get user info like posts, followers, following
router.get('/userInfo/:username', userController.getUserInfo);

router.patch('/follow', userController.updateFollow);
router.patch('/unfollow', userController.updateUnfollow);

router.patch('/profile', isAuth, userController.updateProfile);

module.exports = router;
