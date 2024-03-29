<template lang="pug">
.row(ref="playlistContainer")
    .col-md-12
        form
            input.form-control.mb-3.mt-3(v-model="searchDebounced" placeholder="Search")

    .col-md-12
        form
            .form-check
                input.form-check-input(type='checkbox', id="newest_first", v-model="newestFirst")
                label.form-check-label(for="newest_first") Newest first

    video-item(v-for="(video, index) in videosToShow" :key="video.id" :video="video" :index="index" :playing-index="playingIndex" :play-track="playTrack")
</template>

<script>
    import Video from './Video.vue'
    import fz from 'fuzzaldrin-plus';
    import _ from 'lodash'

    export default {
        props: ['videos', 'playTrack', 'playingIndex'],
        data() {
            return {
                numVideosToShow: 50,
                search: '',
                newestFirst: false
            };
        },
        computed: {
            videosToShow() {
                if (this.search) {
                    return this.searchVideos().slice(0, this.numVideosToShow);
                } else {
                    let videos = [...this.videos];
                    if(this.newestFirst) videos = videos.reverse();
                    return videos.slice(0, this.numVideosToShow);
                }
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
        mounted() {
            window.addEventListener("scroll", () => this.handleScroll())
        },
        unmounted() {
            window.removeEventListener("scroll", () => this.handleScroll())
        },
        methods: {
            handleScroll() {
                if (this.$refs.playlistContainer.getBoundingClientRect().bottom < window.innerHeight && this.numVideosToShow < this.videos.length) {
                    this.numVideosToShow += 50;
                }
            },
            searchVideos() {
                const preparedQuery = fz.prepareQuery(this.search);
                const scores = {};

                return this.videos
                    .map((video) => {
                        const scorableFields = [
                            video.id,
                            video.title,
                            video.channel,
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
            }
        },
        components: {
            'video-item': Video
        }
    };
</script>
