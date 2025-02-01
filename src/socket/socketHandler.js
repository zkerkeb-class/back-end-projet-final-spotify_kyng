const roomService = require('../services/roomService');

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Rejoindre une salle (via une invitation ou manuellement)
        socket.on('join-room', async (roomId, userId) => {
            try {
                // Vérifier l'existence de la salle et ajouter l'utilisateur comme participant
                await roomService.getRoom(roomId);
                await roomService.joinRoom(roomId, userId);
                socket.join(roomId);

                // Récupérer l’état actuel de lecture et les participants
                const state = await roomService.getPlaybackState(roomId);
                const participants = await roomService.getParticipants(roomId);

                // Envoyer l'état de la salle et la liste des participants à l'utilisateur
                socket.emit('room-state', { state, participants });
                io.to(roomId).emit('user-joined', userId);

                console.log(`User ${userId} joined room ${roomId}`);
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Rejoindre une salle via un lien d'invitation
        socket.on('invite-to-room', async (inviteUrl, userId) => {
            try {
                // Traiter l'invitation et ajouter l'utilisateur
                const result = await roomService.inviteToRoom(inviteUrl, userId);
                const { roomId } = result;

                // Ajouter l'utilisateur à la salle et récupérer les informations nécessaires
                socket.join(roomId);
                const state = await roomService.getPlaybackState(roomId);
                const participants = await roomService.getParticipants(roomId);

                // Envoyer l'état de la salle et la liste des participants à l'utilisateur
                socket.emit('room-state', { state, participants });
                io.to(roomId).emit('user-joined', userId);

                console.log(`User ${userId} joined room ${roomId} via invitation`);
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Contrôler l'état de lecture (play)
        socket.on('play', async (roomId) => {
            await roomService.setPlaybackState(roomId, { play_state: 'playing' });
            io.to(roomId).emit('play');
        });

        // Contrôler l'état de lecture (pause)
        socket.on('pause', async (roomId) => {
            await roomService.setPlaybackState(roomId, { play_state: 'paused' });
            io.to(roomId).emit('pause');
        });

        // Déplacer la position de lecture
        socket.on('seek', async (roomId, position) => {
            await roomService.setPlaybackState(roomId, { position });
            io.to(roomId).emit('seek', position);
        });

        // Quitter la salle
        socket.on('leave-room', async (roomId, userId) => {
            try {
                await roomService.leaveRoom(roomId, userId);
                socket.leave(roomId);
                io.to(roomId).emit('user-left', userId);
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // Lorsqu'un utilisateur se déconnecte
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};

module.exports = socketHandler;
