const express = require('express');
const passport = require('passport');

const router = express.Router();

router.get('/', function(req, res) {
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
            const token = await req.user.issueToken();
            console.log('Setting remember me cookie');
            res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: 1000 * 3600 * 24 * 90 }); // 90 days

            res.redirect(req.session.returnTo || '/playlists');
        });
    }
);

module.exports = router;
