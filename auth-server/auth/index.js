'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const BasicStrategy = require('passport-http').BasicStrategy;
const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
const BearerStrategy = require('passport-http-bearer').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../db');

/**
 * LocalStrategy
 *
 * This strategy is used to authenticate users based on a username and password.
 * Anytime a request is made to authorize an application, we must ensure that
 * a user is logged in before asking them to approve the request.
 */
passport.use(new LocalStrategy(
    (email, password, done) => {
        db.users.findByEmail(email, (error, user) => {
            if (error) return done(error);
            if (!user) return done(null, false);
            if (user.password !== password) return done(null, false);
            return done(null, user);
        });
    }
));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK,
}, function (accessToken, refreshToken, profile, cb) {
        const email = profile.emails[0].value
        db.users.findByEmail(email, function (err, user) {
            if (err) { return cb(err); }
            if (user) { return cb(null, user); }

            return db.users.create({
                email: email,
                name: profile.name.givenName + ' ' + profile.name.familyName
            }, cb)
        });
    }
));

passport.serializeUser(function (user, cb) {
    cb(null, user._id);
});

passport.deserializeUser(function (id, cb) {
    db.users.findById(id, function (err, user) {
        if (err) { return cb(err); }
        cb(null, user);
    });
});

/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients. They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens. The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate. Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header). While this approach is not recommended by
 * the specification, in practice it is quite common.
 */
function verifyClient(clientId, clientSecret, done) {
    db.clients.findByClientId(clientId, (error, client) => {
        if (error) return done(error);
        if (!client) return done(null, false);
        if (client.clientSecret !== clientSecret) return done(null, false);
        return done(null, client);
    });
}

passport.use(new BasicStrategy(verifyClient));

passport.use(new ClientPasswordStrategy(verifyClient));


/**
 * BearerStrategy
 *
 * This strategy is used to authenticate either users or clients based on an access token
 * (aka a bearer token). If a user, they must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */
passport.use(new BearerStrategy(
    (accessToken, done) => {
        db.accessTokens.find(accessToken, (error, token) => {
            if (error) return done(error);
            if (!token) return done(null, false);
            console.log(token)
            if (token.userId) {
                db.users.findById(token.userId, (error, user) => {
                    if (error) return done(error);
                    if (!user) return done(null, false);
                    // To keep this example simple, restricted scopes are not implemented,
                    // and this is just for illustrative purposes.
                    done(null, user, { scope: '*' });
                });
            } else {
                // The request came from a client only since userId is null,
                // therefore the client is passed back instead of a user.
                db.clients.findByClientId(token.clientId, (error, client) => {
                    if (error) return done(error);
                    if (!client) return done(null, false);
                    // To keep this example simple, restricted scopes are not implemented,
                    // and this is just for illustrative purposes.
                    done(null, client, { scope: '*' });
                });
            }
        });
    }
));