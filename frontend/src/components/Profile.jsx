import React, { useState, useEffect } from 'react'
import { eventService } from '../services/eventService'

function Profile({ user }) {
  const [myEvents, setMyEvents] = useState([])
  const [myRegistrations, setMyRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => {
    if (user) {
      loadUserEvents()
    }
  }, [user])

  const loadUserEvents = async () => {
    try {
      setLoading(true)
      const [createdEvents, registeredEvents] = await Promise.all([
        eventService.getMyEvents(),
        eventService.getMyRegistrations()
      ])
      setMyEvents(createdEvents)
      setMyRegistrations(registeredEvents)
    } catch (error) {
      console.error('Errore nel caricamento eventi:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="loading">Caricamento...</div>
  }

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <h1>Il Mio Profilo</h1>
      
      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button 
          className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'info' ? '#007bff' : 'transparent',
            color: activeTab === 'info' ? 'white' : '#007bff',
            cursor: 'pointer',
            marginRight: '10px',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Informazioni
        </button>
        <button 
          className={`tab-button ${activeTab === 'created' ? 'active' : ''}`}
          onClick={() => setActiveTab('created')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'created' ? '#007bff' : 'transparent',
            color: activeTab === 'created' ? 'white' : '#007bff',
            cursor: 'pointer',
            marginRight: '10px',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Miei Eventi ({myEvents.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'registered' ? 'active' : ''}`}
          onClick={() => setActiveTab('registered')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'registered' ? '#007bff' : 'transparent',
            color: activeTab === 'registered' ? 'white' : '#007bff',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Iscrizioni ({myRegistrations.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <>
          <div className="card">
            <h2>Informazioni Personali</h2>
            <p><strong>Nome:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Ruolo:</strong> {user.role}</p>
            <p><strong>Data Registrazione:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          
          <div className="card">
            <h2>Statistiche</h2>
            <p>📅 <strong>Eventi Creati:</strong> {myEvents.length}</p>
            <p>🎟️ <strong>Eventi Partecipati:</strong> {myRegistrations.length}</p>
          </div>
        </>
      )}

      {activeTab === 'created' && (
        <div className="card">
          <h2>I Miei Eventi</h2>
          {loading ? (
            <div className="loading">Caricamento...</div>
          ) : myEvents.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>
              Non hai ancora creato nessun evento.
            </p>
          ) : (
            <div className="events-list">
              {myEvents.map(event => (
                <div key={event._id} className="event-item" style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px',
                  background: '#f8f9fa'
                }}>
                  <h3>{event.title}</h3>
                  <p><strong>Categoria:</strong> {event.category}</p>
                  <p><strong>Data:</strong> {new Date(event.date).toLocaleDateString()}</p>
                  <p><strong>Luogo:</strong> {event.location}</p>
                  <p><strong>Partecipanti:</strong> {event.participants?.length || 0}/{event.capacity}</p>
                  <p>{event.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'registered' && (
        <div className="card">
          <h2>Le Mie Iscrizioni</h2>
          {loading ? (
            <div className="loading">Caricamento...</div>
          ) : myRegistrations.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>
              Non sei iscritto a nessun evento.
            </p>
          ) : (
            <div className="events-list">
              {myRegistrations.map(event => (
                <div key={event._id} className="event-item" style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px',
                  background: '#e8f4f8'
                }}>
                  <h3>{event.title}</h3>
                  <p><strong>Categoria:</strong> {event.category}</p>
                  <p><strong>Data:</strong> {new Date(event.date).toLocaleDateString()}</p>
                  <p><strong>Luogo:</strong> {event.location}</p>
                  <p><strong>Organizzatore:</strong> {event.creator?.name || 'N/A'}</p>
                  <p><strong>Partecipanti:</strong> {event.participants?.length || 0}/{event.capacity}</p>
                  <p>{event.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Profile