exports.up = async function () {
    await this.addColumn('videos', {channel: {type: 'text'}});

    // Run manually
    // ALTER TABLE videos ADD COLUMN channel text;
    // ALTER TABLE videos ADD COLUMN tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ',' || channel)) STORED;
    // ALTER TABLE playlist_videos ADD COLUMN tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ',' || artist || ',' || genre)) STORED;
    //
    // UPDATE videos SET channel = metadata::json->>'channelTitle';
};

exports.down = async function (){
    await this.dropColumn('videos', {channel: {type: 'text'}});
};
