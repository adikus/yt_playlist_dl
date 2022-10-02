module.exports = {
    moveFilePromise(file, path) {
        return new Promise((resolve, reject) => {
            file.mv(path, function(err) {
                if (err) reject(err);
                resolve();
            });
        });
    }
};
