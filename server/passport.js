const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const LocalAPIKeyStrategy = require('passport-localapikey-update').Strategy;
const RememberMeStrategy = require('./lib/passport-remember-me');
const { asyncContext } = require('./context');

module.exports = {
    setupPassport(app) {
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(passport.authenticate('remember-me'));

        passport.serializeUser((user, done) => {
            done(null, user.id);
        });

        passport.deserializeUser(async (req, id, done) => {
            asyncContext(req, async () => {
                const user = await app.models.user.getAsync(id);
                done(null, user);
            });
        });

        passport.use('local', new LocalStrategy(
            { passReqToCallback: true },
            async (req, username, password, done) => {
                asyncContext(req, async () => {
                    const user = await app.models.user.oneAsync({ username: username });
                    if (!user) return done(null, false, { message: 'Incorrect username.' });

                    if (await user.validatePassword(password)){
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Incorrect password.' });
                    }
                });
            }
        ));

        passport.use('remember-me', new RememberMeStrategy(
            { cookie: { maxAge: 1000 * 3600 * 24 * 90 }, passReqToCallback: true }, // 90 days
            async (req, token, done) => {
                asyncContext(req, async () => {
                    const user = await app.models.user.oneAsync({ remember_token: token });

                    if (!user) return done(null, false);

                    if (user.validRememberToken()){
                        return done(null, user);
                    } else {
                        return done(null, false);
                    }
                });
            },
            async (user, done) => {
                const token = await user.issueToken();
                done(null, token)
            }
        ));

        passport.use('api-key', new LocalAPIKeyStrategy(
            { passReqToCallback: true },
            async (req, api_key, done) => {
                asyncContext(req, async () => {
                    if(process.env.CRON_TOKEN === api_key) return done(null, {});

                    const user = await app.models.user.oneAsync({ api_key: api_key });
                    if (!user) { return done(null, false); }
                    return done(null, user);
                });
            }
        ));
    },

    passwordCheck(req, res, next) {
        if (req.isAuthenticated())
            return next();
        else {
            req.session.returnTo = req.originalUrl;
            req.flash('error', 'Please sign in');
            res.redirect('/');
        }
    },

    apiKeyCheck: passport.authenticate('api-key', { session: false })
}