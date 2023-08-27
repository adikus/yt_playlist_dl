import $ from 'jquery'
import { createApp } from 'vue';
import './css/main.scss'

import './metadata'
import './export'

import VueLazyload from 'vue3-lazyload'

import AudioController from './AudioController.vue'
import Playlists from './Playlists.vue'
import VideoList from './VideoList.vue'
import Queue from './Queue.vue'
import SelectedItem from "./SelectedItem.vue";

const app = createApp({
    data() {
        return {
            sidebarOpen: false,
            title: null,
            url: null,
            position: 0,
            duration: 0,
            playingIndex: null,
            imports: window.vueData || {},
            playing: false,
            playingVideo: null,
            selectedPlaylist: null,
            selectedVideo: null,
            explicitQueue: [],
            selectedImplicitQueue: [],
            implicitQueue: [],
        }
    },
    components: {
        AudioController,
        Playlists,
        VideoList,
        Queue,
        SelectedItem
    },
    methods: {
        openSidebar() {
            this.sidebarOpen = true;
        },
        closeSidebar() {
            this.sidebarOpen = false
        },
        playVideo(video, position=0) {
            if (this.playingVideo?.id === video.id) {
                this.playing = !this.playing;
                localStorage.setItem('audio.playing', this.playing);

                return;
            }

            this.updateMediaSession(video);

            this.selectedVideo = video;
            this.playingVideo = video;
            localStorage.setItem('audio.currentVideo', JSON.stringify(this.playingVideo));

            this.playing = true;
            localStorage.setItem('audio.playing', this.playing);

            if (this.selectedImplicitQueue.length) {
                this.implicitQueue = this.selectedImplicitQueue
                localStorage.setItem('audio.implicitQueue', JSON.stringify(this.implicitQueue));
            }

            this.position = position;
        },
        playTrack(title, url, index, position=0) {
            this.playingVideo = { title, url };
            localStorage.setItem('audio.currentVideo', JSON.stringify(this.playingVideo));

            this.playing = true;
            localStorage.setItem('audio.playing', this.playing);

            this.position = position;

            this.playingIndex = index;
            localStorage.setItem('audio.index', index);
        },
        playbackEnded() {
            this.playing = false;
            localStorage.setItem('audio.playing', this.playing);
            this.playNext();
        },
        playPrevious() {
            if (this.position > 3) {
                this.position = 0
                return
            }

            if(this.explicitQueue.length) {
                this.playPreviousFrom(this.explicitQueue)
            } else if(this.implicitQueue.length) {
                this.playPreviousFrom(this.implicitQueue)
            }
        },
        playNext() {
            if(this.explicitQueue.length) {
                this.playNextFrom(this.explicitQueue)
            } else if(this.implicitQueue.length) {
                this.playNextFrom(this.implicitQueue)
            } else if (this.playingIndex) {
                this.playingIndex = parseInt(this.playingIndex) + 1;
            }
        },
        playPreviousFrom(queue) {
            const index = queue.findIndex((video) => video.id === this.playingVideo.id)
            if (index > 0) {
                this.playVideo(queue[index - 1])
            } else if (index === -1) {
                this.playVideo(queue.at(-1))
            }
        },
        playNextFrom(queue) {
            const index = queue.findIndex((video) => video.id === this.playingVideo.id)
            if (index < queue.length - 1) {
                this.playVideo(queue[index + 1])
            }
        },
        updatePlaying(playing) {
            this.playing = playing;
            localStorage.setItem('audio.playing', this.playing);
        },
        selectVideo(video, implicitQueue) {
            this.selectedImplicitQueue = implicitQueue;
            this.selectedVideo = video;
            this.openSidebar();
        },
        selectPlaylist(playlist) {
            this.selectedPlaylist = playlist;
            this.selectedVideo = null;
        },
        updateMediaSession(video) {
            if (!('mediaSession' in navigator)) return;

            navigator.mediaSession.metadata = new MediaMetadata({
                title: video.title,
                artist: video.channel,
                artwork: Object.entries(video?.metadata?.thumbnails ?? {}).map(([_, t]) => ({ src: t.url, sizes: `${t.width}x${t.height}` }))
            })
            navigator.mediaSession.setActionHandler('play', () => this.playing = true);
            navigator.mediaSession.setActionHandler('pause', () => this.playing = false);
            navigator.mediaSession.setActionHandler('seekto', (details) => this.position = details.seekTime);
            navigator.mediaSession.setActionHandler('seekbackward', (details) => this.position -= details.seekOffset);
            navigator.mediaSession.setActionHandler('seekforward', (details) => this.position += details.seekOffset);
            navigator.mediaSession.setActionHandler('previoustrack', () => this.playPrevious());
            navigator.mediaSession.setActionHandler('nexttrack', () => this.playNext());
        },
        enqueue(...videos) {
            videos.forEach((video) => {
                if (!this.explicitQueue.some((v) => v.id === video.id)) this.explicitQueue.push(video)
            })
            localStorage.setItem('audio.explicitQueue', JSON.stringify(this.explicitQueue));
        },
        updateQueue(queue) {
            this.explicitQueue = [...queue]
            localStorage.setItem('audio.explicitQueue', JSON.stringify(this.explicitQueue));
        },
    },
    computed: {
        videoUrl() {
            return this.playingVideo?.url || this.playingVideo.mp3Upload?.url || this.playingVideo.originalUpload?.url || 'https://audio.adikus.me/yt/' + this.playingVideo.id
        }
    },
    mounted() {
        const serializedVideo = localStorage.getItem('audio.currentVideo')
        try {
            this.playingVideo = JSON.parse(serializedVideo)
            this.selectedVideo = this.playingVideo;
            this.openSidebar();
            this.updateMediaSession(this.playingVideo);
        } catch (e) {
            console.error(e)
        }

        if (localStorage.getItem('audio.explicitQueue')) {
            this.explicitQueue = JSON.parse(localStorage.getItem('audio.explicitQueue'))
        }

        if (localStorage.getItem('audio.implicitQueue')) {
            this.implicitQueue = JSON.parse(localStorage.getItem('audio.implicitQueue'))
        }

        if (localStorage.getItem('audio.position')) {
            setTimeout(() => this.position = parseFloat(localStorage.getItem('audio.position')) || 0, 50)
        }

        if (localStorage.getItem('audio.playing')) {
            const openTabs = JSON.parse(localStorage.getItem('audio.tabs') || '{}')
            if (Object.keys(openTabs).length <= 1) this.playing = localStorage.getItem('audio.playing') === "true";
        }

        // #MARK LEGACY, remove with rest of v1
        if (localStorage.getItem('audio.index')) {
            this.playingIndex = localStorage.getItem('audio.index');
        }
    },
    watch: {
        position(position) {
            localStorage.setItem('audio.position', position);
            if (this.duration > position && navigator?.mediaSession?.setPositionState) {
                navigator.mediaSession.setPositionState({ duration: this.duration || 0, playbackRate: 1, position: position || 0 });
            }
        },
        duration(duration) {
            if (navigator?.mediaSession?.setPositionState) {
                navigator.mediaSession.setPositionState({ duration: duration || 0, playbackRate: 1, position: this.position || 0 });
            }
        }
    }
});

const setUpTabs = () => {
    const hash = Array(8).fill(0).map(_ => Math.random().toString(36).charAt(2)).join('');
    sessionStorage.setItem('audio.tabHash', hash);
    const tabs = JSON.parse(localStorage.getItem('audio.tabs') || '{}');

    Object.entries(tabs).forEach(([key, time]) => {
        if (Date.parse(time) < new Date().getTime() - 1000 * 60 * 60 * 24) delete tabs[key];
    });

    tabs[hash] = new Date();
    localStorage.setItem('audio.tabs', JSON.stringify(tabs));
};

setUpTabs();

window.addEventListener("beforeunload", (_event) => {
    const hash = sessionStorage.getItem('audio.tabHash');
    const tabs = JSON.parse(localStorage.getItem('audio.tabs') || '{}');
    delete tabs[hash];
    localStorage.setItem('audio.tabs', JSON.stringify(tabs));
});

app.use(VueLazyload);
app.mount('#page-container');

window.app = app;
window.jQuery = window.$ = $;
