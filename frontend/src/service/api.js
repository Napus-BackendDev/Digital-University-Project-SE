import axios from 'axios';
import store from '@/store/store'

const instance = axios.create();

instance.defaults.baseURL = process.env.VUE_APP_API_BASE_URL || '/api/v1/';
instance.defaults.withCredentials = true;


// Do not force Content-Type globally so axios can set multipart/form-data when sending FormData
instance.defaults.headers = {
  Accept: "application/json"
}

export default {
  auth(method, data) {
    switch (method) {
      case 'google':
        return instance.post('auth/google', data)
      case 'me':
        return instance.get('auth/me')
      case 'logout':
        return instance.post('auth/logout')
      default:
        break
    }
  },

  form(method, data, configs) {
    switch (method) {
      case 'exp':
        return instance.get('form/exp', { params: data })
      case 'getByUser':
        return instance.post('form/user', { _id: data.userId })
      case 'get':
        return instance.post('form/get', data)
      case 'create':
        return instance.post('form', data)
      case 'update':
        return instance.put('form', data)
      case 'delete':
        return instance.delete('form', { data })
      default:
        break
    }
  },

  question(method, data, configs) {
    switch (method) {
      case 'exp':
        return instance.get('question/exp', data)
      case 'get':
        return instance.post('question/get', data)
      case 'create':
        return instance.post('question', data)
      case 'create-many':
        return instance.post('question', data)
      case 'update':
        return instance.put('question', data)
      case 'delete':
        return instance.delete('question', { data })
      default:
        break
    }
  },

  response(method, data, configs) {
    switch (method) {
      case 'exp':
        return instance.get('response/exp', data)
      case 'get':
        return instance.post('response/get', data)
      case 'submit':
        return instance.post('response', data)
      case 'create':
        return instance.post('response', data)
      case 'update':
        return instance.put('response', data)
      case 'update-multipart':
        return instance.put('response', data)
      case 'delete':
        return instance.delete('response', { data, ...configs })

      case 'download-user-json':
        return instance.get(`response/download/${data.formId}/response/${data.responseId}`)
      case 'download-form-json':
        return instance.get(`response/download/${data.formId}`)
      default:
        break
    }
  },

  setting(method, data, configs) {
    switch (method) {
      // Message settings
      case 'message-get':
        return instance.get('settings/message')
      case 'message-create':
        return instance.post('settings/message', data)
      case 'message-update':
        return instance.put('settings/message', data)
      case 'message-delete':
        return instance.delete('settings/message', { data })

      // Status settings
      case 'status-get':
        return instance.get('settings/status')
      case 'status-create':
        return instance.post('settings/status', data)
      case 'status-update':
        return instance.put('settings/status', data)
      case 'status-delete':
        return instance.delete('settings/status', { data })

      // Verification settings
      case 'verification-get':
        return instance.get('settings/verification')
      case 'verification-create':
        return instance.post('settings/verification', data)
      case 'verification-explorers':
        return instance.post('settings/verification/explorers', data)
      case 'verification-update':
        return instance.put('settings/verification', data)
      case 'verification-delete':
        return instance.delete('settings/verification', { data })

      // Question Type settings
      case 'question-type-get':
        return instance.get('settings/question_type')
      case 'question-type-create':
        return instance.post('settings/question_type', data)
      case 'question-type-update':
        return instance.put('settings/question_type', data)
      case 'question-type-delete':
        return instance.delete('settings/question_type', { data })

      case 'vision-get':
        return instance.get('settings/status', data)
      case 'vision-create':
        return instance.post('settings/status', data)
      case 'vision-update':
        return instance.put('settings/status', data)
      case 'vision-delete':
        return instance.delete('settings/status', { data })

      // Collaborator settings
      case 'collaborator-get':
        return instance.get('settings/collaborator')
      case 'collaborator-create':
        return instance.post('settings/collaborator', data)
      case 'collaborator-update':
        return instance.put('settings/collaborator', data)
      case 'collaborator-delete':
        return instance.delete('settings/collaborator', { data })

      // EmailTemplate settings
      case 'email-template-get':
        return instance.get('settings/emailTemplate', { params: data })
      case 'email-template-create':
        return instance.post('settings/emailTemplate', data)
      case 'email-template-update':
        return instance.put('settings/emailTemplate', data)
      case 'email-template-delete':
        return instance.delete('settings/emailTemplate', { data })

      default:
        break
    }
  },

  user(method, data) {
    switch (method) {
      case 'exp':
        return instance.get('user/exp')
      case 'get':
        return instance.post('user/get', data)
      case 'create':
        return instance.post('user', data)
      case 'update':
        return instance.put('user', data)
      case 'delete':
        return instance.delete('user', { data })
      case 'role-list':
        return instance.get('user/role/exp')
      default:
        break
    }
  },

  organization(method, data) {
    switch (method) {
      case 'exp':
        return instance.get('organization/exp')
      case 'get':
        return instance.post('organization/get', data)
      case 'create':
        return instance.post('organization', data)
      case 'update':
        return instance.put('organization', data)
      case 'delete':
        return instance.delete('organization', { data })
      default:
        break
    }
  },

  roles(method, data) {
    switch (method) {
      case 'exp':
        return instance.get('user/role/exp')
      case 'get':
        return instance.post('user/role/get', data)
      case 'create':
        return instance.post('user/role', data)
      case 'update':
        return instance.put('user/role', data)
      case 'delete':
        return instance.delete('user/role', { data })
      default:
        break
    }
  },

}
