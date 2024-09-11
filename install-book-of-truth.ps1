# Book of Truth Installer and Updater

$repoUrl = "https://github.com/yourusername/book-of-truth.git"
$installDir = "$env:USERPROFILE\BookOfTruth"

function Install-BookOfTruth {
    if (Test-Path $installDir) {
        Write-Host "Book of Truth is already installed. Use the update option to get the latest version."
        return
    }

    Write-Host "Installing Book of Truth..."
    
    # Clone the repository
    git clone $repoUrl $installDir

    # Navigate to the installation directory
    Set-Location $installDir

    # Install dependencies
    npm install

    Write-Host "Book of Truth has been successfully installed!"
}

function Update-BookOfTruth {
    if (-not (Test-Path $installDir)) {
        Write-Host "Book of Truth is not installed. Please use the install option first."
        return
    }

    Write-Host "Updating Book of Truth..."

    # Navigate to the installation directory
    Set-Location $installDir

    # Fetch the latest changes
    git fetch origin main

    # Check if there are any updates
    $status = git status -uno
    if ($status -match "Your branch is up to date") {
        Write-Host "Book of Truth is already up to date."
        return
    }

    # Pull the latest changes
    git pull origin main

    # Install any new dependencies
    npm install
# Setup script for Book of Truth

# Create a new Next.js app
npx create-next-app@latest book-of-truth --typescript --eslint --tailwind --app --src-dir --import-alias "@/*"

# Navigate into the project directory
Set-Location -Path ".\book-of-truth"

# Install additional dependencies
npm install express socket.io socket.io-client

# Create server.js file
$serverContent = @"
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const questions = [
  "What is the meaning of life?",
  "Is there free will?",
  "What happens after death?",
  "Are we alone in the universe?",
  "What is the nature of consciousness?",
];

let currentQuestion = '';
let answers = [];
let users = new Set();

function getRandomQuestion() {
  return questions[Math.floor(Math.random() * questions.length)];
}

function getMostCommonAnswer() {
  if (answers.length === 0) return '';
  const answerCounts = answers.reduce((acc, answer) => {
    acc[answer] = (acc[answer] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(answerCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
}

function broadcastQuestion() {
  currentQuestion = getRandomQuestion();
  answers = [];
  io.emit('newQuestion', { question: currentQuestion, userCount: users.size });
}

io.on('connection', (socket) => {
  users.add(socket.id);
  console.log('New user connected:', socket.id);

  socket.emit('currentState', { 
    question: currentQuestion, 
    commonAnswer: getMostCommonAnswer(),
    userCount: users.size
  });

  socket.on('submitAnswer', (answer) => {
    answers.push(answer);
    const commonAnswer = getMostCommonAnswer();
    io.emit('updateCommonAnswer', { commonAnswer, userCount: users.size });
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
    console.log('User disconnected:', socket.id);
    io.emit('updateUserCount', { userCount: users.size });
  });
});

setInterval(broadcastQuestion, 30000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  broadcastQuestion();
});
"@

Set-Content -Path "server.js" -Value $serverContent

# Update package.json
$packageJson = Get-Content -Path "package.json" -Raw | ConvertFrom-Json
$packageJson.scripts | Add-Member -Name "server" -Value "node server.js" -MemberType NoteProperty
$packageJson | ConvertTo-Json -Depth 100 | Set-Content -Path "package.json"

# Create the main component file
$mainComponentContent = @"
'use client'

import { useState, useEffect } from 'react'
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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-md bg-white p-6 rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold mb-4 text-center">Book of Truth</h1>
          <p className="text-lg font-semibold mb-4 text-center">{currentQuestion || "Waiting for the next question..."}</p>
          {commonAnswer && (
            <p className="text-md mb-4 text-center">Most common answer: <span className="font-bold">{commonAnswer}</span></p>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Your answer"
              className="flex-grow p-2 border rounded"
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
          </form>
        </div>
      </div>
    </div>
  )
}
"@

Set-Content -Path ".\src\app\page.tsx" -Value $mainComponentContent

# Update layout.tsx
$layoutContent = @"
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Book of Truth',
  description: 'A real-time interactive web application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
"@

Set-Content -Path ".\src\app\layout.tsx" -Value $layoutContent

Write-Host "Setup complete! Your Book of Truth project is ready."
Write-Host "To start the application:"
Write-Host "1. Open two terminal windows"
Write-Host "2. In the first terminal, run: npm run dev"
Write-Host "3. In the second terminal, run: npm run server"
Write-Host "4. Open your browser and go to http://localhost:3000"