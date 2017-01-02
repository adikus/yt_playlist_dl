exports.up = function (next) {
    this.addColumn('users', {api_key: {type: 'text'}}, next);
};

exports.down = function (next){
    this.dropColumn('users', 'api_key', next);
};
