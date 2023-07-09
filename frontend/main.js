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
            selectedItem: null,
            selectedItemType: null
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
            console.log(newState)
            this.playing = newState.playing;
        },
        selectItem(item) {
            if (item.playlist) {
                this.selectedItem = item.playlist;
                this.selectedItemType = 'playlist';
            } else if (item.video) {
                this.selectedItem = item.video;
                this.selectedItemType = 'video';
            }
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
