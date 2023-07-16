<template lang="pug">
.row
    .col.d-flex.flex-row.justify-content-between
        input.form-control.flex-grow-1.w-auto.mr-2(type="text", placeholder="Search")
        a.btn.btn-primary(href='#', @click.prevent="refresh")
            spinner.mr-1(size="16", v-if="refreshing")
            span.fa.fa-refresh.mr-1(v-else)
            | Refresh playlists
.row
    .col
        .border-bottom.py-2(v-for="playlist in playlists")
            .d-flex.flex-wrap
                img.thumbnail.mr-2(v-lazy="playlistImage(playlist)", role="button", @click.prevent="selectPlaylist(playlist)")
                div
                    h2(role="button", @click.prevent="selectPlaylist(playlist)")
                        u(v-if="isSelected(playlist)") {{playlist.title}}
                        template(v-else) {{playlist.title}}
                    .text-muted
                        | {{playlist.status}} | {{playlist.created_at}}
                        spinner(size="18", fill="#212529", v-if="playlist.loading")

            div.mt-2
                .d-flex.flex-row.flex-wrap
                    div.d-flex.flex-row.border.rounded.p-1.m-1(v-for="video in playlist.shownVideos", role="button", @click.prevent="selectVideo(video)", :class='{ "bg-grey-md": selectedVideo === video }')
                        img.thumbnail-small.mr-2(v-lazy="videoImage(video)")
                        small.video-title(:title="video.title") {{video.title}}


</template>

<script>
import Spinner from "./Spinner.vue";

export default {
    components: { Spinner },
    data () {
        return {
            playlists: [],
            selectedPlaylist: null,
            selectedVideo: null,
            refreshing: false
        };
    },
    emits: ['selectedPlaylist', 'selectedVideo'],
    async mounted() {
        const response = await fetch('/playlists', { credentials: "include", headers: { 'Accept': 'application/json' }});
        const body = await response.json();
        this.playlists = body.playlists;
    },
    methods: {
        playlistImage(playlist) {
            return playlist.metadata.thumbnails?.maxres?.url || playlist.metadata.thumbnails?.high?.url;
        },
        videoImage(video) {
            return video.metadata.thumbnails?.maxres?.url || video.metadata.thumbnails?.high?.url;
        },
        async refresh() {
            if (this.refreshing) return;

            this.refreshing = true;
            const response = await fetch('/playlists/refresh', { method: 'post', credentials: "include", headers: { 'Accept': 'application/json' }});
            const body = await response.json();
            this.playlists = body.playlists;
            this.refreshing = false;
        },
        selectPlaylist(playlist) {
            if (this.selectedPlaylist === playlist) {
                this.selectedPlaylist = null;
                this.$emit('selectedPlaylist', null);
            } else {
                this.selectedPlaylist = playlist;
                this.$emit('selectedPlaylist', playlist);
            }
        },
        selectVideo(video) {
            this.selectedVideo = video;
            this.$emit('selectedVideo', video);
        },
        isSelected(playlist) {
            return playlist.id === this.selectedPlaylist?.id;
        }
    }
};
</script>

<style scoped lang="scss">
img.thumbnail {
    width: 180px;
    height: 101px;
}
img.thumbnail-small {
    width: 64px;
    height: 36px;
}
.video-title {
    width: 180px;
    height: 42px;
    overflow: hidden;
}
.bg-grey-md {
    background-color: #e9ecef;
}
</style>
