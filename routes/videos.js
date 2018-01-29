const express = require('express');

const router = express.Router();
const wrap = require('./../lib/express-router-promise').wrap;

router.get('/:id/upload', wrap(async function(req, res) {
    let video = await req.models.video.getAsync(req.params.id);
    await video.uploadToS3();
    res.redirect('back');
}));

router.get('/:id/convert', wrap(async function(req, res) {
    let video = await req.models.video.getAsync(req.params.id);
    await video.convertAndUploadToS3();
    res.redirect('back');
}));

module.exports = router;
