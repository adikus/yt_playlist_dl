<template>
    <div>
        <vue-audio
            :play="!loading && playing"
            :filename="filename"
            :volume="volume"
            :position="position"
            @update:position="updatePosition($event)"
            @loading:ready="loadingReady"
            @playback:end="playbackEnded"
            @playback:failed="playbackFailed">
        </vue-audio>
        <vue-slider
            class="time-slider"
            ref="slider"
            role="button"
            v-model="observedPosition"
            :max="duration"
            :interval="0.1"
            :tooltip="'none'"
            @callback="setPosition"
            @change="setPosition($event)"
            @drag-start="draggingSlider=true"
            @drag-end="draggingSlider=false; setPosition()"
        ></vue-slider>
        <i class="fa fa-step-backward mr-2 playback-control" @click="$emit('playPrevious')"></i>
        <i class="fa fa-play mr-2 playback-control" v-if="!playing" @click="setPlay"></i>
        <i class="fa fa-pause mr-2 playback-control" v-if="playing" @click="setPause"></i>
        <i class="fa fa-step-forward mr-2 playback-control" @click="$emit('playNext')"></i>
        {{minutes}}:{{seconds}}
        &nbsp; | &nbsp;
        {{title}}
        <div class="volume">
            <i class="fa fa-volume-off mr-2" v-if="volume === 0" @click="toggleMute()"></i>
            <i class="fa fa-volume-down mr-2" v-if="volume > 0 && volume <= 50" @click="toggleMute()"></i>
            <i class="fa fa-volume-up mr-2" v-if="volume > 50" @click="toggleMute()"></i>
            <vue-slider class="volume-slider" v-model="volume" :max="100" :interval="1" :tooltip="'none'"></vue-slider>
        </div>
    </div>
</template>

<script>
    import Audio from './Audio.vue'
    import vueSlider from 'vue-slider-component'
    import 'vue-slider-component/theme/default.css'

    export default {
        props: ['title', 'url', 'playing', 'position'],
        emits: ['update:duration', 'update:position', 'update:playing', 'playback:end', 'playPrevious', 'playNext'],
        data () {
            return {
                observedPosition: 0,
                volume: 100,
                backupVolume: 100,
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
            if (localStorage.getItem('volume')) {
                this.volume = localStorage.getItem('volume');
            }
            if(this.url){
              this.prepareTrack();
            }
        },
        methods: {
            loadingReady(duration) {
                console.log('Track loaded');
                this.duration = Math.round(duration * 10) / 10;
                this.loading = false;
                this.$emit('update:duration', this.duration)
            },
            playbackEnded() {
                this.$emit('playback:end')
            },
            playTrack() {
                this.filename = this.url;
                this.loading = true;
            },
            prepareTrack() {
                this.filename = this.url;
                this.loading = true;
            },
            setPosition(position) {
                if(!this.draggingSlider) {
                    if(position === undefined){
                        this.$emit('update:position', this.observedPosition);
                    } else {
                        this.$emit('update:position', position);
                    }
                } else {
                    this.setObservedPosition(position);
                }
            },
            updatePosition(position) {
                this.$emit('update:position', position);

                if(!this.draggingSlider && position !== null) {
                    this.setObservedPosition(position);
                }
            },
            setObservedPosition(position) {
                this.observedPosition = position;

                this.seconds = this.formatTime(Math.floor(this.observedPosition % 60));
                this.minutes = this.formatTime(Math.floor(this.observedPosition / 60));
            },
            formatTime(n) {
                return n > 99 ? ('0' + n).slice(-3) : ('0' + n).slice(-2);
            },
            setPlay() {
                if(this.playFailed){
                    // Workaround for mobile requiring the play() to be initiated  by gesture
                    // TODO: autodetect mobile?
                    window.audioTag.play();
                    this.playFailed = false;
                }
                this.$emit('update:playing', true);
            },
            setPause() {
                this.$emit('update:playing', false);
            },
            playbackFailed() {
                this.playFailed = true;
                this.$emit('update:playing', false);
            },
            toggleMute() {
                if (this.volume === 0) {
                    this.volume = this.backupVolume;
                } else {
                    this.backupVolume = this.volume;
                    this.volume = 0;
                }
            }
        },
        watch: {
            url(newUrl) {
                if(newUrl !== null){
                    this.playTrack();
                }
            },
            volume(volume) {
                localStorage.setItem('volume', volume);
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

    .time-slider {
        position: absolute;
        top: -8px;
        width: 100% !important;
        margin-left: -15px;
    }

    .volume {
        float: right;
        margin-right: 20px;
    }

    .volume .fa {
        width: 20px;
    }

    .volume-slider {
        display: inline-block;
        width: 150px !important;
        vertical-align: sub;
    }
</style>
