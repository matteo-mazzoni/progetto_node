import { authService } from './authService'

const API_BASE_URL = '/api'

class EventService {
  async getEvents(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString()
    const url = `${API_BASE_URL}/events${queryParams ? `?${queryParams}` : ''}`
    
    const response = await fetch(url, {
      headers: authService.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Errore nel caricamento degli eventi')
    }

    const result = await response.json()
    console.log('Events API response:', result)
    
    // Restituisce l'array di eventi dal campo 'data'
    return result.data || []
  }

  async getEvent(id) {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      headers: authService.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Evento non trovato')
    }

    return await response.json()
  }

  async createEvent(eventData) {
    const formData = new FormData()
    
    Object.keys(eventData).forEach(key => {
      if (eventData[key] !== null && eventData[key] !== undefined) {
        formData.append(key, eventData[key])
      }
    })

    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || 'Errore nella creazione dell\'evento')
    }

    return await response.json()
  }

  async updateEvent(id, eventData) {
    const formData = new FormData()
    
    Object.keys(eventData).forEach(key => {
      if (eventData[key] !== null && eventData[key] !== undefined) {
        formData.append(key, eventData[key])
      }
    })

    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || 'Errore nell\'aggiornamento dell\'evento')
    }

    return await response.json()
  }

  async deleteEvent(id) {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'DELETE',
      headers: authService.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Errore nell\'eliminazione dell\'evento')
    }
  }

  async registerForEvent(id) {
    const response = await fetch(`${API_BASE_URL}/events/${id}/register`, {
      method: 'POST',
      headers: authService.getAuthHeaders()
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || 'Errore nella registrazione')
    }

    return await response.json()
  }

  async unregisterFromEvent(id) {
    const response = await fetch(`${API_BASE_URL}/events/${id}/unregister`, {
      method: 'DELETE',
      headers: authService.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Errore nella disiscrizione')
    }
  }

  async getMyEvents() {
    const response = await fetch(`${API_BASE_URL}/events/my/created`, {
      headers: authService.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Errore nel caricamento dei tuoi eventi')
    }

    const result = await response.json()
    return result.data || []
  }

  async getMyRegistrations() {
    const response = await fetch(`${API_BASE_URL}/events/my/registered`, {
      headers: authService.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Errore nel caricamento delle tue iscrizioni')
    }

    const result = await response.json()
    return result.data || []
  }
}

export const eventService = new EventService()