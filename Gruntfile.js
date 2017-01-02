module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json')
    });

    grunt.registerTask('migrate:generate', '', function () {
        let done = this.async();
        require('./tasks/db').runMigration('generate', grunt, done);
    });

    grunt.registerTask('migrate:up', '', function () {
        let done = this.async();
        require('./tasks/db').runMigration('up', grunt, done);
    });

    grunt.registerTask('migrate:down', '', function () {
        let done = this.async();
        require('./tasks/db').runMigration('down', grunt, done);
    });
};
