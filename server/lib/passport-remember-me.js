const passport = require('passport');

class RememberMeStrategy extends passport.Strategy {
    constructor(options, verify, issue) {
        if (typeof options == 'function') {
            issue = verify;
            verify = options;
            options = {};
        }
        if (!verify) throw new Error('remember me cookie authentication strategy requires a verify function');
        if (!issue) throw new Error('remember me cookie authentication strategy requires an issue function');

        super();

        const opts = { path: '/', httpOnly: true, maxAge: 1000 * 3600 * 24 * 7 }; // maxAge: 7 days
        this._key = options.key || 'remember_me';
        this._opts = {...opts, ...options.cookie};
        this._passReqToCallback = options.passReqToCallback;
        this.name = 'remember-me';
        this._verify = verify;
        this._issue = issue;
    }

    /**
     * Authenticate request based on remember me cookie.
     *
     * @param {Object} req
     * @api protected
     */
    authenticate(req, _options) {
        // The remember me cookie is only consumed if the request is not authenticated.
        if (req.isAuthenticated()) { return this.pass(); }

        const token = req.cookies[this._key];

        // Since the remember me cookie is primarily a convenience, the lack of one is
        // not a failure.  In this case, a response should be rendered indicating a
        // logged out state, rather than denying the request.
        if (!token) { return this.pass(); }

        const verified = (err, user, info) => {
            if (err) { return this.error(err); }

            if (!user) {
                // The remember me cookie was not valid.  However, because this
                // authentication method is primarily a convenience, we don't want to
                // deny the request.  Instead we'll clear the invalid cookie and proceed
                // to respond in a manner which indicates a logged out state.

                req.res.clearCookie(this._key);
                return this.pass();
            }

            // The remember me cookie was valid and consumed.  For security reasons,
            // the just-used token should have been invalidated by the application.
            // A new token will be issued and set as the value of the remember me
            // cookie.
            const issued = (err, val) => {
                if (err) { return this.error(err); }
                req.res.cookie(this._key, val, this._opts);
                return this.success(user, info);
            }

            this._issue(user, issued);
        }

        if (this._passReqToCallback) {
            this._verify(req, token, verified);
        } else {
            this._verify(token, verified);
        }
    }
}

module.exports = RememberMeStrategy;
