exports.up = function (next) {
    this.createTable('users', {
        id     : { type : "serial", key: true },
        username: { type : "text", required: true },
        password: { type : "text", required: true }
    }, next);
};

exports.down = function (next){
    this.dropTable('users', next);
};
