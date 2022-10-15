import $ from 'jquery'
import { createApp } from 'vue';
import './css/main.scss'

import './metadata'
import './export'

import VueLazyload from 'vue3-lazyload'

import AudioController from './AudioController.vue'
import VideoList from './VideoList.vue'

const app = createApp({
    data() {
        return {
            title: null,
            url: null,
            imports: window.vueData || {}
        }
    },
    components: {
        AudioController,
        VideoList
    },
    methods: {
        playTrack(title, url) {
            this.title = title;
            this.url = url;

            localStorage.setItem('audio.title', title);
            localStorage.setItem('audio.url', url);
        }
    },
    mounted() {
        if (localStorage.getItem('audio.url')) {
            this.url = localStorage.getItem('audio.url');
        }
        if (localStorage.getItem('audio.title')) {
            this.title = localStorage.getItem('audio.title');
        }
    },
});

app.use(VueLazyload);
app.mount('#page-container');

window.app = app;
window.jQuery = window.$ = $;
