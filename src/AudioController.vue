<template>
    <div>
        <vue-audio
            :play="play"
            :position="position"
            :filename="filename"
            @loading:ready="loadingReady"
            @playback:end="playbackEnded"
            @playback:failed="playbackFailed"
            @position:update="updatePosition">
        </vue-audio>
        <vue-slider
            class="slider"
            ref="slider"
            v-model="observedPosition"
            :max="duration"
            :interval="0.1"
            :tooltip="false"
            @callback="setPosition"
            @drag-start="draggingSlider=true"
            @drag-end="draggingSlider=false; setPosition($event.val)"
        ></vue-slider>
        <i class="fa fa-play mr-2 playback-control" v-if="play" @click="setPause"></i>
        <i class="fa fa-pause mr-2 playback-control" v-if="!play" @click="setPlay"></i>
        {{minutes}}:{{seconds}}
        &nbsp; | &nbsp;
        {{title}}
    </div>
</template>

<script>
    import Audio from './Audio.vue'
    import vueSlider from 'vue-slider-component'

    export default {
        props: ['title', 'url'],
        data () {
            return {
                play: false,
                position: 0,
                observedPosition: 0,
                draggingSlider: false,
                duration: 0,
                filename: null,
                loading: false,
                minutes: '00',
                seconds: '00',
                playFailed: false
            };
        },
        mounted () {
            window.slider = this.$refs.slider;
            if(this.url){
              this.playTrack();
            }
        },
        methods: {
            loadingReady (duration) {
                console.log('Track loaded');
                this.play = true;
                this.duration = duration;
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
            setPosition (position) {
                if(this.draggingSlider){
                    this.setObservedPosition(position);
                } else {
                    this.position = position;
                }
            },
            updatePosition (position) {
                if(!this.draggingSlider) {
                   this.setObservedPosition(position);
                }
                this.position = null;
            },
            setObservedPosition (position) {
                this.observedPosition = position;

                this.seconds = this.formatTime(Math.floor(this.observedPosition % 60));
                this.minutes = this.formatTime(Math.floor(this.observedPosition / 60));
            },
            formatTime (n) {
                return n > 99 ? ('0' + n).slice(-3) : ('0' + n).slice(-2);
            },
            setPlay () {
                if(this.playFailed){
                    // Workaround for mobile requiring the play() to be initiated  by gesture
                    // TODO: autodetect mobile?
                    window.audioTag.play();
                    this.playFailed = false;
                }
                this.play = true;
            },
            setPause () {
                this.play = false;
            },
            playbackFailed () {
                this.playFailed = true;
                this.play = false;
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
            'vue-audio': Audio,
            vueSlider
        }
    };
</script>

<style scoped lang="scss">
    .playback-control {
        cursor: pointer;
        font-size: 1.2em;
    }

    .slider {
        position: absolute;
        top: -8px;
        width: 100% !important;
        margin-left: -15px;
    }
</style>
