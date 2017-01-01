const express = require('express');

const router = express.Router();

router.get('/:id/upload', function(req, res) {
    req.models.video.get(req.params.id, function(err, video) {
        if (err) throw err;

        video.uploadToS3(function() {
            res.redirect('/playlists/' + video.playlist_id);
        });
    });
});

router.get('/:id/convert', function(req, res) {
    req.models.video.get(req.params.id, function(err, video) {
        if (err) throw err;

        video.convertAndUploadToS3(function() {
            res.redirect('/playlists/' + video.playlist_id);
        });
    });
});

router.post('/:id/upload-mp3', function(req, res) {
    req.models.video.get(req.params.id, function(err, video) {
        if (err) throw err;

        if(req.files.mp3_file && req.files.mp3_file.data.length){
            let mp3_file = req.files.mp3_file;
            video.uploadUserMp3ToS3(mp3_file, function() {
                res.redirect('/playlists/' + video.playlist_id);
            });
        } else {
            res.redirect('/playlists/' + video.playlist_id);
        }
    });
});

router.post('/:id/metadata', function(req, res) {
    req.models.video.get(req.params.id, function(err, video) {
        if (err) throw err;

        video.metadata.artist = req.body.artist;
        video.metadata.title = req.body.title;
        video.metadata.genre = req.body.genre;
        video.markAsDirty('metadata');

        video.save(function(err) {
            if(err) throw err;
            res.json({status: 'ok'})
        });
    });
});

router.post('/:id/remove', function(req, res) {
    req.models.video.get(req.params.id, function(err, video) {
        if (err) throw err;

        if(video.status != 'removed') {
            video.metadata.yt_status = video.status;
            video.markAsDirty('metadata');
            video.status = 'removed';
        } else {
            video.status = video.metadata.yt_status;
        }

        video.save(function(err) {
            if(err) throw err;
            res.redirect('/playlists/' + video.playlist_id);
        });
    });
});

module.exports = router;
