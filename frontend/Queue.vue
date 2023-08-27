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
        <div v-if="video.id === playingVideo.id" class="bars mx-1" :class='{ "bars-active": playing }'>
            <span/>
            <span/>
            <span/>
        </div>
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
.bars {
    position: relative;
    left: 1px;
    display: inline-flex;
    justify-content: space-between;
    width: 15px;
    height: 15px;

    span {
        width: 3px;
        height: 100%;
        background-color: black;
        border-radius: 3px;
        content: '';
        transform-origin: bottom;
        transform: scaleY(0.2);

        &:nth-of-type(2) {
            animation-delay: -2.2s; /* Start at the end of animation */
        }

        &:nth-of-type(3) {
            animation-delay: -3.7s; /* Start mid-way of return of animation */
        }
    }
}
.bars-active {
    @keyframes bounce {
        10% {
            transform: scaleY(0.3); /* start by scaling to 30% */
        }

        30% {
            transform: scaleY(1); /* scale up to 100% */
        }

        60% {
            transform: scaleY(0.5); /* scale down to 50% */
        }

        80% {
            transform: scaleY(0.75); /* scale up to 75% */
        }

        100% {
            transform: scaleY(0.6); /* scale down to 60% */
        }
    }

    span {
        animation: bounce 1.2s ease infinite alternate;
    }
}
</style>
