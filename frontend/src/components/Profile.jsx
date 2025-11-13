import React, { useState, useEffect } from 'react'
import { eventService } from '../services/eventService'

function Profile({ user }) {
  const [myEvents, setMyEvents] = useState([])
  const [myRegistrations, setMyRegistrations] = useState([])
  const [loading, setLoading] = useState(false)
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
      console.log('Registered events:', registeredEvents)
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
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e0e7ff' }}>
        <button 
          className="btn btn-secondary"
          onClick={() => setActiveTab('info')}
          style={{
            marginRight: '10px',
            marginBottom: '10px',
            opacity: activeTab === 'info' ? 1 : 0.6
          }}
        >
          Informazioni
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => setActiveTab('created')}
          style={{
            marginRight: '10px',
            marginBottom: '10px',
            opacity: activeTab === 'created' ? 1 : 0.6
          }}
        >
          Miei Eventi ({myEvents.length})
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => setActiveTab('registered')}
          style={{
            marginBottom: '10px',
            opacity: activeTab === 'registered' ? 1 : 0.6
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
            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              Non hai ancora creato nessun evento.
            </p>
          ) : (
            <div className="events-list">
              {myEvents.map(event => (
                <div key={event._id} className="card" style={{ marginBottom: '15px' }}>
                  <h3 style={{ color: '#1e40af', marginBottom: '10px' }}>{event.title}</h3>
                  <p><strong>Categoria:</strong> {event.category}</p>
                  <p><strong>Data:</strong> {new Date(event.date).toLocaleDateString()}</p>
                  <p><strong>Luogo:</strong> {event.location}</p>
                  <p><strong>Partecipanti:</strong> {event.participants?.length || 0}/{event.capacity}</p>
                  <p style={{ marginTop: '10px' }}>{event.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'registered' && (
        <div className="card" style={{ minHeight: '200px' }}>
          <h2 style={{ marginBottom: '20px' }}>Le Mie Iscrizioni</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px' }}>
              Caricamento...
            </div>
          ) : myRegistrations.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '40px', fontSize: '16px' }}>
              Non sei iscritto a nessun evento.
            </p>
          ) : (
            <div className="events-list">
              {myRegistrations.map(event => event && (
                <div key={event._id} className="card" style={{ 
                  marginBottom: '15px',
                  backgroundColor: 'rgba(191, 219, 254, 0.2)'
                }}>
                  <h3 style={{ color: '#1e40af', marginBottom: '10px' }}>{event.title}</h3>
                  <p><strong>Categoria:</strong> {event.category}</p>
                  <p><strong>Data:</strong> {new Date(event.date).toLocaleDateString()}</p>
                  <p><strong>Luogo:</strong> {event.location}</p>
                  <p><strong>Organizzatore:</strong> {event.creator?.name || 'N/A'}</p>
                  <p><strong>Partecipanti:</strong> {event.participants?.length || 0}/{event.capacity}</p>
                  <p style={{ marginTop: '10px' }}>{event.description}</p>
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