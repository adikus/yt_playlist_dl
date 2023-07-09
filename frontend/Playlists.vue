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
        .d-flex.border-bottom.py-2(v-for="playlist in playlists" :key="playlist.id" role="button" @click.prevent="select(playlist)")
            img.thumbnail.mr-2(v-lazy="playlistImage(playlist)")
            div
                h2
                    u(v-if="isSelected(playlist)") {{playlist.title}}
                    template(v-else) {{playlist.title}}
                .text-muted {{playlist.status}} | {{playlist.created_at}}
</template>

<script>
import Spinner from "./Spinner.vue";

export default {
    components: { Spinner },
    data () {
        return {
            playlists: [],
            selectedPlaylist: null,
            refreshing: false
        };
    },
    emits: ['selected'],
    async mounted() {
        const response = await fetch('/playlists', { credentials: "include", headers: { 'Accept': 'application/json' }});
        const body = await response.json();
        this.playlists = body.playlists;
    },
    methods: {
        playlistImage(playlist) {
            return playlist.metadata.thumbnails?.maxres?.url || playlist.metadata.thumbnails?.high?.url;
        },
        async refresh() {
            if (this.refreshing) return;

            this.refreshing = true;
            const response = await fetch('/playlists/refresh', { method: 'post', credentials: "include", headers: { 'Accept': 'application/json' }});
            const body = await response.json();
            this.playlists = body.playlists;
            this.refreshing = false;
        },
        select(playlist) {
            this.selectedPlaylist = playlist;
            this.$emit('selected', { playlist });
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
}
</style>
