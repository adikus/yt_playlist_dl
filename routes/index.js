const express = require('express');
const passport = require('passport');

const router = express.Router();

router.get('/', function(req, res, next) {
    res.render('index', { title: 'YT Playlists DL', user: req.user });
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/playlists',
    failureRedirect: '/',
    failureFlash: true
}));

module.exports = router;
