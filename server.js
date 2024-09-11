const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
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
  console.log('Broadcasting new question:', currentQuestion);
  io.emit('newQuestion', { question: currentQuestion, userCount: users.size });
}

io.on('connection', (socket) => {
  users.add(socket.id);
  console.log('New user connected:', socket.id);

  socket.emit('currentState', { 
    question: currentQuestion, 
    commonAnswer: getMostCommonAnswer(),
    userCount: users.size,
    totalAnswers: answers.length
  });

  io.emit('updateUserCount', { userCount: users.size });

  socket.on('submitAnswer', (answer) => {
    console.log('Received answer:', answer);
    answers.push(answer);
    const commonAnswer = getMostCommonAnswer();
    io.emit('updateCommonAnswer', { 
      commonAnswer, 
      userCount: users.size, 
      totalAnswers: answers.length 
    });
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
    console.log('User disconnected:', socket.id);
    io.emit('updateUserCount', { userCount: users.size });
  });
});

// Broadcast a question immediately when the server starts
broadcastQuestion();

// Then set up the interval for subsequent questions
setInterval(broadcastQuestion, 30000);

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});