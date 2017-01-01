exports.up = function(next){
    this.addColumn('videos', {position: {type: 'integer'}}, next);
};

exports.down = function(next){
    this.dropColumn('videos', 'position', next);
};
