module.exports = shipit => {
    require('shipit-deploy')(shipit);

    shipit.initConfig({
        default: {
            deployTo: '/home/andrej/yt_playlist_dl',
            repositoryUrl: 'git@github.com:adikus/yt_playlist_dl.git',
            branch: 'ah/vite'
        },
        production: {
            servers: 'andrej@audio.adikus.me',
        },
    });

    shipit.config.copy = false;

    shipit.blTask('build', async () => {
        await shipit.remote(`bash -cl "cd ${shipit.releasePath}; docker compose -p yt-playlist-dl build"`);
    });

    shipit.blTask('copy_config', async () => {
        await shipit.remote(`cd ${shipit.releasePath}; rm .env; ln -s ../../config/.env .env`);
    });

    shipit.blTask('copy_data', async () => {
        await shipit.remote(`cd ${shipit.releasePath}/data; rm ./*.json; ln -s ../../../config/data/* ./`);
    });

    shipit.blTask('restart_docker', async () => {
        await shipit.remote(`cd ${shipit.releasePath}; docker compose -p yt-playlist-dl up -d`);
    });

    shipit.on('updated', async () => {
        await shipit.start('build');
        await shipit.start('copy_config');
        await shipit.start('copy_data');
    });

    shipit.on('published', async () => {
        await shipit.start('restart_docker');
    })
};
