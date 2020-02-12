require('dotenv').config();

const express = require('express');
const passport = require('passport');
const routes = require('./routes');


var db = require('./db');

// load passport strategies
require('./auth');

// Create a new Express application.
var app = express();

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

// Define routes.
app.get('/',
  function (req, res) {
    res.render('home', { user: req.user });
  });

app.get('/signup',
  function (req, res) {
    res.render('signup');
  });

app.post('/signup', function (req, res) {
  db.users.create({
    email: req.body.email,
    password: req.body.password,
    name: req.body.name
  }, (err, user) => {
    if (err) { return res.send('there was an error ' + err) }
    res.redirect('/login')
  })
});

app.get('/login',
  function (req, res) {
    res.render('login');
  });

app.post('/login', passport.authenticate('local', { successReturnToOrRedirect: '/', failureRedirect: '/login' }));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });


app.get('/logout',
  function (req, res) {
    req.logout();
    res.redirect('/');
  });

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function (req, res) {
    res.render('profile', { user: req.user });
  });

app.get('/oauth/authorize', routes.oauth2.authorization);
app.post('/oauth/authorize/decision', routes.oauth2.decision);
app.post('/oauth/token', routes.oauth2.token);

app.get('/api/userinfo', routes.user.info);

app.listen(3000);
