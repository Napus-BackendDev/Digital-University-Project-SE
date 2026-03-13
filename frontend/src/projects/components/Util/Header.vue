<template>
    <div>
        <h1 class="mb-2 text-dark font-weight-bold">{{ title }}</h1>
        <p class="mb-4">{{ description }}</p>
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