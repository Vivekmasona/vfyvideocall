
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const activeUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomID) => {
        socket.join(roomID);
        activeUsers.set(socket.id, roomID);
        console.log(`User ${socket.id} joined room: ${roomID}`);
    });

    socket.on('call-request', ({ roomID }) => {
        socket.to(roomID).emit('incoming-call', { from: socket.id });
    });

    socket.on('call-accepted', ({ to }) => {
        io.to(to).emit('call-accepted');
    });

    socket.on('call-rejected', ({ to }) => {
        io.to(to).emit('call-rejected');
    });

    socket.on('offer', ({ offer, roomID }) => {
        socket.to(roomID).emit('offer', { offer, from: socket.id });
    });

    socket.on('answer', ({ answer, roomID }) => {
        socket.to(roomID).emit('answer', { answer, from: socket.id });
    });

    socket.on('candidate', ({ candidate, roomID }) => {
        socket.to(roomID).emit('candidate', { candidate });
    });

    socket.on('end-call', (roomID) => {
        socket.to(roomID).emit('call-ended');
    });

    socket.on('disconnect', () => {
        const roomID = activeUsers.get(socket.id);
        if (roomID) {
            socket.to(roomID).emit('call-ended');
        }
        activeUsers.delete(socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
