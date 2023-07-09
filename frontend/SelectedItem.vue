<template lang="pug">
template(v-if="playlist")
    img.thumbnail.mr-2.w-100(v-lazy="playlist.metadata.thumbnails.maxres.url")
    h2 {{playlist.title}}
    .text-muted {{playlist.status}} | {{playlist.created_at}}

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
    props: ['selectedItem', 'selectedItemType'],
    components: { Spinner },
    data() {
        return {
            refreshing: false,
            uploading: false,
            converting: false
        };
    },
    computed: {
        playlist() {
            return this.selectedItemType === 'playlist' ? this.selectedItem : null
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
                return response.json();
            } else {
                throw "Request failed"
            }
        }
    }
};
</script>
