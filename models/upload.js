exports.define = function(db) {
    return db.define("uploads", {
        id        : Number,
        file_type : String,
        file      : String
    }, {
        timestamp: false
    });
};
