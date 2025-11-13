import React, { useState, useEffect, useRef } from 'react'

function EventChat({ eventId, user, isOpen, onClose }) {
  const [ws, setWs] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [connected, setConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [typing, setTyping] = useState([])
  const [isReadOnly, setIsReadOnly] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    if (isOpen && eventId && user) {
      connectToChat()
    }

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [isOpen, eventId, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const connectToChat = () => {
    try {
      const token = localStorage.getItem('token')
      console.log('EventChat: Starting connection, token:', token ? 'present' : 'missing')
      if (!token) {
        console.error('EventChat: No token found')
        return
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      // In sviluppo, connettiti direttamente al backend
      const wsUrl = `${protocol}//localhost:3000`
      console.log('EventChat: Connecting to WebSocket:', wsUrl)
      const websocket = new WebSocket(wsUrl)

      websocket.onopen = () => {
        console.log('EventChat: WebSocket connected successfully!')
        // Authenticate
        websocket.send(JSON.stringify({
          type: 'auth',
          payload: { token }
        }))
        console.log('EventChat: Auth message sent')
      }

      websocket.onmessage = (event) => {
        try {
          console.log('EventChat: Received message:', event.data)
          const data = JSON.parse(event.data)
          
          // Handle messages directly here to have access to websocket
          const { type, payload } = data
          console.log('EventChat: Handling message type:', type, 'payload:', payload)

          switch (type) {
            case 'auth_success':
              console.log('EventChat: Authentication successful')
              setConnected(true)
              // Join the event room using the websocket reference directly
              console.log('EventChat: Joining event room:', eventId)
              websocket.send(JSON.stringify({
                type: 'join_event',
                payload: { eventId }
              }))
              break

            case 'joined_event':
              console.log('EventChat: Joined event chat successfully')
              setMessages(payload.messages || [])
              setIsReadOnly(payload.isReadOnly || false)
              console.log('EventChat: Read-only mode:', payload.isReadOnly)
              break

            case 'new_message':
              if (payload.eventId === eventId) {
                setMessages(prev => [...prev, payload.message])
              }
              break

            case 'user_joined':
              if (payload.eventId === eventId) {
                setOnlineUsers(prev => {
                  if (!prev.find(u => u.userId === payload.userId)) {
                    return [...prev, { userId: payload.userId, userName: payload.userName }]
                  }
                  return prev
                })
              }
              break

            case 'user_left':
              if (payload.eventId === eventId) {
                setOnlineUsers(prev => prev.filter(u => u.userId !== payload.userId))
              }
              break

            case 'user_typing':
              if (payload.eventId === eventId && payload.userId !== user._id) {
                if (payload.isTyping) {
                  setTyping(prev => {
                    if (!prev.find(u => u.userId === payload.userId)) {
                      return [...prev, { userId: payload.userId, userName: payload.userName }]
                    }
                    return prev
                  })
                } else {
                  setTyping(prev => prev.filter(u => u.userId !== payload.userId))
                }
              }
              break

            case 'error':
              console.error('EventChat: WebSocket error:', payload.message)
              // Se l'errore è perché non sei iscritto, mostra un messaggio specifico
              if (payload.message === 'Not registered for this event') {
                setMessages([{
                  _id: 'system-message',
                  user: { name: 'Sistema', _id: 'system' },
                  content: '⚠️ Per partecipare alla chat devi prima iscriverti all\'evento!',
                  createdAt: new Date(),
                  type: 'system'
                }])
              }
              break

            default:
              console.log('EventChat: Unknown message type:', type)
          }
        } catch (error) {
          console.error('EventChat: Error parsing WebSocket message:', error)
        }
      }

      websocket.onclose = (event) => {
        console.log('EventChat: WebSocket disconnected, code:', event.code, 'reason:', event.reason)
        setConnected(false)
        setWs(null)
      }

      websocket.onerror = (error) => {
        console.error('EventChat: WebSocket error:', error)
        setConnected(false)
      }

      setWs(websocket)
    } catch (error) {
      console.error('Error connecting to WebSocket:', error)
    }
  }

  const handleWebSocketMessage = (data) => {
    console.log('EventChat: Handling message type:', data.type, 'payload:', data.payload)
    const { type, payload } = data

    switch (type) {
      case 'auth_success':
        console.log('EventChat: Authentication successful')
        setConnected(true)
        // Join the event room using the websocket reference directly
        if (websocket && websocket.readyState === WebSocket.OPEN) {
          console.log('EventChat: Joining event room:', eventId)
          websocket.send(JSON.stringify({
            type: 'join_event',
            payload: { eventId }
          }))
        } else {
          console.error('EventChat: WebSocket not ready for join_event')
        }
        break

      case 'joined_event':
        console.log('EventChat: Joined event chat successfully')
        setMessages(payload.messages || [])
        setIsReadOnly(payload.isReadOnly || false)
        console.log('EventChat: Read-only mode:', payload.isReadOnly)
        break

      case 'new_message':
        if (payload.eventId === eventId) {
          setMessages(prev => [...prev, payload.message])
        }
        break

      case 'user_joined':
        if (payload.eventId === eventId) {
          setOnlineUsers(prev => {
            if (!prev.find(u => u.userId === payload.userId)) {
              return [...prev, { userId: payload.userId, userName: payload.userName }]
            }
            return prev
          })
        }
        break

      case 'user_left':
        if (payload.eventId === eventId) {
          setOnlineUsers(prev => prev.filter(u => u.userId !== payload.userId))
        }
        break

      case 'user_typing':
        if (payload.eventId === eventId && payload.userId !== user._id) {
          if (payload.isTyping) {
            setTyping(prev => {
              if (!prev.find(u => u.userId === payload.userId)) {
                return [...prev, { userId: payload.userId, userName: payload.userName }]
              }
              return prev
            })
          } else {
            setTyping(prev => prev.filter(u => u.userId !== payload.userId))
          }
        }
        break

      case 'error':
        console.error('WebSocket error:', payload.message)
        // Se l'errore è perché non sei iscritto, mostra un messaggio specifico
        if (payload.message === 'Not registered for this event') {
          setMessages([{
            _id: 'system-message',
            user: { name: 'Sistema', _id: 'system' },
            content: '⚠️ Per partecipare alla chat devi prima iscriverti all\'evento!',
            createdAt: new Date(),
            type: 'system'
          }])
        }
        break

      default:
        console.log('Unknown message type:', type)
    }
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !ws || !connected || isReadOnly) return

    ws.send(JSON.stringify({
      type: 'chat_message',
      payload: {
        eventId,
        content: newMessage.trim()
      }
    }))

    setNewMessage('')
    stopTyping()
  }

  const handleTyping = (e) => {
    setNewMessage(e.target.value)

    if (ws && connected && !isReadOnly) {
      // Send typing indicator
      ws.send(JSON.stringify({
        type: 'typing',
        payload: {
          eventId,
          isTyping: true
        }
      }))

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(stopTyping, 2000)
    }
  }

  const stopTyping = () => {
    if (ws && connected) {
      ws.send(JSON.stringify({
        type: 'typing',
        payload: {
          eventId,
          isTyping: false
        }
      }))
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      height: '500px',
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000
    }}>
      {/* Header */}
      <div style={{
        padding: '15px',
        borderBottom: '1px solid #eee',
        background: '#007bff',
        color: 'white',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '16px' }}>
            Chat Evento {isReadOnly && '(Solo lettura)'}
          </h4>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            {connected ? (
              `${onlineUsers.length} utenti online`
            ) : (
              'Connessione...'
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0',
            width: '24px',
            height: '24px'
          }}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        padding: '10px',
        overflowY: 'auto',
        background: '#f8f9fa'
      }}>
        {messages.map((message, index) => (
          <div
            key={message._id || index}
            style={{
              marginBottom: '10px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: message.user._id === user._id ? '#007bff' : 'white',
              color: message.user._id === user._id ? 'white' : 'black',
              alignSelf: message.user._id === user._id ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              marginLeft: message.user._id === user._id ? 'auto' : '0',
              border: message.user._id !== user._id ? '1px solid #eee' : 'none'
            }}
          >
            {message.user._id !== user._id && (
              <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '4px',
                color: '#007bff'
              }}>
                {message.user.name}
              </div>
            )}
            <div style={{ wordBreak: 'break-word' }}>
              {message.content}
            </div>
            <div style={{
              fontSize: '11px',
              opacity: 0.7,
              marginTop: '4px',
              textAlign: 'right'
            }}>
              {formatTime(message.createdAt)}
            </div>
          </div>
        ))}
        
        {/* Typing indicators */}
        {typing.length > 0 && (
          <div style={{
            padding: '8px 12px',
            background: '#e9ecef',
            borderRadius: '8px',
            fontStyle: 'italic',
            fontSize: '14px',
            color: '#666'
          }}>
            {typing.map(t => t.userName).join(', ')} {typing.length === 1 ? 'sta' : 'stanno'} scrivendo...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '15px',
        borderTop: '1px solid #eee',
        background: 'white',
        borderRadius: '0 0 8px 8px'
      }}>
        {isReadOnly ? (
          <div style={{
            textAlign: 'center',
            padding: '10px',
            background: '#f8f9fa',
            borderRadius: '8px',
            color: '#666',
            fontSize: '14px'
          }}>
            🔒 Iscriviti all'evento per partecipare alla chat
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder={connected ? "Scrivi un messaggio..." : "Connessione in corso..."}
              disabled={!connected}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '20px',
                outline: 'none',
                fontSize: '14px'
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!connected || !newMessage.trim()}
              style={{
                padding: '8px 16px',
                background: connected && newMessage.trim() ? '#007bff' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                cursor: connected && newMessage.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Invia
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default EventChat