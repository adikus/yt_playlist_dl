<template>
    <audio crossorigin="anonymous"></audio>
</template>

<script>
    export default {
        props: ['play', 'position', 'filename'],
        mounted () {
            window.audioTag = this.tag = this.$el;

            this.tag.addEventListener("error", function(e) {
                console.log('Error when loading track', e);
            });

            this.tag.onended = () => this.$emit('playback:end');
            this.tag.oncanplay = () => this.$emit('loading:ready', this.tag.duration);
            this.tag.ontimeupdate = () => this.$emit('position:update', this.tag.currentTime);

            this.context = new AudioContext();
            this.sourceNode = this.context.createMediaElementSource(this.tag);

            this.sourceNode.connect(this.context.destination);
        },
        watch: {
            filename (newFilename) {
                if(newFilename){
                    this.tag.src = newFilename;
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
            }
        }
    };
</script>
