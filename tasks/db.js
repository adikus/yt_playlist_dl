const MigrationTask = require('migrate-orm2');
const orm = require('orm');

exports.runMigration = function (operation, grunt, done) {
    orm.settings.set("connection.debug", true);
    orm.connect(process.env.DATABASE_URL, function (err, connection) {
        if (err) throw(err);

        let migrationTask = new MigrationTask(
            connection.driver,
            { dir: 'data/migrations'}
        );
        migrationTask[operation](grunt.option('file'), done);
    });
};
