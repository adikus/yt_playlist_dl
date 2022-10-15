<template lang="pug">
.col-lg-6
    .card.my-3.p-3
        h5 {{index + 1}}. {{video.title}}
        .row
            .col-sm-3
                small
                    | {{ video.metadata.channelTitle }}
                    a.float-sm-right(:href="`https://www.youtube.com/watch?v=${video.id}`") {{ video.id }}
                play-audio-image(:image-src="video.metadata.thumbnails.default.url", :title="video.title", :url="playableUrl", @click="playTrack(video.title, playableUrl, index)")
            .col-sm-4
                h6 Status & Uploads
                div
                    form(method='post', encType='multipart/form-data', :action="`/playlist-videos/${video.playlistVideo.id}/remove`")
                        .row.mb-2
                            .col-sm-6
                                em {{ video.playlistVideo.status }}
                            .col-sm-6
                                input.btn.btn-sm.btn-secondary(type='submit', value='Remove', v-if="video.playlistVideo.status !== 'removed'")
                                input.btn.btn-sm.btn-secondary(type='submit', value='Unremove', v-if="video.playlistVideo.status === 'removed'")
                .row.mb-2
                    .col-sm-6
                        a(:href="video.originalUpload.url", v-if="video.originalUpload") {{ video.originalUpload.file_type }}
                    .col-sm-6
                        a.btn.btn-sm.btn-secondary(:href="`/videos/${video.id}/upload`") (Re)Upload
                .row.mb-2
                    .col-sm-6
                        a(:href="video.mp3Upload.url", v-if="video.mp3Upload") mp3
                    .col-sm-6
                        a.btn.btn-sm.btn-secondary(:href="`/videos/${video.id}/convert`") (Re)Convert
                form(method='post', encType='multipart/form-data', :action="`/playlist-videos/${video.playlistVideo.id}/upload-mp3`", v-if="!video.mp3Upload")
                    .form-group.row.mb-2
                        .col-sm-6
                            input.form-control.form-control-sm(type='file', name='mp3_file')
                        .col-sm-6
                            input.btn.btn-secondary.btn-sm(type='submit', value='Upload mp3')

                div.mb-2(v-for="upload in video.customUploads")
                    a(:href="upload.upload.url") {{ upload.type }}

            div(:class="`col-sm-5 metadata-cell ${metadataClass}`")
                h6 Metadata
                form(method='post', :action="`/playlist-videos/${video.playlistVideo.id}/metadata`")
                    .form-group.row.mb-0
                        label.col-form-label.col-sm-4(:for="`artist_${video.id}`") Artist
                        .col-sm-6
                            input.form-control.form-control-sm(type='text', :id="`artist_${video.id}`", name='artist', v-model="video.metadata.artist")
                    .form-group.row.mb-0
                        label.col-form-label.col-sm-4(:for="`title_${video.id}`") Title
                        .col-sm-6
                            input.form-control.form-control-sm(type='text', :id="`title_${video.id}`", name='title', v-model="video.metadata.title")
                    .form-group.row.mb-0
                        label.col-form-label.col-sm-4(:for="`genre_${video.id}`") Genre
                        .col-sm-6
                            input.form-control.form-control-sm(type='text', :id="`genre_${video.id}`", name='genre', v-model="video.metadata.genre")
                    .form-group.row.mb-0
                        .col-sm-6
                            input.btn.btn-primary.btn-sm.submit.js-metadata-save(type='submit', value='Save')
                    .js-metadata-save-message
</template>

<script>
    import PlayAudioImage from './PlayAudioImage.vue'

    export default {
        props: ['video', 'index', 'playTrack', 'playingIndex'],
        data() {
            return {
                metadata: {
                    artist: '',
                    title: '',
                    genre: ''
                }
            };
        },
        computed: {
            playableUrl() {
                return (this.video.mp3Upload && this.video.mp3Upload.url) ||
                    (this.video.originalUpload && this.video.originalUpload.url) ||
                    ('https://audio.adikus.me/yt/' + this.video.id)
            },
            hasMetadata() {
                return this.video.playlistVideo.artist && this.video.playlistVideo.title;
            },
            guessedMetadata() {
                return this.video.playlistVideo.guessedMetadata;
            },
            metadataClass() {
                return this.hasMetadata ? 'has-metadata' : 'no-metadata';
            }
        },
        mounted() {
            for(let key of ['artist', 'title', 'genre']) {
                this.video.metadata[key] = this.video.playlistVideo[key] || (this.guessedMetadata && this.guessedMetadata[key]);
            }
        },
        watch: {
            playingIndex(playingIndex) {
                if (this.index === playingIndex) {
                    this.playTrack(this.video.title, this.playableUrl, this.index)
                }
            }
        },
        components: {
            'play-audio-image': PlayAudioImage
        }
    };
</script>
