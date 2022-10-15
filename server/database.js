const orm = require('orm');
const orm_timestamps = require('orm-timestamps');

function defineTypes(db) {
    db.defineType('json', {
        datastoreType: (_prop) => {
            return 'TEXT'
        },
        valueToProperty: (value, _prop) => {
            return typeof value === 'string' ? JSON.parse(value || '{}') : value;
        },
        propertyToValue: (value, _prop) => {
            return JSON.stringify(value)
        }
    });
}

function defineModels(db, models, app) {
    models.user = require('./models/user').define(db, app);
    models.video = require('./models/video').define(db, app);
    models.playlist = require('./models/playlist').define(db, app);
    models.yt_session = require('./models/yt_session').define(db, app);
    models.playlist_video = require('./models/playlist_video').define(db, app);
    models.upload = require('./models/upload').define(db, app);
    models.custom_video_upload = require('./models/custom_video_upload').define(db, app);

    models.playlist_video.hasOne('video', models.video, {reverse: 'playlistVideos'});
}

function define(app, db, models, next) {
    app.models = models;
    defineTypes(db);

    db.use(orm_timestamps, {
        createdProperty: 'created_at',
        modifiedProperty: 'updated_at',
        dbtype: { type: 'date', time: true }
    });

    defineModels(db, models, app);

    if (next) next();
}

module.exports = {
    setupOrm(app) {
        app.use(orm.express(process.env.DATABASE_URL, { define: (db, models, next) => define(app, db, models, next) }));
    },

    define: define
}