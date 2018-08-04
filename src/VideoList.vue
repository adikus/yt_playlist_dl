<template lang="pug">
    .row
        video-item(v-for="(video, index) in videos" :key="video.id" :video="video" :index="index")
</template>

<script>
    import Video from './Video.vue'

    export default {
        props: ['videos'],
        methods: {},
        components: {
            'video-item': Video
        }
    };
</script>
