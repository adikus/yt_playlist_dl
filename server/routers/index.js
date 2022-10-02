const express = require('express');
const passport = require('passport');

const router = express.Router();

router.get('/', function(req, res, next) {
    if(req.user){
        res.redirect('/playlists');
    } else {
        res.render('index', { title: 'YT Playlists DL', user: req.user });
    }
});

router.post(
    '/login',
    passport.authenticate('local', { failureRedirect: '/', failureFlash: true }),
    (req, res) => {
        req.session.save(async () => {
            if (!req.user.remember_token || !req.user.validRememberToken()) {
                const token = await req.user.issueToken();
                console.log('Setting remember me cookie');
                res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: 1000 * 3600 * 24 * 30 }); // 1 month
            }

            res.redirect(req.session.returnTo || '/playlists');
        });
    }
);

module.exports = router;
