import React, { useState, useEffect } from 'react'
import { eventService } from '../services/eventService'
import EventChat from './EventChat'

function Events({ user }) {
  console.log('Events component rendered with user:', user?.name);
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [chatEventId, setChatEventId] = useState(null)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      console.log('Loading events...');
      setLoading(true)
      setError('')
      const eventsData = await eventService.getEvents()
      console.log('Events loaded:', eventsData);
      
      // Assicuriamoci che sia sempre un array
      const eventsArray = Array.isArray(eventsData) ? eventsData : []
      setEvents(eventsArray)
    } catch (err) {
      console.error('Error loading events:', err);
      setError(err.message)
      setEvents([]) // Fallback a array vuoto
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId) => {
    try {
      await eventService.registerForEvent(eventId)
      await loadEvents() // Ricarica gli eventi
    } catch (err) {
      alert(err.message)
    }
  }

  const handleUnregister = async (eventId) => {
    try {
      await eventService.unregisterFromEvent(eventId)
      await loadEvents() // Ricarica gli eventi
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEventCreated = (newEvent) => {
    setEvents(prev => [newEvent, ...prev])
    setShowCreateModal(false)
  }

  if (loading) {
    return <div className="loading">Caricamento eventi...</div>
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="error">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Eventi</h1>
        <button 
          className="btn" 
          onClick={() => setShowCreateModal(true)}
        >
          Crea Evento
        </button>
      </div>

      {events.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center' }}>Nessun evento disponibile</p>
        </div>
      ) : (
        <div className="grid">
          {events.map(event => (
            <EventCard 
              key={event._id} 
              event={event} 
              user={user}
              onRegister={handleRegister}
              onUnregister={handleUnregister}
              onOpenChat={setChatEventId}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateEventModal 
          onClose={() => setShowCreateModal(false)} 
          onEventCreated={handleEventCreated}
        />
      )}

      {/* Event Chat */}
      <EventChat 
        eventId={chatEventId}
        user={user}
        isOpen={!!chatEventId}
        onClose={() => setChatEventId(null)}
      />
    </div>
  )
}

function EventCard({ event, user, onRegister, onUnregister, onOpenChat }) {
  const isRegistered = event.participants?.some(participant => 
    (typeof participant === 'string' ? participant : participant._id) === user?._id
  )
  const isOwner = event.creator === user?._id || event.creator?._id === user?._id

  return (
    <div className="card">
      {/* Event image */}
      {event.image ? (
        <div style={{ width: '100%', height: '160px', overflow: 'hidden', borderRadius: '6px', marginBottom: '12px' }}>
          <img
            src={event.image.startsWith('http') ? event.image : `${window.location.protocol}//${window.location.hostname}:3000${event.image}`}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      ) : null}

      <h3>{event.title}</h3>
      <p><strong>Categoria:</strong> {event.category}</p>
      <p><strong>Data:</strong> {new Date(event.date).toLocaleDateString()}</p>
      <p><strong>Luogo:</strong> {event.location}</p>
      <p style={{ margin: '10px 0' }}>{event.description}</p>
      <p><strong>Posti:</strong> {event.participants?.length || 0}/{event.capacity}</p>
      
      <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Pulsanti di partecipazione */}
        {!isOwner && (
          <>
            {isRegistered ? (
              <button 
                className="btn btn-danger" 
                onClick={() => onUnregister(event._id)}
              >
                Annulla Iscrizione
              </button>
            ) : (
              <button 
                className="btn" 
                onClick={() => onRegister(event._id)}
                disabled={event.participants?.length >= event.capacity}
              >
                {event.participants?.length >= event.capacity ? 'Completo' : 'Iscriviti'}
              </button>
            )}
          </>
        )}
        
        {/* Pulsante Chat - sempre visibile */}
        <button 
          className="btn"
          onClick={() => onOpenChat(event._id)}
          style={{
            background: '#28a745',
            borderColor: '#28a745',
            fontSize: '14px',
            padding: '6px 12px'
          }}
          title={!isRegistered && !isOwner ? "Iscriviti per partecipare alla chat" : "Apri chat evento"}
        >
          💬 Chat
        </button>
        
        {/* Indicatore proprietario */}
        {isOwner && (
          <span style={{ 
            background: '#e9ecef', 
            padding: '5px 10px', 
            borderRadius: '4px', 
            fontSize: '0.9rem',
            color: '#495057'
          }}>
            Tuo evento
          </span>
        )}
      </div>
    </div>
  )
}

function CreateEventModal({ onClose, onEventCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: 'technology',
    capacity: '',
    image: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState(null)

  const handleChange = (e) => {
    const { name, value, files, type } = e.target
    if (type === 'file') {
      const file = files[0] || null
      setFormData({ ...formData, [name]: file })
      
      // Create image preview
      if (file) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreview(reader.result)
        }
        reader.readAsDataURL(file)
      } else {
        setImagePreview(null)
      }
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await eventService.createEvent(formData)
      onEventCreated(result.data || result)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Crea Nuovo Evento</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
            ×
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Titolo</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descrizione</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Data</label>
            <input
              type="datetime-local"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Luogo</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Categoria</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="technology">Tecnologia</option>
              <option value="music">Musica</option>
              <option value="sports">Sport</option>
              <option value="art">Arte</option>
              <option value="food">Cibo</option>
              <option value="education">Educazione</option>
              <option value="business">Business</option>
              <option value="other">Altro</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="capacity">Numero massimo partecipanti</label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Foto evento (opzionale)</label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleChange}
            />
            
            {/* Image Preview */}
            {imagePreview && (
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>Anteprima:</p>
                <div style={{ 
                  width: '100%', 
                  maxWidth: '300px', 
                  height: '200px', 
                  margin: '0 auto',
                  border: '2px solid #ddd', 
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annulla
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Creazione...' : 'Crea Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Events