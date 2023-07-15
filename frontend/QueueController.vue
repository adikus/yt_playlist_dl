<template>
    <i role="button" class="fa fa-play mr-2" v-if="!playing" @click.prevent="$emit('playVideo', { title })"></i>
    <i role="button" class="fa fa-pause mr-2" v-if="playing" @click.prevent="$emit('playVideo', { title })"></i>
    {{title}}
</template>

<script>
    export default {
        props: ['title', 'playing'],
        emits: ['playVideo'],
    };
</script>
