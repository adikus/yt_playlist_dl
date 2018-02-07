import Vue from 'vue';
import io from 'socket.io-client'
import VueSocketio from 'vue-socket.io';
import 'bootstrap';

import './metadata'
import './export'

Vue.use(VueSocketio, io());

window.app = new Vue({
    el: '#main-container',
    sockets:{
        connect() {
            console.log('Connected to socket.io');
            this.connected = true;
        }
    },
    components: {
    }
});
