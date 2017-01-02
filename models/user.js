const bcrypt = require('bcrypt');

exports.define = function(db) {
    return db.define("users", {
        id: Number,
        username: { type : "text" },
        password: { type : "text" }
    }, {
        id: 'id',
        timestamp: false,
        methods: {
            validatePassword: function(password, callback) {
                bcrypt.compare(password, this.password, function(err, res) {
                    callback(!err && res);
                });
            }
        }
    });
};
