const express = require('express');
const Video = require("../models/video");
const _ = require("lodash");

const router = express.Router();
const wrap = require('./../lib/express-router-promise').wrap;

router.get('/search', wrap(async (req, res, next) => {
    const videoData = await req.db.driver.execQueryAsync(`
    SELECT DISTINCT videos.*
    FROM videos INNER JOIN playlist_videos ON playlist_videos.video_id = videos.id,
        (
            SELECT to_tsquery(string_agg(lexeme || ':*', ' & ' order by positions)) AS query
            FROM unnest(to_tsvector(?))
        ) AS search
    WHERE videos.tsv @@ search.query OR playlist_videos.tsv @@ search.query
      AND playlist_videos.playlist_id IN (SELECT id FROM playlists WHERE user_id = ?)
    ORDER BY videos.created_at
    LIMIT 100
    `, [req.query.query, req.user.id])

    const videos = videoData.map((row) => new req.models.video(row))
    await Video.preloadEverything(req, videos);

    res.json({ videos: videos.map((video) => video.asJson()) })
}));

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
