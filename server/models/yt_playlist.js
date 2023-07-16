const request = require('request-promise');
const _ = require('lodash');

const ytVideo = require('./yt_video');
const logger = require("../logger");

const ytApiUrl = 'https://www.googleapis.com/youtube/v3';

exports.search = async function(token, qs) {
    const response = await request.get({
        url: ytApiUrl + '/playlists',
        qs: qs,
        auth: {
            bearer: token
        },
        json: true
    });
    return response.items;
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

async function getVideosDetails(items, idsToIgnore, token) {
    idsToIgnore = idsToIgnore || [];
    let videoIds = _(items).map((item) => item.contentDetails.videoId);
    videoIds = _(videoIds).filter((id) => !idsToIgnore.includes(id)).value();

    if (videoIds.length === 0) {
        return;
    }

    let qs = {
        part: 'id,contentDetails,snippet,status',
        id: videoIds.join(','),
        maxResults: 50
    };

    logger.log(`Searching ${videoIds.length} videos to get video details`);
    const videos = await ytVideo.search(token, qs);
    let videoObject = _(_(videos).map((video) => { return [video.id, video]; })).fromPairs().value();
    _(items).each((item) => { item.video = videoObject[item.contentDetails.videoId]; });
}

exports.getItemsPage = async function(id, pageToken, previousPageItems, token, params) {
    logger.log('Getting page', pageToken, 'from', id);

    const response = await request({
        url: ytApiUrl + '/playlistItems',
        qs: {
            part: 'id,snippet,contentDetails',
            maxResults: 50,
            playlistId: id,
            pageToken: pageToken
        },
        auth: {
            bearer: token
        },
        json: true
    });

    const items = response.items;
    await getVideosDetails(items, params.idsToIgnore, token);
    previousPageItems.push.apply(previousPageItems, items);

    if(response.nextPageToken){
        return await this.getItemsPage(id, response.nextPageToken, previousPageItems, token, params);
    } else {
        return previousPageItems;
    }
};

exports.getItems = async function(id, token, params) {
    return await this.getItemsPage(id, null, [], token, params || {})
};
