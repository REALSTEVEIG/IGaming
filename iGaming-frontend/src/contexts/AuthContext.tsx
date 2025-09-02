'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

interface User {
  id: string
  username: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string) => Promise<void>
  register: (username: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = () => {
      console.log('AuthContext useEffect: Starting token restoration...')
      const savedToken = localStorage.getItem('token')
      console.log('AuthContext useEffect: savedToken exists:', !!savedToken)
      
      if (savedToken) {
        try {
          console.log('AuthContext useEffect: Setting token and axios header')
          
          // Decode JWT to get user data
          const payload = JSON.parse(atob(savedToken.split('.')[1]))
          console.log('AuthContext useEffect: Decoded payload:', payload)
          
          // Check if token is expired
          const currentTime = Date.now() / 1000
          if (payload.exp && payload.exp < currentTime) {
            console.log('AuthContext useEffect: Token expired')
            localStorage.removeItem('token')
            delete axios.defaults.headers.common['Authorization']
            setToken(null)
            setUser(null)
          } else {
            // Token is valid
            setToken(savedToken)
            axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
            setUser({
              id: payload.sub,
              username: payload.username
            })
            console.log('AuthContext useEffect: User set successfully')
          }
        } catch (error) {
          console.error('AuthContext useEffect: Error decoding token:', error)
          // If token is invalid, remove it
          localStorage.removeItem('token')
          delete axios.defaults.headers.common['Authorization']
          setToken(null)
          setUser(null)
        }
      } else {
        console.log('AuthContext useEffect: No saved token found')
      }
      
      console.log('AuthContext useEffect: Setting loading to false')
      setLoading(false)
    }

    // Add a small delay to ensure localStorage is available
    const timer = setTimeout(initializeAuth, 100)
    return () => clearTimeout(timer)
  }, [])

  const login = async (username: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
      })
      
      const { accessToken, user: userData } = response.data
      setToken(accessToken)
      setUser(userData)
      localStorage.setItem('token', accessToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    } catch (error) {
      throw error
    }
  }

  const register = async (username: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        username,
      })
      
      const { accessToken, user: userData } = response.data
      setToken(accessToken)
      setUser(userData)
      localStorage.setItem('token', accessToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}