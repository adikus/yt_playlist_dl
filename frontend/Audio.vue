<template>
    <audio crossorigin="anonymous"></audio>
</template>

<script>
    export default {
        props: ['play', 'position', 'filename', 'volume'],
        mounted () {
            window.audioTag = this.tag = this.$el;

            this.tag.addEventListener("error", function(e) {
                console.log('Error when loading track', e);
            });

            this.tag.onended = () => this.$emit('playback:end');
            this.tag.oncanplay = () => this.$emit('loading:ready', this.tag.duration);
            this.tag.ontimeupdate = () => {
                this.$emit('position:update', this.tag.currentTime);
                localStorage.setItem('audio.position', this.tag.currentTime);
            }

            // this.context = new AudioContext();
            // this.sourceNode = this.context.createMediaElementSource(this.tag);
            // this.sourceNode.connect(this.context.destination);

            if (localStorage.getItem('audio.position')) {
                setTimeout(() => {
                    this.tag.currentTime = parseFloat(localStorage.getItem('audio.position')) || 0;
                }, 50);
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
                if(newPosition !== null) {
                    this.tag.currentTime = parseFloat(newPosition) || 0;
                }
            },
            play (shouldPlay) {
                if(shouldPlay){
                    this.tag.play().catch(err => {
                        console.error(err);
                        this.$emit('playback:failed');
                    });
                }else{
                    this.tag.pause();
                }
            },
            volume (volume) {
                this.tag.volume = volume / 100.0;
            }
        }
    };
</script>
