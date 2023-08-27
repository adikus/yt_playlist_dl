<template>
    <i role="button" class="fa fa-play mr-2" v-if="!playing" @click.prevent="$emit('playVideo', playingVideo)"></i>
    <i role="button" class="fa fa-pause mr-2" v-if="playing" @click.prevent="$emit('playVideo', playingVideo)"></i>
    {{playingVideo?.title}}
</template>

<script>
    export default {
        props: ['playingVideo', 'playing'],
        emits: ['playVideo'],
    };
</script>
