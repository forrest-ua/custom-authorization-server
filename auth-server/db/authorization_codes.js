'use strict';

const codes = {};

exports.find = (key, done) => {
    if (codes[key]) return done(null, codes[key]);
    return done(new Error('Code Not Found'));
};

exports.save = (code, clientId, redirectUri, userId, userName, done) => {
    codes[code] = { clientId, redirectUri, userId, userName };
    done();
};