import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import App from '@/App.jsx'
import '@/index.css'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

ReactDOM.createRoot(document.getElementById('root')).render(
  publishableKey ? (
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  ) : (
    <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
      <h1>Authentication setup required</h1>
      <p>Set VITE_CLERK_PUBLISHABLE_KEY in .env.local to enable UA student sign-in.</p>
    </div>
  )
)
