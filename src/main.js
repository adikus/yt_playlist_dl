import Vue from 'vue';
import VueSocketIO from 'vue-socket.io';
import 'bootstrap';

import './metadata'
import './export'

import VueLazyload from 'vue-lazyload'
import infiniteScroll from 'vue-infinite-scroll'

import AudioController from './AudioController.vue'
import VideoList from './VideoList.vue'

Vue.use(new VueSocketIO({debug: true}));
Vue.use(VueLazyload);
Vue.use(infiniteScroll);

window.app = new Vue({
    el: '#page-container',
    data: {
        title: null,
        url: null,
        imports: window.vueData || {}
    },
    sockets:{
        connect() {
            console.log('Connected to socket.io');
            this.connected = true;
        }
    },
    components: {
        'audio-controller': AudioController,
        'video-list': VideoList
    },
    created () {
        this.$root.$on('play', this.playTrack);
    },
    methods: {
        playTrack(title, url) {
            this.title = title;
            this.url = url;
        }
    }
});
