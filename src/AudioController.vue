<template>
    <div>
        <vue-audio
            :play="play"
            :position="position"
            :filename="filename"
            @loading:ready="loadingReady"
            @playback:end="playbackEnded"
            @position:update="updatePosition">
        </vue-audio>
        <i class="fa fa-play mr-2 playback-control" v-if="play" @click="play = false"></i>
        <i class="fa fa-pause mr-2 playback-control" v-if="!play" @click="play = true"></i>
        {{minutes}}:{{seconds}}
        &nbsp; | &nbsp;
        {{title}}
    </div>
</template>

<script>
    import Audio from './Audio.vue'

    export default {
        props: ['title', 'url'],
        data () {
            return {
                play: false,
                position: 0,
                observedPosition: 0,
                length: 0,
                filename: null,
                loading: false,
                minutes: '00',
                seconds: '00'
            };
        },
        mounted () {
          if(this.url){
              this.playTrack();
          }
        },
        methods: {
            loadingReady (length) {
                console.log('Track loaded');
                this.play = true;
                this.length = length;
                this.loading = false;
            },
            playbackEnded () {
                this.play = false;
            },
            playTrack () {
                this.play = false;
                this.filename = this.url;
                this.position = 0;
                this.loading = true;
                this.$emit('play');
            },
            updatePosition (position) {
                this.observedPosition = position;
                this.position = null;

                this.seconds = this.formatTime(Math.floor(this.observedPosition % 60));
                this.minutes = this.formatTime(Math.floor(this.observedPosition / 60));
            },
            formatTime (n) {
                return n > 99 ? ('0' + n).slice(-3) : ('0' + n).slice(-2);
            }
        },
        watch: {
            url (newUrl) {
                if(newUrl !== null){
                    this.playTrack();
                }
            }
        },
        components: {
            'vue-audio': Audio
        }
    };
</script>

<style scoped>
    .playback-control {
        cursor: pointer;
        font-size: 1.2em;
    }
</style>
