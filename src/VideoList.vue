<template lang="pug">
    .row(
        v-infinite-scroll="showMore"
        infinite-scroll-disabled="cannotShowMore"
        infinite-scroll-distance=500
    )
        .col-md-12
            form
                input.form-control.mb-3.mt-3(v-model="searchDebounced" placeholder="Search")

        .col-md-12
            form
                .form-check
                    input.form-check-input(type='checkbox', id="newest_first", v-model="newestFirst")
                    label.form-check-label(for="newest_first") Newest first

        video-item(v-for="(video, index) in videosToShow" :key="video.id" :video="video" :index="index")
</template>

<script>
    import Video from './Video.vue'
    import fz from 'fuzzaldrin-plus';
    import _ from 'lodash'

    export default {
        props: ['videos'],
        data() {
            return {
                numVideosToShow: 50,
                search: '',
                newestFirst: false
            };
        },
        computed: {
            videosToShow() {
                let videos = this.search ? this.searchVideos() : [...this.videos];
                if(this.newestFirst){
                    videos = videos.reverse();
                }
                return videos.slice(0, this.numVideosToShow);
            },
            cannotShowMore() {
                return this.numVideosToShow >= this.videos.length;
            },
            searchDebounced: {
                get() {
                    return this.search;
                },
                set: _.debounce(function(newValue) {
                    this.search = newValue;
                }, 250)
            }
        },
        methods: {
            searchVideos() {
                const preparedQuery = fz.prepareQuery(this.search);
                const scores = {};

                return this.videos
                    .map((video) => {
                        const scorableFields = [
                            video.id,
                            video.title,
                            video.metadata.channelTitle,
                            video.metadata.title,
                            video.metadata.artist,
                            video.metadata.genre,
                            video.playlistVideo.title,
                            video.playlistVideo.artist,
                            video.playlistVideo.genre
                        ].map(toScore => fz.score(toScore, this.search, { preparedQuery }));

                        scores[video.id] = Math.max(...scorableFields);

                        return video;
                    })
                    .filter(video => scores[video.id] > 0.5)
                    .sort((a, b) => scores[b.id] - scores[a.id]);
            },
            showMore() {
                this.numVideosToShow += 50;
            }
        },
        components: {
            'video-item': Video
        }
    };
</script>
