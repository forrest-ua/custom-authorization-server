require('dotenv').config();
const express = require('express');
const http = require('http');
const morgan = require('morgan');
const request = require('request');
const session = require('express-session');
const {auth, requiresAuth} = require('express-openid-connect');

const appUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT}`;

const app = express();

app.set('view engine', 'ejs');

app.use(morgan('combined'));
app.use(session({
  secret: process.env.APP_SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));

const passport = require('passport')
const OAuth2Strategy = require('passport-oauth').OAuth2Strategy

app.use(passport.initialize());
app.use(passport.session());

passport.use('provider', new OAuth2Strategy({
    authorizationURL: `${process.env.ISSUER_BASE_URL}/oauth/authorize`,
    tokenURL: `${process.env.ISSUER_BASE_URL}/oauth/token`,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
  },
  function(token, tokenSecret, profile, done) {
    request(`${process.env.ISSUER_BASE_URL}/api/userinfo`, {
      headers: {'authorization': 'Bearer ' + token },
      json: true
    }, (err, res) => {
      done(null, {
        id: res.body.user_id,
        name: res.body.name,
      });
    })
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.get('/auth/provider', passport.authenticate('provider', { scope: 'openid profile email' }));
app.get('/auth/provider/callback',
  passport.authenticate('provider', { successRedirect: '/',
                                      failureRedirect: '/login' }));

app.get('/', (req, res) => {
  res.render('home', { user: req.user });
});

app.get('/user', requiresAuth(), (req, res) => {
  res.render('user', { user: req.user });
});


app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(err);
});

http.createServer(app).listen(process.env.PORT, () => {
  console.log(`listening on ${appUrl}`);
});
