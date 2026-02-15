<template>
    <CCard class="mb-4 border-0 shadow-sm">
        <CCardBody class="p-4">
            <h5 class="mb-2 font-weight-bold text-dark">Send Form</h5>
            <p class="text-muted mb-4">Share this form with respondents via link or email
            </p>

            <div class="d-flex">
                <CButton color="light" class="mr-3 d-flex align-items-center px-3 py-2"
                    style="border-radius: 6px; background-color: #f8f9fa; border: 1px solid #d8dbe0;">
                    <CIcon name="cil-share-alt" class="mr-2" />
                    Copy Link
                </CButton>
                <CButton color="dark" class="d-flex align-items-center px-3 py-2" style="border-radius: 6px;">
                    <CIcon name="cil-envelope-closed" class="mr-2" />
                    Send via Email
                </CButton>
            </div>
        </CCardBody>
    </CCard>
</template>

<script>
export default {
    name: 'SendForm'
}
</script>
