// config/passport.js
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Adjust path as necessary

module.exports = function(passport) {
    // Local Strategy
    passport.use(new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {
        User.findOne({ where: { username: username } })
            .then(user => {
                if (!user) {
                    return done(null, false, { message: 'Username is not registered' });
                }

                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Password incorrect' });
                    }
                });
            })
            .catch(err => {
                console.error('Error during authentication:', err);
                done(err);
            });
    }));

    // Google Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID || 'google-client-id-placeholder',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'google-client-secret-placeholder',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
    },
    async function(accessToken, refreshToken, profile, done) {
        try {
            const [user, created] = await User.findOrCreate({
                where: { googleId: profile.id },
                defaults: {
                    username: profile.displayName,
                    email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null
                }
            });
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }));

    // Serialize and Deserialize User
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        User.findByPk(id)
            .then(user => done(null, user))
            .catch(err => done(err, null));
    });
};
