const request = require('request');
const _ = require('lodash');

const ytVideo = require('./yt_video');

const ytApiUrl = 'https://www.googleapis.com/youtube/v3';

exports.search = function(token, qs, callback) {
    request.get({
        url: ytApiUrl + '/playlists',
        qs: qs,
        auth: {
            bearer: token
        }
    }, function(err, response, body) {
        let playlists = JSON.parse(body).items;
        callback(playlists);
    });
};

exports.retrieve = function(token, callback) {
    let qs = {
        part: 'id,contentDetails,snippet,status',
        mine: 'true',
        maxResults: 50
    };
    this.search(token, qs, function(items){
        callback(items);
    });
};

exports.get = function(id, token, callback) {
    let qs = {
        part: 'id,contentDetails,snippet,status',
        id: id,
        maxResults: 50
    };
    this.search(token, qs, function(items){
        callback(items && items[0]);
    });
};

exports.getItemsPage = function(id, pageToken, previousPageItems, token, callback) {
    let self = this;

    request.get({
        url: ytApiUrl + '/playlistItems',
        qs: {
            part: 'id,snippet,contentDetails',
            maxResults: 50,
            playlistId: id,
            pageToken: pageToken
        },
        auth: {
            bearer: token
        }
    }, function(err, response, body) {
        let payload = JSON.parse(body);
        let items = payload.items;

        let videoIds = _(items).map(function(item) { return item.contentDetails.videoId; });
        let qs = {
            part: 'id,contentDetails,snippet,status',
            id: videoIds.join(','),
            maxResults: 50
        };
        ytVideo.search(token, qs, function(videos){
            let videoObject = _(_(videos).map(function(video) { return [video.id, video]; })).fromPairs().value();
            _(items).each(function(item) { item.video = videoObject[item.contentDetails.videoId]; });
            previousPageItems.push.apply(previousPageItems, items);
            if(payload.nextPageToken){
                self.getItemsPage(id, payload.nextPageToken, previousPageItems, token, callback);
            } else {
                callback(previousPageItems);
            }
        });
    });
};

exports.getItems = function(id, token, callback) {
    this.getItemsPage(id, null, [], token, callback);
};
