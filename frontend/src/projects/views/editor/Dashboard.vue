<template>
    <div>
        <Header title="My Forms" description="Create and manage your forms" />
        <CRow>
            <CCol col="12">
                <EditorTables />
            </CCol>
        </CRow>
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
