const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log("🔌 New client connected:", socket.id);

    socket.on('join', (room) => {
        const clients = io.sockets.adapter.rooms.get(room) || new Set();

        if (clients.size >= 2) {
            socket.emit('full', room);
        } else {
            socket.join(room);
            console.log(`✅ ${socket.id} joined room: ${room}`);

            if (clients.size === 1) {
                socket.to(room).emit('ready');
            }
        }
    });

    socket.on('offer', (data) => {
        socket.to(data.room).emit('offer', data.offer);
    });

    socket.on('answer', (data) => {
        socket.to(data.room).emit('answer', data.answer);
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.room).emit('ice-candidate', data.candidate);
    });
});

//server.listen(3000, () => console.log("🚀 Server on http://localhost:3000"));

server.listen(3000);

/*server.listen(3000, '192.168.98.40', () => {
    console.log("Server running on http://192.168.98.40:3000 or your IP address");
  });*/
  