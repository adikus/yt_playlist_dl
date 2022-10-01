const request = require('request');

const yt_api = 'https://www.googleapis.com/youtube/v3';

exports.search = function(token, qs, callback) {
    request.get({
        url: yt_api + '/videos',
        qs: qs,
        auth: {
            bearer: token
        }
    }, function(err, response, body) {
        let videos = JSON.parse(body).items;
        callback(videos);
    });
};
