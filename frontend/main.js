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
            console.log(title);
            this.title = title;
            this.url = url;
        }
    }
});

app.use(VueLazyload);
app.mount('#page-container');

window.app = app;
window.jQuery = window.$ = $;
