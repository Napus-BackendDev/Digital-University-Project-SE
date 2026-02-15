<template>
    <div>
        <h1 class="mb-2 text-dark font-weight-bold">{{ title }}</h1>
        <h5 class="text-muted mb-4">{{ description }}</h5>
    </div>
</template>

<script>
export default {
    name: "Header",
    props: {
        title: {
            type: String,
            default: ""
        },
        description: {
            type: String,
            default: ""
        }
    }
}
</script>