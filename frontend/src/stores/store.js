import { createStore } from 'vuex'
import formModule from './modules/Form/index'
import questionModule from './modules/Questions/index'
import responseModule from './modules/Response/index'

export default createStore({
  modules: {
    form: formModule,
    question: questionModule,
    response: responseModule
  }
})
