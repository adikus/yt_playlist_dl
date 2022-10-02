const bcrypt = require('bcrypt');
const crypto = require("crypto");

exports.define = function(db) {
    return db.define("users", {
        id: Number,
        username: { type : "text" },
        password: { type : "text" },
        api_key: { type : "text" },
        remember_token: { type : "text" },
        remember_created_at: { type : "date", time: true }
    }, {
        id: 'id',
        timestamp: false,
        methods: {
            async validatePassword (password) {
                return await bcrypt.compare(password, this.password);
            },
            validRememberToken() {
                if (!this.remember_created_at) return false;

                let now = new Date();
                let difference = now - this.remember_created_at;

                return difference < 1000 * 3600 * 24 * 30;
            },
            async issueToken() {
                if (this.remember_token && this.validRememberToken()) {
                    return this.remember_token;
                } else {
                    const token = crypto.randomBytes(32).toString('hex');

                    this.remember_token = token;
                    this.remember_created_at = new Date();
                    await this.saveAsync();

                    return token;
                }
            }
        }
    });
};
