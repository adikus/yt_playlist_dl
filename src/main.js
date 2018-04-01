import Vue from 'vue';
import io from 'socket.io-client'
import VueSocketio from 'vue-socket.io';
import 'bootstrap';

import './metadata'
import './export'

import VueLazyload from 'vue-lazyload'

import PlayAudioImage from './PlayAudioImage.vue'
import AudioController from './AudioController.vue'

Vue.use(VueSocketio, io());
Vue.use(VueLazyload);

window.app = new Vue({
    el: '#page-container',
    data: {
        title: null,
        url: null
    },
    sockets:{
        connect() {
            console.log('Connected to socket.io');
            this.connected = true;
        }
    },
    components: {
        'play-audio-image': PlayAudioImage,
        'audio-controller': AudioController
    },
    mounted () {},
    methods: {
        playTrack(title, url) {
            this.title = title;
            this.url = url;
        }
    }
});
