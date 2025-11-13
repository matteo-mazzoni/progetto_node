import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import Events from './components/Events'
import Profile from './components/Profile'
import Admin from './components/Admin'
import { authService } from './services/authService'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    if (token) {
      authService.getCurrentUser()
        .then(userData => {
          setUser(userData)
        })
        .catch(() => {
          localStorage.removeItem('token')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (userData) => {
    console.log('Login successful, user data:', userData);
    setUser(userData)
    console.log('Setting page to events');
    setCurrentPage('events')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setCurrentPage('home')
  }

  const renderPage = () => {
    console.log('Rendering page:', currentPage, 'User:', user?.name);
    try {
      switch (currentPage) {
        case 'home':
          return <Home setCurrentPage={setCurrentPage} user={user} />
        case 'login':
          return <Login setCurrentPage={setCurrentPage} onLogin={handleLogin} />
        case 'register':
          return <Register setCurrentPage={setCurrentPage} onLogin={handleLogin} />
        case 'events':
          return <Events user={user} />
        case 'profile':
          return <Profile user={user} setUser={setUser} />
        case 'admin':
          return user?.role === 'admin' ? <Admin /> : <Events user={user} />
        default:
          return <Home setCurrentPage={setCurrentPage} user={user} />
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      return (
        <div className="container" style={{ paddingTop: '40px' }}>
          <div className="error">
            Errore nel caricamento della pagina: {error.message}
            <br />
            <button onClick={() => setCurrentPage('home')} className="btn">
              Torna alla Home
            </button>
          </div>
        </div>
      );
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <h2>Caricamento...</h2>
      </div>
    )
  }

  return (
    <div className="App">
      <Navbar 
        user={user} 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      />
      <main>
        {renderPage()}
      </main>
    </div>
  )
}

export default App