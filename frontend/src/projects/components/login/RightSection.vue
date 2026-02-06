<template>
    <!-- Main container with gradient background for the right section -->
    <CContainer fluid class="min-vh-100 d-flex align-items-center p-4 text-white"
        style="background: linear-gradient(135deg, #c41e3a 0%, #a01729 100%);">
        <!-- Inner container with max width for content layout -->
        <CContainer class="h-100" style="max-width: 600px;">
            <!-- Header section with logo and brand name -->
            <CRow class="align-items-center mb-4">
                <!-- Logo container -->
                <CCol xs="auto">
                    <CCard class="rounded-5 p-2 d-flex align-items-center justify-content-center border-0" style="
                    width: 40px; 
                    height: 40px;
                    border-radius: 12px;
                    background-color: #C94057;
                    margin-top: 30px; ">
                    </CCard>
                </CCol>
                <!-- Brand name with responsive font sizes -->
                <CCol>
                    <h1 class="mb-0 fw-bold text-white">
                        <span class="fs-4 d-md-none">FormBuilder</span>
                        <span class="fs-2 d-none d-md-block">FormBuilder</span>
                    </h1>
                </CCol>
            </CRow>

            <!-- Main content section -->
            <div class="mt-4">
                <!-- Hero title with responsive sizing -->
                <h2 class="fw-bold lh-sm mb-3 text-white">
                    <span class="display-6 d-none d-md-block">
                        Create Beautiful Forms in Minutes
                    </span>
                    <span class="h4 d-md-none">
                        Create Beautiful Forms
                    </span>
                </h2>

                <!-- Description text (hidden on mobile) -->
                <p class="lead mb-4 d-none d-md-block text-white-75" style="max-width: 500px; opacity: 0.9;">
                    Build, share, and analyze forms with powerful features and elegant design.
                    Perfect for surveys, registrations, and feedback collection.
                </p>

                <!-- Image card with backdrop filter and Mae Fah Luang University campus photo -->
                <CCard class="border-0 shadow-lg bg-white bg-opacity-10"
                    style="backdrop-filter: blur(10px); overflow: hidden; border-radius: 12px;">
                    <img src="@/assets/photos/mfu.png" alt="Mae Fah Luang University Campus" class="card-img-top"
                        style="height: 400px; object-fit: cover; width: 100%; display: block;" />
                </CCard>
            </div>
        </CContainer>
    </CContainer>
</template>

<script>
import {
    CContainer,  
    CRow,        
    CCol,        
    CCard        
} from '@coreui/vue'

export default {
    name: 'RightSection',
    components: {
        CContainer,
        CRow,
        CCol,
        CCard
    }
}
</script>