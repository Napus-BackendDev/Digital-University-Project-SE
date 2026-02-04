import axios from 'axios';
import store from '@/store/store'

const instance = axios.create();

instance.defaults.baseURL =  'http://localhost:8081/api/v1';

instance.defaults.headers = {
    "Content-Type": "application/json",
    // "Api-version": "1.0",
    // "X-Access-Token": "1a661eec9bf358b8567c3dc022146d19c69d2ceafe92f503e89391e5d9f9f739",
}

//
// // เพิ่ม request interceptor
// instance.interceptors.request.use(
//     (config) => {
//       const token = `${store.state.XAccessToken}`;
//       if (token) {
//         config.headers.Authorization = `Bearer ${store.state.XAccessToken}`;
//       }
//
//       config.headers.lang  = `${store.getters['setting/lang']}`;
//       return config;
//     },
//     (error) => {
//       return Promise.reject(error);
//     }
// );
//
// // เพิ่ม Interceptor สำหรับ Response
// instance.interceptors.response.use(
//     (response) => {
//       // คืนค่าปกติหาก response สำเร็จ
//       return response;
//     },
//     (error) => {
//       // ตรวจสอบสถานะ 401
//       if (error.response && error.response.status === 401) {
//         // แสดง Dialog หรือ Popup
//         router.push('/login');
//       }
//       return Promise.reject(error);
//     }
// );

export default {
  
  form(method, data, configs) {
    switch (method) {
      case 'exp':
        return instance.get('/form')
      // case 'get':
      //   return instance.get('/form', data)
      case 'create':
        return instance.post('/form', data)
      case 'update':
        return instance.put('/form', data)
      case 'delete':
        return instance.delete('/form', data)
      default:
        break
    }
  },

  question(method, data, configs) {
    switch (method) {
      case 'exp':
        return instance.get('/question', data)
      case 'create':
        return instance.post('/question', data)
      case 'create-many':
        return instance.post('/question', data)
      case 'update':
        return instance.put('/question', data)
      case 'delete':
        return instance.delete('/question', data)
      case 'delete-by-form-id':
        return instance.delete('/question/byForm', data)
      default:
        break
    }
  },

  response(method, data, configs) {
    switch (method) {
      case 'get-by-form-id':
        return instance.get(`/response/getByFormId?form_id=${data.formId}`)
      case 'get-by-user-id':
        return instance.get(`/response/getByUserId?userId=${data.userId}`)
      case 'get-by-id':
        return instance.get(`/response/getById?_id=${data._id}`)
      case 'submit':
        return instance.post('/response/submit', data)
      case 'update':
        return instance.patch('/response/update', data)
      case 'delete':
        return instance.delete('/response/delete', { data: { _id: data._id } })
      case 'delete-by-form-id':
        return instance.delete('/response/deleteByFormId', { data: { formId: data.formId } })
      case 'download-user-json':
        return instance.get(`/response/download/${data.formId}/user/${data.userId}`)
      case 'download-form-json':
        return instance.get(`/response/download/${data.formId}`)
      case 'generate-export-link':
        return instance.post('/response/export/link', { formId: data.formId })
      default:
        break
    }
  },

  setting(method, data, configs) {
    switch (method) {
      // Message settings
      case 'message-get':
        return instance.get('/setting/message')
      case 'message-create':
        return instance.post('/setting/message', data)
      case 'message-update':
        return instance.put('/setting/message', data)
      case 'message-delete':
        return instance.delete('/setting/message', { data })
      
      // Status settings
      case 'status-get':
        return instance.get('/setting/status')
      case 'status-create':
        return instance.post('/setting/status', data)
      case 'status-update':
        return instance.put('/setting/status', data)
      case 'status-delete':
        return instance.delete('/setting/status', { data })
      
      // Verification settings
      case 'verification-get':
        return instance.get('/setting/verification')
      case 'verification-create':
        return instance.post('/setting/verification', data)
      case 'verification-explorers':
        return instance.post('/setting/verification/explorers', data)
      case 'verification-update':
        return instance.put('/setting/verification', data)
      case 'verification-delete':
        return instance.delete('/setting/verification', { data })
      
      default:
        break
    }
  },

}