const request = require('request');
const _ = require('lodash');

const ytVideo = require('./yt_video');

const ytApiUrl = 'https://www.googleapis.com/youtube/v3';

exports.search = function(token, qs, callback) {
    return new Promise(function (resolve, reject) {
        request.get({
            url: ytApiUrl + '/playlists',
            qs: qs,
            auth: {
                bearer: token
            }
        }, function(err, response, body) {
            if(err) return reject(err);
            let playlists = JSON.parse(body).items;
            if(callback) {
                callback(playlists);
            }
            resolve(playlists);
        });
    });
};

exports.retrieve = async function(token, callback) {
    let qs = {
        part: 'id,contentDetails,snippet,status',
        mine: 'true',
        maxResults: 50
    };
    let items = await this.search(token, qs);
    if(callback){
        callback(items);
    } else {
        return items;
    }
};

exports.get = async function(id, token, callback) {
    let qs = {
        part: 'id,contentDetails,snippet,status',
        id: id,
        maxResults: 50
    };
    let items = await this.search(token, qs);
    let item = items && items[0];
    if(callback){
        callback(item);
    } else {
        return item;
    }
};

async function getVideosDetails(items, idsToIgnore, token, callback) {
    idsToIgnore = idsToIgnore || [];
    let videoIds = _(items).map((item) => item.contentDetails.videoId);
    videoIds = _(videoIds).filter((id) => idsToIgnore.indexOf(id) === -1).value();

    if (videoIds.length === 0) {
        return;
    }

    let qs = {
        part: 'id,contentDetails,snippet,status',
        id: videoIds.join(','),
        maxResults: 50
    };

    return new Promise((resolve) => {
        console.log('Searching videos', videoIds.length);
        ytVideo.search(token, qs, function(videos){
            let videoObject = _(_(videos).map(function(video) { return [video.id, video]; })).fromPairs().value();
            _(items).each(function(item) { item.video = videoObject[item.contentDetails.videoId]; });

            if(callback){
                callback();
            }
            resolve();
        });
    });
}

exports.getItemsPage = function(id, pageToken, previousPageItems, token, params, callback) {
    let self = this;

    console.log('Getting page', pageToken);

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
    }, async function(err, response, body) {
        let payload = JSON.parse(body);
        let items = payload.items;

        await getVideosDetails(items, params.idsToIgnore, token);
        previousPageItems.push.apply(previousPageItems, items);

        if(payload.nextPageToken){
            self.getItemsPage(id, payload.nextPageToken, previousPageItems, token, params, callback);
        } else {
            callback(previousPageItems);
        }
    });
};

exports.getItems = async function(id, token, callback) {
    let params = typeof callback == 'function' ? {} : (callback || {});
    callback = typeof callback == 'function' ? callback : null;
    return new Promise((resolve) => {
        this.getItemsPage(id, null, [], token, params, (result) => {
            if(callback){
                callback(result);
            }
            resolve(result);
        });
    });
};
