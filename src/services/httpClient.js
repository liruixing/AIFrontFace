class HttpClient {
  constructor() {
    this.defaultHeaders = {
      Accept: 'application/json',
    }
  }

  async get(path, options = {}) {
    const url = this.buildUrl(path)
    console.log('[HttpClient.get] request url:', url)

    const response = await fetch(url, {
      ...options,
      method: 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    })

    console.log('[HttpClient.get] response:', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    console.log('[HttpClient.get] response data:', data)
    return data
  }

  async post(path, body, options = {}) {
    const url = this.buildUrl(path)
    console.log('[HttpClient.post] request url:', url)
    console.log('[HttpClient.post] request body:', body)

    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers: {
        ...this.defaultHeaders,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
    })

    console.log('[HttpClient.post] response:', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    console.log('[HttpClient.post] response data:', data)
    return data
  }

  getAgentModels() {
    return this.get('/agents/models')
  }

  sendMessage({ question, modelIndex }) {
    return this.post('/agents/chat', {
      question,
      model_index: modelIndex,
    })
  }

  buildUrl(path) {
    const apiBaseUrl = this.getApiBaseUrl()
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${apiBaseUrl}${normalizedPath}`
  }

  getApiBaseUrl() {
    const envBaseUrl = import.meta.env.VITE_API_BASE_URL
    const envPort = import.meta.env.VITE_API_PORT
    console.log('[HttpClient.getApiBaseUrl] env config:', {
      VITE_API_BASE_URL: envBaseUrl,
      VITE_API_PORT: envPort,
    })

    if (import.meta.env.DEV) {
      console.log('[HttpClient.getApiBaseUrl] use Vite dev proxy base url:', '')
      return ''
    }

    if (envBaseUrl && envPort) {
      const apiBaseUrl = `${envBaseUrl}:${envPort}`
      console.log('[HttpClient.getApiBaseUrl] use env base url with port:', apiBaseUrl)
      return apiBaseUrl
    }

    if (envBaseUrl) {
      console.log('[HttpClient.getApiBaseUrl] use env base url:', envBaseUrl)
      return envBaseUrl
    }

    const { protocol, hostname, port } = window.location
    console.log('[HttpClient.getApiBaseUrl] window location:', {
      protocol,
      hostname,
      port,
      href: window.location.href,
    })

    const apiBaseUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`
    console.log('[HttpClient.getApiBaseUrl] use window location base url:', apiBaseUrl)
    return apiBaseUrl
  }
}

export const httpClient = new HttpClient()
export default HttpClient
