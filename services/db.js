const orm_timestamps = require('orm-timestamps');

exports.define = function(db, models, app) {
    db.defineType('json', {
        datastoreType: function(prop) {
            return 'TEXT'
        },
        valueToProperty: function(value, prop) {
            return typeof value == 'string' ? JSON.parse(value || '{}') : value;
        },
        propertyToValue: function(value, prop) {
            return JSON.stringify(value)
        }
    });

    db.use(orm_timestamps, {
        createdProperty: 'created_at',
        modifiedProperty: 'updated_at',
        dbtype: { type: 'date', time: true }
    });

    models.user = require('./../models/user').define(db, app);
    models.video = require('./../models/video').define(db, app);
    models.playlist = require('./../models/playlist').define(db, app);
    models.yt_session = require('./../models/yt_session').define(db, app);
};

