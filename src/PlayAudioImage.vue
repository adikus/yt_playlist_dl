<template>
    <div class="card-img-top-container" @click="playTrack">
        <img class="card-img-top" v-lazy="imageSrc"/>
        <div class="card-img-top-overlay">
            <div class="fa fa-play"></div>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['imageSrc', 'title', 'url'],
        methods: {
            playTrack() {
                this.$root.$emit('play', this.title, this.url);
            }
        }
    };
</script>

<style scoped lang="scss">
    .card-img-top {
        opacity: 1;
        display: block;
        width: 100%;
        height: auto;
        transition: .5s ease;
        backface-visibility: hidden;
    }

    .card-img-top-overlay {
        transition: .5s ease;
        opacity: 0;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-25%, -25%);
        -ms-transform: translate(-25%, -25%);
        text-align: center;
    }

    .card-img-top-container {
        cursor: pointer;
    }

    .card-img-top-container:hover .card-img-top {
        opacity: 0.3;
    }

    .card-img-top-container:hover .card-img-top-overlay {
        opacity: 1;
    }

    .card-img-top-overlay div {
        color: #3e3e3e;
        font-size: 32px;
    }
</style>
