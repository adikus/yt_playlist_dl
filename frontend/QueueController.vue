<template>
    <i class="fa fa-play mr-2" v-if="!playing"></i>
    <i class="fa fa-pause mr-2" v-if="playing"></i>
    {{title}}
</template>

<script>
    export default {
        props: ['title', 'playing'],
    };
</script>
