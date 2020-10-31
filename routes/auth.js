const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// POST /auth/signup
router.post(
  '/signup',
  [
    body('username')
      .not()
      .isEmpty()
      .trim()
      .escape()
      .withMessage("Username can't be empty!"),
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email'),
    body('password')
      .trim()
      .isLength({ min: 5 })
      .withMessage('Password must be minimum 5 characters long'),
  ],
  authController.signup
);

// GET /auth/emailVerification/:token
router.post('/emailVerification/:tokenId', authController.verifyUser);

//PATCH /auth/verifyUserAfterAccountCreation
router.patch(
  '/verifyUserAfterAccountCreation',
  [
    body('mailForVerification')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email'),
  ],
  authController.verifyUserAfterAccountCreation
);

router.patch(
  '/getEmailToResetPassword',
  [
    body('mailForForgotPassword')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email'),
  ],
  authController.getEmailToResetPassword
);

router.patch(
  '/postResetPassword',
  [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email'),
    body('npassword')
      .trim()
      .isLength({ min: 5 })
      .withMessage('Password must be minimum 5 characters long'),
  ],
  authController.postResetPassword
);

// POST /auth/login
router.post(
  '/login',
  [
    body('uname_or_email')
      .not()
      .isEmpty()
      .trim()
      .escape()
      .withMessage("Username can't be empty"),
  ],
  authController.login
);

// PATCH /auth/changePassword
router.patch(
  '/changePassword',
  [
    body('username')
      .not()
      .isEmpty()
      .trim()
      .escape()
      .withMessage('User not exists. PLease log in first.'),
    body('cpassword')
      .trim()
      .isLength({ min: 5 })
      .withMessage('Password must be minimum 5 characters long'),
    body('npassword')
      .trim()
      .isLength({ min: 5 })
      .withMessage('New Password must be minimum 5 characters long')
      .custom((value, { req }) => {
        if (value !== req.body.cnpassword) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      }),
    body('cnpassword')
      .trim()
      .isLength({ min: 5 })
      .withMessage('ConfirPassword must be minimum 5 characters long'),
  ],
  isAuth,
  authController.postChangePassword
);

// GET /auth/user
router.get('/user', isAuth, authController.userData);

module.exports = router;
