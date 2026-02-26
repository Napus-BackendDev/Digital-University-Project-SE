<template>
    <div class="back" style="cursor: pointer" @click="$router.push(path)">
        <CIcon name="cil-chevron-left" />
        <span class="px-1">{{ label }}</span>
    </div>
</template>

<script>
export default {
    name: "ButtonBack",
    props: {
        path: {
            type: String,
            default: '/'
        },
        label: {
            type: String,
            default: 'Back'
        }
    },
    components: {
    },
    data() {
        return {
        }
    },
    created() {
        this.onInit();
    },
    methods: {
        onInit() {
        },
    },
    computed: {
    }
}
</script>

<style>
.back {
    display: flex;
    align-items: center;
    font-weight: bold;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s ease;
}

.back:hover {
    background: rgba(0, 0, 0, 0.04);
}
</style>