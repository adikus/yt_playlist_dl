<template lang="pug">
    .row(
        v-infinite-scroll="showMore"
        infinite-scroll-disabled="cannotShowMore"
        infinite-scroll-distance=500
    )
        video-item(v-for="(video, index) in videosToShow" :key="video.id" :video="video" :index="index")
</template>

<script>
    import Video from './Video.vue'

    export default {
        props: ['videos'],
        data() {
            return {
                numVideosToShow: 50
            };
        },
        computed: {
            videosToShow() {
                return this.videos.slice(0, this.numVideosToShow);
            },
            cannotShowMore() {
                return this.numVideosToShow >= this.videos.length;
            }
        },
        methods: {
            showMore() {
                this.numVideosToShow += 50;
            }
        },
        components: {
            'video-item': Video
        }
    };
</script>
