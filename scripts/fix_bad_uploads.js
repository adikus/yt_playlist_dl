// Load from repl console

const async = require('async')
const request = require('request-promise')

let videos = await models.video.allAsync();

await Video.preload(app, videos, 'original_upload_id', 'originalUpload', 'upload')
await Video.preload(app, videos, 'mp3_upload_id', 'mp3Upload', 'upload')
await Video.preloadCustomUploads(app, videos)

let playlistVideos = await models.playlist_video.allAsync()
let playlistVideoIds = playlistVideos.map((pv) => pv.video_id)
let uploadOnlyVideos = videos.filter((video) => video.originalUpload?.file && !video.mp3Upload?.file && playlistVideoIds.includes(video.id))

async.eachLimit(uploadOnlyVideos, 50, async function (video) { await video.uploadToS3() });
async.eachLimit(uploadOnlyVideos, 50, async function (video) {
    try {
        await video.convertAndUploadToS3();
    } catch (err) {
        console.error(err);
    }
});

// let badVideos = await async.filterLimit(videosWithUpload, 2, async (video) => {
//     console.log(video.id);
//     try {
//         let response = await request({ method: 'HEAD', uri: video.originalUpload.S3Url() })
//         return response['content-length'] === '0'
//     } catch (e) {
//         return false;
//     }
// })
