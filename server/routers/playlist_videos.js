const express = require('express');

const router = express.Router();
const wrap = require('./../lib/express-router-promise').wrap;

router.post('/:id/upload-mp3', wrap(async function(req, res) {
    let playlistVideo = await req.models.playlist_video.getAsync(req.params.id);
    if(req.files.mp3_file && req.files.mp3_file.data.length){
        let mp3_file = req.files.mp3_file;
        await playlistVideo.uploadCustomFile(mp3_file, 'mp3', 'custom_mp3');
    }
    res.redirect('back');
}));

router.post('/:id/metadata', wrap(async function(req, res) {
    let playlistVideo = await req.models.playlist_video.getAsync(req.params.id);

    playlistVideo.artist = req.body.artist;
    playlistVideo.title = req.body.title;
    playlistVideo.genre = req.body.genre;

    await playlistVideo.saveAsync();

    res.json({status: 'ok'})
}));

router.post('/:id/remove', wrap(async function(req, res) {
    let playlistVideo = await req.models.playlist_video.getAsync(req.params.id);
    let video = await req.models.video.getAsync(playlistVideo.video_id);

    if(playlistVideo.status !== 'removed') {
        video.metadata.yt_status = playlistVideo.status;
        video.markAsDirty('metadata');
        playlistVideo.status = 'removed';
        await video.saveAsync();
    } else {
        playlistVideo.status = video.metadata.yt_status;
        if(playlistVideo.status === 'removed' || !playlistVideo.status)
            playlistVideo.status = 'public';
    }

    await playlistVideo.saveAsync();
    res.redirect('back');
}));

module.exports = router;
