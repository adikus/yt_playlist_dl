<template>
    <div class="d-flex flex-row justify-content-between px-1 mb-1">
        <a href="#" @click.prevent="$emit('shuffleQueue', queue)">
            <i class="fa fa-random mx-1"></i> Shuffle
        </a>
        <a href="#" @click.prevent="$emit('reverseQueue', queue)">
            <i class="fa fa-arrows-v mx-1"></i> Reverse
        </a>
        <a href="#" class="text-danger" :disabled="!explicitQueue.length" @click.prevent="$emit('clearQueue')">
            <i class="fa fa-times-circle-o mx-1"></i> Clear queue
        </a>
    </div>
    <div
        class="pointer border-right border-left border-bottom p-1 bg-light text-truncate"
        v-for="(video, index) in queue"
        @click.prevent="$emit('playVideo', video)"
        :class='{ "border-top": index === 0, "rounded-top": index === 0, "rounded-bottom": index === queue.length - 1 }'
    >
        <template v-if="video.id === playingVideo.id">
            <i class="d-inline-block w-15px fa fa-play mx-1" v-if="!playing"></i>
            <i class="d-inline-block w-15px fa fa-pause mx-1" v-if="playing"></i>
        </template>
        <span v-else class="d-inline-block w-15px mx-1">&nbsp;</span>
        {{video.title}}
    </div>
</template>

<script>
    export default {
        props: ['playingVideo', 'playing', 'explicitQueue', 'implicitQueue'],
        emits: ['playVideo', 'clearQueue', 'shuffleQueue', 'reverseQueue'],
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
a[disabled="true"] {
    color: grey !important;
    text-decoration: none;
    cursor: default;
}
</style>
