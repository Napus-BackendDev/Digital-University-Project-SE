<template>
    <div class="editor-dashboard">
        <Header title="My Forms" description="Create and manage your forms" />
        <EditorTables />
    </div>
</template>

<script>
import EditorTables from '../../components/tables/EditorTables.vue'
import Header from '../../components/Util/Header.vue'

export default {
    name: "EditorDashboard",
    components: {
        EditorTables,
        Header
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
            this.$store.dispatch('Forms/getForms');
        },
    },
    computed: {
    }
}
</script>

<style scoped>
.editor-dashboard {
    display: flex;
    flex-direction: column;
    gap: 32px;
    max-width: 1216px;
    margin: 0 auto;
}
</style>
