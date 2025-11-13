const API_BASE_URL = '/api'

class AuthService {
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const text = await response.text()
        let errorMessage = 'Login fallito'
        try {
          const errorData = JSON.parse(text)
          errorMessage = errorData.message || errorMessage
        } catch {
          errorMessage = text || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      localStorage.setItem('token', data.token)
      return data.user
    } catch (error) {
      if (error.message.includes('fetch')) {
        throw new Error('Errore di connessione al server')
      }
      throw error
    }
  }

  async register(name, email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password })
      })

      if (!response.ok) {
        const text = await response.text()
        let errorMessage = 'Registrazione fallita'
        try {
          const errorData = JSON.parse(text)
          errorMessage = errorData.message || errorMessage
        } catch {
          errorMessage = text || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      localStorage.setItem('token', data.token)
      return data.user
    } catch (error) {
      if (error.message.includes('fetch')) {
        throw new Error('Errore di connessione al server')
      }
      throw error
    }
  }

  async getCurrentUser() {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('Nessun token trovato')
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Token non valido')
    }

    const data = await response.json()
    return data.user
  }

  logout() {
    localStorage.removeItem('token')
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
}

export const authService = new AuthService()