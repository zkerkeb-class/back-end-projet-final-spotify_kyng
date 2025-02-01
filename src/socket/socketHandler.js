const roomService = require('../services/roomService');

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join-room', async (roomId, userId) => {
            try {
                await roomService.getRoom(roomId);
                await roomService.joinRoom(roomId, userId);
                socket.join(roomId);

                // Récupérer l’état actuel de lecture
                const state = await roomService.getPlaybackState(roomId);
                const participants = await roomService.getParticipants(roomId);

                socket.emit('room-state', { state, participants });
                io.to(roomId).emit('user-joined', userId);

                console.log(`User ${userId} joined room ${roomId}`);
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('play', async (roomId) => {
            await roomService.setPlaybackState(roomId, { play_state: 'playing' });
            io.to(roomId).emit('play');
        });

        socket.on('pause', async (roomId) => {
            await roomService.setPlaybackState(roomId, { play_state: 'paused' });
            io.to(roomId).emit('pause');
        });

        socket.on('seek', async (roomId, position) => {
            await roomService.setPlaybackState(roomId, { position });
            io.to(roomId).emit('seek', position);
        });

        socket.on('leave-room', async (roomId, userId) => {
            try {
                await roomService.leaveRoom(roomId, userId);
                socket.leave(roomId);
                io.to(roomId).emit('user-left', userId);
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};

module.exports = socketHandler;
