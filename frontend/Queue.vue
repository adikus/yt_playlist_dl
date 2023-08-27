<template>
    <div class="d-flex flex-row-reverse mb-1">
        <a v-if="explicitQueue.length" href="#" class="text-danger" @click.prevent="$emit('clearQueue')">Clear queue</a>
    </div>
    <div
        class="pointer border-right border-left border-bottom p-1 bg-light text-truncate"
        v-for="(video, index) in queue"
        @click.prevent="$emit('playVideo', video)"
        :class='{ "border-top": index === 0, "rounded-top": index === 0, "rounded-bottom": index === queue.length - 1 }'
    >
        <template v-if="video.id === playingVideo.id">
            <i role="button" class="d-inline-block w-15px fa fa-play mx-1" v-if="!playing"></i>
            <i role="button" class="d-inline-block w-15px fa fa-pause mx-1" v-if="playing"></i>
        </template>
        <span v-else class="d-inline-block w-15px mx-1">&nbsp;</span>
        {{video.title}}
    </div>
</template>

<script>
    export default {
        props: ['playingVideo', 'playing', 'explicitQueue', 'implicitQueue'],
        emits: ['playVideo', 'clearQueue'],
        computed: {
            queue() {
                if (this.explicitQueue.length) return this.explicitQueue

                return this.implicitQueue;
            }
        }
    };
</script>

<style scoped lang="scss">
.w-15px {
    width: 15px;
}
.pointer {
    cursor: pointer;
}
</style>
