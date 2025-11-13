import React, { useState, useEffect } from 'react'
import { authService } from '../services/authService'

function Admin() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRegistrations: 0
  })
  const [users, setUsers] = useState([])
  const [events, setEvents] = useState([])
  const [activeTab, setActiveTab] = useState('stats')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAdminData()
  }, [])

  const handleBlockUser = async (userId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Errore durante il blocco/sblocco utente')
      }

      await loadAdminData()
    } catch (err) {
      console.error('Errore:', err)
      alert('Errore durante il blocco/sblocco utente')
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Sei sicuro di voler eliminare questo evento?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione dell\'evento')
      }

      await loadAdminData()
    } catch (err) {
      console.error('Errore:', err)
      alert('Errore durante l\'eliminazione dell\'evento')
    }
  }

  const loadAdminData = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const [usersRes, eventsRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/events', { headers })
      ])

      if (!usersRes.ok || !eventsRes.ok) {
        throw new Error('Errore nel caricamento dei dati')
      }

      const usersData = await usersRes.json()
      const eventsData = await eventsRes.json()

      setUsers(usersData.data)
      setEvents(eventsData.data)

      const totalRegistrations = eventsData.data.reduce((acc, event) => 
        acc + (event.registrations?.length || 0), 0
      )

      setStats({
        totalUsers: usersData.count,
        totalEvents: eventsData.count,
        totalRegistrations
      })
      
    } catch (err) {
      console.error('Errore nel caricamento dati admin:', err)
      alert('Errore nel caricamento dei dati admin')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Caricamento pannello admin...</div>
  }

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <h1>Pannello Amministratore</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <button 
          className={`btn ${activeTab === 'stats' ? '' : 'btn-secondary'}`}
          onClick={() => setActiveTab('stats')}
          style={{ marginRight: '10px' }}
        >
          Statistiche
        </button>
        <button 
          className={`btn ${activeTab === 'users' ? '' : 'btn-secondary'}`}
          onClick={() => setActiveTab('users')}
          style={{ marginRight: '10px' }}
        >
          Utenti
        </button>
        <button 
          className={`btn ${activeTab === 'events' ? '' : 'btn-secondary'}`}
          onClick={() => setActiveTab('events')}
        >
          Eventi
        </button>
      </div>

      {activeTab === 'stats' && (
        <div className="grid">
          <div className="card">
            <h3>👥 Utenti Totali</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#007bff' }}>
              {stats.totalUsers}
            </p>
          </div>
          
          <div className="card">
            <h3>📅 Eventi Totali</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
              {stats.totalEvents}
            </p>
          </div>
          
          <div className="card">
            <h3>🎟️ Registrazioni Totali</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
              {stats.totalRegistrations}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <h2>Gestione Utenti</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Nome</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Ruolo</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{user.name}</td>
                    <td style={{ padding: '10px' }}>{user.email}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        backgroundColor: user.role === 'admin' ? '#007bff' : '#6c757d',
                        color: 'white',
                        fontSize: '0.8rem'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      {user.role !== 'admin' && (
                        <button 
                          className="btn btn-danger" 
                          style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                          onClick={() => handleBlockUser(user._id)}
                        >
                          {user.isBlocked ? 'Sblocca' : 'Blocca'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="card">
          <h2>Gestione Eventi</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Titolo</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Organizzatore</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Registrazioni</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{event.title}</td>
                    <td style={{ padding: '10px' }}>{event.creator?.name || 'N/A'}</td>
                    <td style={{ padding: '10px' }}>{event.registrations?.length || 0}</td>
                    <td style={{ padding: '10px' }}>
                      <button 
                        className="btn btn-danger" 
                        style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                        onClick={() => handleDeleteEvent(event._id)}
                      >
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin