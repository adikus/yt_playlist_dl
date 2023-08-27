<template>
    <audio crossorigin="anonymous"></audio>
</template>

<script>
    export default {
        props: ['play', 'position', 'filename', 'volume'],
        data() {
            return {
                localPosition: null
            }
        },
        mounted () {
            window.audioTag = this.tag = this.$el;

            this.tag.addEventListener("error", function(e) {
                console.log('Error when loading track', e);
            });

            this.tag.onended = () => this.$emit('playback:end');
            this.tag.oncanplay = () => this.$emit('loading:ready', this.tag.duration);
            this.tag.ontimeupdate = () => {
                this.localPosition = this.tag.currentTime
                this.$emit('update:position', this.localPosition);
            }
        },
        watch: {
            filename (newFilename) {
                if(newFilename){
                    this.tag.src = newFilename;
                    this.tag.load();
                }
            },
            position (newPosition) {
                if(newPosition !== null && newPosition !== this.localPosition) {
                    this.localPosition = newPosition;
                    this.tag.currentTime = this.localPosition
                }
            },
            play(shouldPlay) {
                if(shouldPlay){
                    this.tag.play().catch(err => {
                        console.error(err);
                        this.$emit('playback:failed');
                    });
                }else{
                    this.tag.pause();
                }
            },
            volume(volume) {
                this.tag.volume = volume / 100.0;
            }
        }
    };
</script>
