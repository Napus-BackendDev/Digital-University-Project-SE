<template>
    <CRow>
        <CCol col="12">
            <ButtonBack path="/user/dashboard" />
        </CCol>
    </CRow>
</template>

<script>
import ButtonBack from '../../components/Button/ButtonBack.vue'

export default {
    name: "UserFormFill",
    components: {
        ButtonBack
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