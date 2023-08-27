<template lang="pug">
template(v-if="video")
        img.thumbnail.mr-2.w-100(v-if="videoThumbnail", v-lazy="videoThumbnail")
        a.mt-1.d-inline-block(href='#', v-if="playlist", @click.prevent="$emit('selectedVideo', null)") &lt; {{playlist.title}}
        h2.mt-2 {{video.title}}

        .d-flex.flex-row.flex-wrap
            .badge.badge-dark.mr-2 {{video.channel}}
            .badge.badge-light.mr-2 {{video.playlistVideo?.status}}
            .badge.badge-light.mr-2 {{video.playlistVideo?.created_at}}
            .badge.badge-success.mr-2(v-if="video.originalUpload?.url") Uploaded
            .badge.badge-success.mr-2(v-if="video.mp3Upload?.url") Converted

        .d-flex.flex-row.justify-content-between.mt-3
            a.btn.btn-primary(href='#', v-if="video.id === playingVideo?.id && playing", @click.prevent="$emit('playVideo', video)")
                span.fa.fa-pause.mr-1
                | Pause
            a.btn.btn-primary(href='#', v-else, @click.prevent="$emit('playVideo', video)")
                span.fa.fa-play.mr-1
                | Play


template(v-else-if="playlist")
    img.thumbnail.mr-2.w-100(v-lazy="playlist.metadata?.thumbnails?.maxres?.url")
    h2 {{playlist.title}}
    .badge.badge-light.mr-2 {{playlist.status}}
    .badge.badge-light.mr-2 {{playlist.created_at}}

    .d-flex.flex-row.justify-content-between.mt-2
        a.btn.btn-primary(href='#', @click.prevent="refresh")
            spinner.mr-1(size="16", v-if="refreshing")
            span.fa.fa-refresh.mr-1(v-else)
            | Refresh playlist
        a.btn.btn-primary(href='#', @click.prevent="upload")
            spinner.mr-1(size="16", v-if="uploading")
            span.fa.fa-upload.mr-1(v-else)
            | Upload playlist
        a.btn.btn-primary(href='#', @click.prevent="convert")
            spinner.mr-1(size="16", v-if="converting")
            span.fa.fa-arrow-circle-o-right.mr-1(v-else)
            | Convert playlist

    .form-check.mt-4
        input.form-check-input(type='checkbox', :id="`autoupdate_${playlist.id}`", name='autoupdate', value='on' v-model="playlist.autoupdate" @change="savePlaylist")
        label.form-check-label(:for="`autoupdate_${playlist.id}`") Autoupdate
</template>

<script>
import Spinner from "./Spinner.vue";

export default {
    props: ['playlist', 'video', 'playingVideo', 'playing'],
    components: { Spinner },
    data() {
        return {
            refreshing: false,
            uploading: false,
            converting: false
        };
    },
    emits: ['selectedVideo', 'playVideo'],
    watch: {
        async playlist(playlist, oldPlaylist) {
            if (playlist) {
                if (oldPlaylist) oldPlaylist.shownVideos = [];

                if (playlist.videos) {
                    playlist.shownVideos = playlist.videos;
                    return;
                }

                playlist.loading = true;

                const response = await fetch(`/playlists/${this.playlist.id}`, { credentials: "include", headers: { 'Accept': 'application/json' }});

                playlist.loading = false;
                if (response.status === 200) {
                    const body = await response.json();
                    playlist.videos = body.videos;
                    playlist.shownVideos = playlist.videos;
                } else {
                    throw "Request failed"
                }
            } else if(!this.video) {
                if (oldPlaylist) oldPlaylist.shownVideos = [];
            }
        }
    },
    computed: {
      videoThumbnail() {
          return this.video?.metadata?.thumbnails.maxres?.url || this.video?.metadata?.thumbnails?.high?.url
      }
    },
    methods: {
        async savePlaylist() {
            const response = await fetch(
                `/playlists/${this.playlist.id}/metadata`,
                {
                    method: 'post',
                    body: JSON.stringify({ autoupdate: this.playlist.autoupdate }),
                    credentials: "include",
                    headers: { 'Accept': 'application/json', "Content-Type": "application/json"  }
                }
            );
            if (response.status !== 200){
                const body = await response.body();
                console.error("Save request failed:", body)
            }
        },
        async refresh() {
            await this.postAction('refresh');
        },
        async upload() {
            await this.postAction('upload');
        },
        async convert() {
            await this.postAction('convert');
        },
        async postAction(action) {
            const stateName = `${action}ing`
            if (this[stateName]) return;

            this[stateName] = true;
            const response = await fetch(`/playlists/${this.playlist.id}/${action}`, { method: 'post', credentials: "include", headers: { 'Accept': 'application/json' }});

            this[stateName] = false;
            if (response.status === 200) {
                const body = await response.json();
                this.playlist.videos = body.videos;
                this.playlist.shownVideos = this.playlist.videos;
                return body;
            } else {
                throw "Request failed"
            }
        },
    }
};
</script>
