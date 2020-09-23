const express = require('express');
// const { body } = require('express-validator');

const authController = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// POST /auth/signup
router.post('/signup', authController.signup);

// POST /auth/login
router.post('/login', authController.login);

// GET /auth/user
router.get('/user', isAuth, authController.userData);

module.exports = router;
