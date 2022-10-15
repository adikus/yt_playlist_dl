const express = require('express');

const router = express.Router();
const wrap = require('./../lib/express-router-promise').wrap;

router.get('/:id/*', wrap(async function(req, res, next) {
    req.video = await req.models.video.getAsync(req.params.id);
    next();
}));

router.get('/:id/upload', wrap(async function(req, res) {
    await req.video.uploadToS3();
    res.redirect('back');
}));

router.get('/:id/convert', wrap(async function(req, res) {
    await req.video.convertAndUploadToS3();
    res.redirect('back');
}));

module.exports = router;
