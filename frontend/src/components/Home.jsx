import React from 'react'

function Home({ setCurrentPage, user }) {
  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '20px', color: '#333' }}>
          Benvenuto su EventHub
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '30px' }}>
          La piattaforma completa per gestire e partecipare agli eventi
        </p>
        
        {!user && (
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <button 
              className="btn" 
              onClick={() => setCurrentPage('login')}
              style={{ fontSize: '1.1rem', padding: '15px 30px' }}
            >
              Accedi
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setCurrentPage('register')}
              style={{ fontSize: '1.1rem', padding: '15px 30px' }}
            >
              Registrati
            </button>
          </div>
        )}
        
        {user && (
          <button 
            className="btn" 
            onClick={() => setCurrentPage('events')}
            style={{ fontSize: '1.1rem', padding: '15px 30px' }}
          >
            Vai agli Eventi
          </button>
        )}
      </div>
    </div>
  )
}

export default Home