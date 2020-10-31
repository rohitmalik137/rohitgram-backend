const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const otpGenerator = require('otp-generator');

const Auth = require('../models/auth');
const Token = require('../models/token');
const PasswordResetToken = require('../models/passResetToken');

const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key: process.env.SENDGRID_KEY,
    },
  })
);

exports.signup = (req, res, next) => {
  var errorString = '';
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().forEach((ele) => {
      errorString = errorString.concat(ele.msg + ',');
    });
    return res.status(422).json({
      msg: errorString,
    });
  }

  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }
  Auth.findOne({ $or: [{ email: email }, { username: username }] })
    .then((user) => {
      if (user)
        return res.status(400).json({
          msg: 'User or Email already associated with another account',
        });

      bcrypt.hash(password, 12).then((hashedPwd) => {
        const newUser = new Auth({
          username: username,
          email: email,
          password: hashedPwd,
          isVerified: false,
          posts: 0,
          followers: [],
          following: [],
        });
        newUser
          .save()
          .then((result) => {
            crypto.randomBytes(32, (err, buffer) => {
              if (err) res.status(400).json({ msg: err.message });
              const token = buffer.toString('hex');
              const newToken = new Token({
                token,
                _userId: result._id,
              });
              newToken
                .save()
                .then(() => {
                  transporter
                    .sendMail({
                      to: email,
                      from: 'bpsrohitmalik@gmail.com',
                      subject: 'Welcome to Rohitgram, Confirm your Email',
                      html: `
                        <div style="background-color: #e9e9e9; padding-bottom: 25px">
                          <h1 style="text-align:center; font-family: 'Oleo Script', cursive; padding: 10px">
                            Rohitgram
                          </h1>
                          <div style="background-color: white; margin: 5px auto 25px; width: 80%; border: 1px solid #777; padding: 20px">
                          <div style="font-family: 'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif; font-size: x-large; margin: 10px 10px 25px">
                          <p style="margin:0">You're on your way!</p>
                          <p style="margin:0">Let's confirm your email address.</p>
                          </div>
                          <p style="margin: 0 10px 25px">By clicking on the following link, you are confirming your email address.</p>
                          <div style="text-align: center; padding-bottom: 25px">
                          <a href='http://localhost:3000/accounts/verified/${token}/someveryrandomstringofnouse' style="font-size: small; background-color: #1957ff; color: white; text-decoration: none; padding: 15px 25px;">Confirm Email Address</a>
                          </div>
                          </div>
                        </div>
                      `,
                    })
                    .then(() => {
                      res.json({ msg: 'sucess till now' });
                    });
                })
                .catch((err) => {
                  if (!err.statusCode) {
                    err.statusCode = 500;
                  }
                  next(err);
                });
            });
          })
          .catch((err) => {
            if (!err.statusCode) {
              err.statusCode = 500;
            }
            next(err);
          });
      });
    })
    .catch((err) => {
      res.status(400).json({ msg: err.message });
    });
};

exports.login = (req, res, next) => {
  var errorString = '';
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().forEach((ele) => {
      errorString = errorString.concat(ele.msg + ',');
    });
    return res.status(422).json({
      msg: errorString,
    });
  }

  const { uname_or_email, password } = req.body;
  if (!uname_or_email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }
  let loadedUser;
  Auth.findOne({
    $or: [{ email: uname_or_email }, { username: uname_or_email }],
  })
    .then((user) => {
      if (!user) {
        const error = new Error('User could not be found.');
        error.statusCode = 401;
        throw error;
      }
      if (!user.isVerified) {
        const error = new Error('User has not been verified. Please verify');
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error('Wrong password!');
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          username: loadedUser.username,
          email: loadedUser.email,
          userId: loadedUser._id,
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1h' }
      );
      // console.log(loadedUser);
      res.status(200).json({
        token: token,
        user: {
          id: loadedUser._id,
          username: loadedUser.username,
          email: loadedUser.email,
          followers: loadedUser.followers,
          following: loadedUser.following,
        },
      });
    })
    .catch((err) => {
      res.status(400).json({ msg: err.message });
    });
};

exports.userData = (req, res, next) => {
  // console.log(req.user);
  Auth.findById(req.user.userId)
    .select('-password')
    .then((user) => res.json(user));
};

exports.verifyUser = (req, res, next) => {
  const { tokenId } = req.params;
  Token.find({ token: tokenId })
    .then((result) => {
      if (!result || result.length == 0)
        return res.status(400).json({
          msg:
            'We were unable to find a valid token. Your token my have expired.',
        });
      Auth.findById({ _id: result[0]._userId })
        .then((user) => {
          if (!user)
            return res
              .status(400)
              .json({ msg: 'We are unable to find a user for this token.' });
          if (user.isVerified)
            return res.status(400).json({ msg: 'The user has been verified.' });
          user.isVerified = true;
          user
            .save()
            .then((result) => {
              const token = jwt.sign(
                {
                  username: result.username,
                  email: result.email,
                  userId: result._id,
                },
                process.env.JWT_SECRET_KEY,
                { expiresIn: '1h' }
              );
              res.status(201).json({
                token: token,
                user: {
                  id: result._id,
                  username: result.username,
                  email: result.email,
                  posts: result.posts,
                  followers: result.followers,
                  following: result.following,
                },
              });
            })
            .catch((err) => {
              return res.status(500).json({ msg: err.message });
            });
        })
        .catch((err) => {
          return res.status(500).json({ msg: err.message });
        });
    })
    .catch((err) => {
      res.status(400).json({ msg: err.message });
    });
};

exports.verifyUserAfterAccountCreation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      msg: errors.array()[0].msg,
    });
  }

  const { mailForVerification } = req.body;
  Auth.findOne({ email: mailForVerification })
    .then((result) => {
      if (!result) {
        return res
          .status(400)
          .json({ msg: 'User not exists. Please sign up First!' });
      }
      if (result.isVerified)
        return res
          .status(400)
          .json({ msg: 'The user has already been verified.' });

      crypto.randomBytes(32, (err, buffer) => {
        if (err) res.status(400).json({ msg: err.message });
        const token = buffer.toString('hex');
        const newToken = new Token({
          token,
          _userId: result._id,
        });
        newToken
          .save()
          .then(() => {
            transporter
              .sendMail({
                to: mailForVerification,
                from: 'bpsrohitmalik@gmail.com',
                subject: 'Welcome to Rohitgram, Confirm your Email',
                html: `
                <div style="background-color: #e9e9e9; padding-bottom: 25px">
                  <h1 style="text-align:center; font-family: 'Oleo Script', cursive; padding: 10px">
                    Rohitgram
                  </h1>
                  <div style="background-color: white; margin: 5px auto 25px; width: 80%; border: 1px solid #777; padding: 20px">
                  <div style="font-family: 'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif; font-size: x-large; margin: 10px 10px 25px">
                  <p style="margin:0">You're on your way!</p>
                  <p style="margin:0">Let's confirm your email address.</p>
                  </div>
                  <p style="margin: 0 10px 25px">By clicking on the following link, you are confirming your email address.</p>
                  <div style="text-align: center; padding-bottom: 25px">
                  <a href='http://localhost:3000/accounts/verified/${token}/someveryrandomstringofnouse' style="font-size: small; background-color: #1957ff; color: white; text-decoration: none; padding: 15px 25px;">Confirm Email Address</a>
                  </div>
                  </div>
                </div>
                `,
              })
              .then(() => {
                res.json({ msg: 'sucess till now' });
              });
          })
          .catch((err) => {
            if (!err.statusCode) {
              err.statusCode = 500;
            }
            next(err);
          });
      });
    })
    .catch((err) => {
      return res.status(500).json({ msg: err.message });
    });
};

exports.getEmailToResetPassword = (req, res, next) => {
  const { mailForForgotPassword } = req.body;
  Auth.findOne({ email: mailForForgotPassword })
    .then((result) => {
      if (!result) {
        return res
          .status(400)
          .json({ msg: 'User not exists. Please sign up First!' });
      }
      const myOTP = otpGenerator.generate(6, {
        upperCase: false,
        specialChars: false,
        alphabets: false,
      });
      const newToken = new PasswordResetToken({
        token: myOTP,
        _userId: result._id,
      });
      newToken
        .save()
        .then(() => {
          transporter
            .sendMail({
              to: mailForForgotPassword,
              from: 'bpsrohitmalik@gmail.com',
              subject: 'Reset Password OTP | Rohitgram',
              html: `
                <div style="text-align:center; background-color: #e9e9e9; padding-bottom: 25px">
                  <h1 style="font-family: 'Oleo Script', cursive; padding: 10px">
                    Rohitgram
                  </h1>
                  <div style="background-color: white; margin: 5px auto 25px; width: 80%; border: 1px solid #777; padding: 20px">
                  <div style="font-family: 'Open Sans','Helvetica Neue','Helvetica',Helvetica,Arial,sans-serif; font-size: x-large; margin: 10px 10px 25px">
                  <p style="margin:0">Your Reset Password OTP</p>
                  <p style="margin:0">Email Id: ${mailForForgotPassword}</p>
                  </div>
                  <p style="margin: 0 10px 25px">Use the below OTP to generate a new password.</p>
                  <div style="text-align: center; padding-bottom: 25px">
                  <span style="border: 1px solid #777; font-size: x-large; padding: 5px 20px;">${myOTP}</span>
                  </div>
                  <p>*This OTP code is valid for 10 minutes.*</p>
                  <p style="font-size: smaller">If you haven't asked for a change in your password, don't worry. Your password is still safe.</p>
                  </div>
                </div>
                `,
            })
            .then(() => {
              res.json({ msg: 'sucess till now' });
            });
        })
        .catch((err) => {
          if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
        });
    })
    .catch((err) => {
      return res.status(500).json({ msg: err.message });
    });
};

exports.postResetPassword = (req, res, next) => {
  const { email, otp, npassword } = req.body;
  console.log(email, otp, npassword);
  var errorString = '';
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().forEach((ele) => {
      errorString = errorString.concat(ele.msg + ',');
    });
    return res.status(422).json({
      msg: errorString,
    });
  }

  PasswordResetToken.findOne({ token: otp })
    .then((result) => {
      if (!result) {
        return res
          .status(400)
          .json({ msg: 'Invalid Token! Please verify again' });
      }
      bcrypt
        .hash(npassword, 12)
        .then((hashedPwd) => {
          Auth.findOneAndUpdate({ email }, { password: hashedPwd })
            .then(() =>
              res.json({
                msg: 'Password changed successfully! Login to explore.',
                status: 'success',
              })
            )
            .catch((err) => {
              if (!err.statusCode) {
                err.statusCode = 500;
              }
              next(err);
            });
        })
        .catch((err) => {
          return res.status(500).json({ msg: err.message });
        });
    })
    .catch((err) => {
      return res.status(500).json({ msg: err.message });
    });
};

exports.postChangePassword = (req, res, next) => {
  var errorString = '';
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().forEach((ele) => {
      errorString = errorString.concat(ele.msg + ',');
    });
    return res.status(422).json({
      msg: errorString,
    });
  }

  const { username, cpassword, cnpassword } = req.body;
  console.log(username, cpassword, cnpassword);
  Auth.findOne({ username }).then((result) => {
    bcrypt
      .compare(cpassword, result.password)
      .then((data) => {
        if (data) {
          bcrypt
            .hash(cnpassword, 12)
            .then((hashedPwd) => {
              result.password = hashedPwd;
              result
                .save()
                .then(() => {
                  res.json({
                    msg: 'Password changed successfully!',
                    status: 'success',
                  });
                })
                .catch((err) => {
                  return res.status(500).json({ msg: err.message });
                });
            })
            .catch((err) => {
              return res.status(500).json({ msg: err.message });
            });
        } else {
          const error = new Error('Incorrent current password');
          error.statusCode = 401;
          throw error;
        }
      })
      .catch((err) => {
        return res.status(err.statusCode).json({ msg: err.message });
      });
  });
};
