'use client'

import { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'

let socket;

if (typeof window !== 'undefined') {
  socket = io('http://localhost:3002', {
    withCredentials: true,
    transports: ['websocket', 'polling']
  });
}

export default function BookOfTruth() {
  const [nickname, setNickname] = useState('')
  const [isNicknameSet, setIsNicknameSet] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [userAnswer, setUserAnswer] = useState('')
  const [commonAnswer, setCommonAnswer] = useState('')
  const [userCount, setUserCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [totalAnswers, setTotalAnswers] = useState(0)
  const [newUser, setNewUser] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [leaderboard, setLeaderboard] = useState([])
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      console.log('Connected to server')
      setConnectionStatus('Connected')
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from server')
      setConnectionStatus('Disconnected')
    })

    socket.on('currentState', (state) => {
      console.log('Received current state:', state)
      setCurrentQuestion(state.question)
      setCommonAnswer(state.commonAnswer)
      setUserCount(state.userCount)
      setTotalAnswers(state.totalAnswers)
      setLeaderboard(state.leaderboard)
    })

    socket.on('newQuestion', (data) => {
      console.log('Received new question:', data)
      setCurrentQuestion(data.question)
      setCommonAnswer('')
      setUserCount(data.userCount)
      setTotalAnswers(0)
      setTimeLeft(30)
    })

    socket.on('updateCommonAnswer', (data) => {
      console.log('Received update:', data)
      setCommonAnswer(data.commonAnswer)
      setUserCount(data.userCount)
      setTotalAnswers(data.totalAnswers)
      setLeaderboard(data.leaderboard)
    })

    socket.on('updateUserCount', (data) => {
      console.log('User count updated:', data)
      setUserCount(data.userCount)
      setNewUser(true)
      setTimeout(() => setNewUser(false), 1000)
    })

    socket.on('userTyping', ({ nickname, isTyping }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev)
        if (isTyping) {
          newSet.add(nickname)
        } else {
          newSet.delete(nickname)
        }
        return newSet
      })
    })

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 0))
    }, 1000)

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('currentState')
      socket.off('newQuestion')
      socket.off('updateCommonAnswer')
      socket.off('updateUserCount')
      socket.off('userTyping')
      clearInterval(timer)
    }
  }, [])

  const handleNicknameSubmit = (e) => {
    e.preventDefault()
    if (nickname.trim()) {
      socket.emit('setNickname', nickname)
      setIsNicknameSet(true)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (userAnswer.trim() && socket) {
      console.log('Submitting answer:', userAnswer)
      socket.emit('submitAnswer', userAnswer)
      setUserAnswer('')
    }
  }

  const handleTyping = () => {
    socket.emit('typing', true)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', false)
    }, 1000)
  }

  if (!isNicknameSet) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <form onSubmit={handleNicknameSubmit} className="bg-white p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Enter your nickname</h2>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            placeholder="Your nickname"
          />
          <button type="submit" className="w-full bg-blue-500 text-white px-4 py-2 rounded">
            Join
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl aspect-square">
        {[...Array(userCount)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-8 h-8 bg-white rounded-full shadow-lg transition-all duration-500 ${
              newUser ? 'animate-ping' : ''
            }`}
            style={{
              top: `${50 + 45 * Math.sin(2 * Math.PI * i / userCount)}%`,
              left: `${50 + 45 * Math.cos(2 * Math.PI * i / userCount)}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-md bg-white p-6 rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold mb-4 text-center">Book of Truth</h1>
          <p className="text-sm mb-2 text-center text-gray-500">Status: {connectionStatus}</p>
          <p className="text-sm mb-2 text-center text-gray-500">Welcome, {nickname}!</p>
          <p className="text-lg font-semibold mb-2 text-center">{currentQuestion || "Waiting for the next question..."}</p>
          <p className="text-sm mb-4 text-center text-gray-500">Next question in: {timeLeft} seconds</p>
          {commonAnswer && (
            <p className="text-md mb-2 text-center">Most common answer: <span className="font-bold">{commonAnswer}</span></p>
          )}
          <p className="text-sm mb-4 text-center text-gray-500">Total answers: {totalAnswers}</p>
          {typingUsers.size > 0 && (
            <p className="text-sm mb-2 text-center text-gray-500">
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </p>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleTyping}
              placeholder="Your answer"
              className="flex-grow p-2 border rounded"
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
          </form>
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Leaderboard</h3>
            <ul>
              {leaderboard.map((user, index) => (
                <li key={index} className="text-sm">
                  {user.nickname}: {user.score} answers
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}