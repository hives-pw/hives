import axios from 'axios'

export class ApiService {
  constructor () {
    console.debug('[Hive][Service][Api] ApiService::initialized')
    this.instance = ApiService.create()
    this.exp = null
    this.refresh = null
    this.source = null
  }

  static create (host = process.env.API_HOST, headers = {}) {
    console.debug('[Hive][Service][Api] ApiService::create', host)
    return axios.create({
      baseURL: host,
      timeout: 30000,
      headers: headers
    })
  }

  setToken (token, refresh, exp = 3600) {
    this.instance.defaults.headers.common['x-access-token'] = token
    this.refresh = refresh
    this.exp = exp
    console.debug('[Hive][Service][Api] token::set')
  }

  resetToken () {
    delete this.instance.defaults.headers.common['x-access-token']
    this.refresh = null
    this.exp = null
    console.debug('[Hive][Service][Api] token::reset')
    return this
  }

  check () {
    return new Promise((resolve, reject) => {
      let expired = this.exp && new Date() > this.exp
      console.debug('[Hive][Service][Api] check::' + (this.exp ? 'user::' + (expired ? 'expired' : 'valid') : 'public'))
      if (expired) {
        this.refresh().then(resolve).catch(reject)
      } else {
        resolve()
      }
    })
  }

  post (method, params = {}) {
    return new Promise((resolve, reject) => {
      console.debug('[Hive][Service][Api] post::' + method)
      this.check().then(() => {
        this.instance.post(method, params).then(resolve).catch(reject)
      }).catch(reject)
    })
  }

  get (method, params = {}) {
    return new Promise((resolve, reject) => {
      console.debug('[Hive][Service][Api] get::' + method)
      this.check().then(() => {
        this.source = axios.CancelToken.source()
        this.instance.get(method, { params, cancelToken: this.source.token }).then(resolve).catch(reject)
      }).catch(reject)
    })
  }

  put (method, params = {}) {
    return new Promise((resolve, reject) => {
      console.debug('[Hive][Service][Api] put::' + method)
      this.check().then(() => {
        this.instance.put(method, params).then(resolve).catch(reject)
      }).catch(reject)
    })
  }

  patch (method, params = {}) {
    return new Promise((resolve, reject) => {
      console.debug('[Hive][Service][Api] patch::' + method)
      this.check().then(() => {
        this.instance.patch(method, params).then(resolve).catch(reject)
      }).catch(reject)
    })
  }

  delete (method, params = {}) {
    return new Promise((resolve, reject) => {
      console.debug('[Hive][Service][Api] delete::' + method)
      this.check().then(() => {
        this.instance.delete(method, params).then(resolve).catch(reject)
      }).catch(reject)
    })
  }

  cancel (message = '') {
    console.debug('[Hive][Service][Api] cancel::' + this.source ? 'success' : 'failed')
    if (this.source) {
      console.debug('[Hive][Service][Api] cancel::' + message)
      this.source.cancel(message)
    }
  }

  isCancelError (error) {
    return axios.isCancel(error)
  }
}

const Api = {
  install (Vue) {
    const api = new ApiService()
    Vue.prototype.$api = api
    Vue.api = api
  }
}

export default Api
