'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import io from 'socket.io-client'

const socket = io('http://localhost:3001')

export default function BookOfTruth() {
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [userAnswer, setUserAnswer] = useState('')
  const [commonAnswer, setCommonAnswer] = useState('')
  const [userCount, setUserCount] = useState(0)

  useEffect(() => {
    socket.on('currentState', ({ question, commonAnswer, userCount }) => {
      setCurrentQuestion(question)
      setCommonAnswer(commonAnswer)
      setUserCount(userCount)
    })

    socket.on('newQuestion', ({ question, userCount }) => {
      setCurrentQuestion(question)
      setCommonAnswer('')
      setUserCount(userCount)
    })

    socket.on('updateCommonAnswer', ({ commonAnswer, userCount }) => {
      setCommonAnswer(commonAnswer)
      setUserCount(userCount)
    })

    socket.on('updateUserCount', ({ userCount }) => {
      setUserCount(userCount)
    })

    return () => {
      socket.off('currentState')
      socket.off('newQuestion')
      socket.off('updateCommonAnswer')
      socket.off('updateUserCount')
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userAnswer.trim()) {
      socket.emit('submitAnswer', userAnswer)
      setUserAnswer('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl aspect-square">
        {[...Array(userCount)].map((_, i) => (
          <div
            key={i}
            className="absolute w-8 h-8 bg-white rounded-full shadow-lg"
            style={{
              top: `${50 + 45 * Math.sin(2 * Math.PI * i / userCount)}%`,
              left: `${50 + 45 * Math.cos(2 * Math.PI * i / userCount)}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
        <Card className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Book of Truth</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold mb-4 text-center">{currentQuestion || "Waiting for the next question..."}</p>
            {commonAnswer && (
              <p className="text-md mb-4 text-center">Most common answer: <span className="font-bold">{commonAnswer}</span></p>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Your answer"
                className="flex-grow"
              />
              <Button type="submit">Submit</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}