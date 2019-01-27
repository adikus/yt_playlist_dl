module.exports = shipit => {
    require('shipit-deploy')(shipit);

    shipit.initConfig({
        default: {
            deployTo: '/home/andrej/yt_playlist_dl',
            repositoryUrl: 'git@github.com:adikus/yt_playlist_dl.git',
        },
        production: {
            servers: 'andrej@audio.adikus.me',
        },
    });

    shipit.blTask('build', async () => {
        await shipit.remote(`bash -cl "cd ${shipit.releasePath}; npm ci --dev"`);
        await shipit.remote(`bash -cl "cd ${shipit.releasePath}; npm run build"`);
    });

    shipit.blTask('copy_config', async () => {
        await shipit.remote(`cd ${shipit.releasePath}; ln -s ../../config/.env .env`);
    });

    shipit.on('updated', async () => {
        await shipit.start('build');
    })
};
