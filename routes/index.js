const express = require('express');

const router = express.Router();

router.get('/', function(req, res, next) {
    res.render('index', { title: 'YT Playlists DL', auth: req.app.ytAuth });
});

module.exports = router;
