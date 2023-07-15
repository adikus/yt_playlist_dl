import $ from 'jquery'
import { createApp } from 'vue';
import './css/main.scss'

import './metadata'
import './export'

import VueLazyload from 'vue3-lazyload'

import AudioController from './AudioController.vue'
import Playlists from './Playlists.vue'
import VideoList from './VideoList.vue'
import QueueController from './QueueController.vue'
import SelectedItem from "./SelectedItem.vue";

const app = createApp({
    data() {
        return {
            title: null,
            url: null,
            playingIndex: null,
            imports: window.vueData || {},
            playing: false,
            selectedPlaylist: null,
            selectedVideo: null
        }
    },
    components: {
        AudioController,
        Playlists,
        VideoList,
        QueueController,
        SelectedItem
    },
    methods: {
        playVideo(video) {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: video.title,
                    artist: video.metadata.channelTitle,
                    artwork: Object.entries(video.metadata.thumbnails).map(([_, t]) => ({ src: t.url, sizes: `${t.width}x${t.height}` }))
                })
                navigator.mediaSession.setActionHandler('play', () => this.$refs.audioController.setPlay());
                navigator.mediaSession.setActionHandler('pause', () => this.$refs.audioController.setPause());
            }

            if (this.title === video.title && this.url) {
                if (this.playing) this.$refs.audioController.setPause()
                else this.$refs.audioController.setPlay()

                return;
            }

            this.title = video.title;
            this.url = video.mp3Upload?.url || video.originalUpload?.url || 'https://audio.adikus.me/yt/' + video.id;

            localStorage.setItem('audio.title', this.title);
            localStorage.setItem('audio.url', this.url);
        },
        playTrack(title, url, index) {
            this.title = title;
            this.url = url;
            this.playingIndex = index;

            localStorage.setItem('audio.title', title);
            localStorage.setItem('audio.url', url);
            localStorage.setItem('audio.index', index);
        },
        playbackEnded() {
            this.playingIndex = parseInt(this.playingIndex) + 1;
        },
        playbackChangedState(newState) {
            this.playing = newState.playing;
        },
        selectVideo(video) {
            this.selectedVideo = video;
        },
        selectPlaylist(playlist) {
            this.selectedPlaylist = playlist;
            this.selectedVideo = null;
        }
    },
    mounted() {
        if (localStorage.getItem('audio.url')) {
            this.url = localStorage.getItem('audio.url');
        }
        if (localStorage.getItem('audio.title')) {
            this.title = localStorage.getItem('audio.title');
        }
        if (localStorage.getItem('audio.index')) {
            this.playingIndex = localStorage.getItem('audio.index');
        }
    },
});

app.use(VueLazyload);
app.mount('#page-container');

window.app = app;
window.jQuery = window.$ = $;
