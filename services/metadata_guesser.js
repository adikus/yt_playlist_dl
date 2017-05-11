const fs = require('fs');

const uploader_formats = {
    'Pandora Journey': {regex: /^([^-]+) - ([^\[\]-]+)(?: \[(.+)\])?$/, values: ['artist', 'title', 'genre']},
    'ThePrimeCronus': {regex: /^([^-]+) - ([^\[\]-]+)(?: \[(.+)\])?$/, values: ['artist', 'title', 'genre']},
    'ThePrimeCronus|alt': {regex: /^(.+) - ([^\[\]-]+)(?: \[(.+)\])?$/, values: ['artist', 'title', 'genre']},
    'ThePrimeAres2': {regex: /^([^-]+) - ([^\[\]-]+)(?: \[(.+)\])?$/, values: ['artist', 'title', 'genre']},
    'ThePrimeThanatos': {regex: /^\[(.+)\] \| ([^-]+) - ([^-]+)$/, values: ['genre', 'artist', 'title']},
    'ThePrimeThanatos|alt': {regex: /^([^-]+) - ([^-]+)$/, values: ['artist', 'title']},
    'Diversity': {regex: /^([^-]+) - ([^-]+)$/, values: ['artist', 'title']},
    'audiomachine': {regex: /^(audiomachine) - ([^-]+)$/, values: ['artist', 'title']},
    'ThePrimeCronus II': {regex: /^([^-]+) - ([^-]+) \/\/ (.+)$/, values: ['artist', 'title', 'genre']},
    'ThePrimeCronus II|alt': {regex: /^(?:.+) \/\/ (.+) - (.+)$/, values: ['artist', 'title']},
    'HDSounDI': {regex: /^(?:.+) "(.+)" by (.+)$/, values: ['title', 'artist']},
    'Monstercat': {regex: /^(?:\[(.+)\] - )?([^\[\]-]+) - ([^\[\]-]+)(?:\s\[Monstercat(?:.+)\])?$/, values: ['genre', 'artist', 'title'] }
};
const artist_names = JSON.parse(fs.readFileSync('./data/artists.json', 'utf8'));
const irregular_titles = JSON.parse(fs.readFileSync('./data/titles.json', 'utf8'));

function match(title, format) {
    if(!format) return null;
    let matches = title.match(format.regex);
    if (matches) {
        let obj = {};
        for(let i in format.values){
            if(!format.values.hasOwnProperty(i)) continue;
            let key = format.values[i];
            obj[key] = matches[parseInt(i)+1];
        }
        return obj;
    }
    return null;
}

function findIrregular(title) {
    if(irregular_titles[title]){
        return {
            title: irregular_titles[title][1],
            artist: irregular_titles[title][0]
        }
    }else return {}
}

exports.guess = function(title, channel) {
    if(uploader_formats[channel]){
        let matches = match(title, uploader_formats[channel]);
        if(!matches)matches = match(title, uploader_formats[channel+'|alt']);
        if(matches)return matches
    }
    return findIrregular(title);
};

exports.sanitizeArtist = function(artist) {
    return artist_names[artist] || artist;
};
