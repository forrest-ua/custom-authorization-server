  
'use strict';

const passport = require('passport');

module.exports.info = [
  passport.authenticate('bearer', { session: false }),
  (request, response) => {
    response.json({ user_id: request.user._id, name: request.user.name, scope: request.authInfo.scope });
  }
];