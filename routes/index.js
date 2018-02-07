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
    passport.authenticate('local', {
        failureRedirect: '/',
        failureFlash: true
    }), function(req, res) {
        res.redirect(req.session.returnTo || '/playlists');
        delete req.session.returnTo;
    }
);

module.exports = router;
