import React from 'react'

function Navbar({ user, currentPage, setCurrentPage, onLogout }) {
  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <div className="nav-brand">
            EventHub
          </div>
          
          <div className="nav-links">
            <button 
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentPage('home')}
            >
              Home
            </button>
            
            {user ? (
              <>
                <button 
                  className={`nav-link ${currentPage === 'events' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('events')}
                >
                  Eventi
                </button>
                
                <button 
                  className={`nav-link ${currentPage === 'profile' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('profile')}
                >
                  Profilo
                </button>
                
                {user.role === 'admin' && (
                  <button 
                    className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`}
                    onClick={() => setCurrentPage('admin')}
                  >
                    Admin
                  </button>
                )}
                
                <div style={{ marginLeft: '20px' }}>
                  <span style={{ marginRight: '10px' }}>Ciao, {user.name}!</span>
                  <button className="btn btn-secondary" onClick={onLogout}>
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <button 
                  className={`nav-link ${currentPage === 'login' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('login')}
                >
                  Login
                </button>
                
                <button 
                  className={`nav-link ${currentPage === 'register' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('register')}
                >
                  Registrati
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar