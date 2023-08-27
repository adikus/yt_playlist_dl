<template>
    <div class="d-flex flex-row justify-content-between px-1 mb-1">
        <a href="#" @click.prevent="shuffleQueue()">
            <i class="fa fa-random mx-1"></i> Shuffle
        </a>
        <a href="#" @click.prevent="reverseQueue()">
            <i class="fa fa-arrows-v mx-1"></i> Reverse
        </a>
        <a href="#" class="text-danger" :disabled="!explicitQueue.length" @click.prevent="clearQueue()">
            <i class="fa fa-times-circle-o mx-1"></i> Clear queue
        </a>
    </div>
    <div
        class="pointer border-right border-left border-bottom px-2 py-1 bg-light d-flex flex-row align-items-center"
        v-for="(video, index) in queue"
        @click.prevent="$emit('playVideo', video)"
        :class='{ "border-top": index === 0, "rounded-top": index === 0, "rounded-bottom": index === queue.length - 1 }'
    >
        <div v-if="video.id === playingVideo.id" class="bars mr-2" :class='{ "bars-active": playing }'>
            <span/>
            <span/>
            <span/>
        </div>
        <span v-else class="d-inline-block w-15px mr-2">&nbsp;</span>
        <span class="flex-grow-1 text-truncate">{{video.title}}</span>
        <i class="fa fa-trash mx-1 flex-shrink-1 on-parent-hover" @click.stop.prevent="removeFromQueue(video)"></i>
    </div>
</template>

<script>
    export default {
        props: ['playingVideo', 'playing', 'explicitQueue', 'implicitQueue'],
        emits: ['playVideo', 'updateQueue'],
        computed: {
            queue() {
                if (this.explicitQueue.length) return this.explicitQueue

                return this.implicitQueue;
            }
        },
        methods: {
            clearQueue() {
                this.$emit('updateQueue', [])
            },
            shuffleQueue() {
                const explicitQueue = [...this.queue];
                for (let i = explicitQueue.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [explicitQueue[i], explicitQueue[j]] = [explicitQueue[j], explicitQueue[i]];
                }
                this.$emit('updateQueue', explicitQueue)
            },
            reverseQueue() {
                const explicitQueue = [...this.queue];
                explicitQueue.reverse();
                this.$emit('updateQueue', explicitQueue)
            },
            removeFromQueue(video) {
                this.$emit('updateQueue', this.queue.filter((v) => v.id !== video.id))
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
div {
    &> .on-parent-hover {
        display: none;
        color: grey;
    }
    &:hover > .on-parent-hover {
        display: inline-block;

        &:hover {
            color: #dc3545;
        }
    }
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
