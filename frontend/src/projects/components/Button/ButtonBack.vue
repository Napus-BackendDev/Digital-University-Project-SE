<template>
    <CButton color="dark" variant="outline" shape="pill" class="d-flex align-items-center px-4 font-weight-bold"
        @click="$router.push(path)">
        <CIcon name="cil-arrow-left" class="mr-2" />
        {{ label }}
    </CButton>
</template>

<script>
export default {
    name: "ButtonBack",
    props: {
        path: {
            type: String,
            default: '/user/dashboard'
        },
        label: {
            type: String,
            default: 'Back to Forms'
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
