<template>
    <div class="flex-grow-1">
        <Header title="Forms" description="Create and manage your forms" />
        <EditorTables />
    </div>
</template>

<script>
import EditorTables from '../components/tables/EditorTables.vue'
import Header from '../components/Util/Header.vue'

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
            this.$store.dispatch('Forms/get');
        },
    },
    computed: {
    }
}
</script>
