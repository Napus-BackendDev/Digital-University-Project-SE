<template>
  <CContainer fluid class="vh-100 p-0 m-0">
    <CRow no-gutters class="h-100 m-0">
      <CCol lg="6" class="d-none d-lg-flex p-0 order-lg-1 order-2">
        <RightSection />
      </CCol>
      <CCol lg="6" cols="12" class="p-0 order-lg-2 order-1 flex-fill d-flex">
        <LeftSection />
      </CCol>
    </CRow>
  </CContainer>
</template>

<script>
import { CContainer, CRow, CCol } from '@coreui/vue'
import LeftSection from '../components/login/LeftSection.vue'
import RightSection from '../components/login/RightSection.vue'

export default {
  name: 'Login',
  components: {
    CContainer,
    CRow,
    CCol,
    LeftSection,
    RightSection
  }
}
</script>