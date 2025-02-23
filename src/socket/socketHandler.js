const roomService = require('../services/roomService');
const trackService = require('../services/trackService');
const logger = require('../utils/logger');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    logger.info('🔗 User connected:', socket.id);

    // 📌 Un utilisateur rejoint une salle
    socket.on('join-room', async (roomId, userId) => {
      try {
        await roomService.getRoom(roomId);
        await roomService.joinRoom(roomId, userId);
        socket.join(roomId);
        socket.userId = userId; // 🔥 Stocker l'ID utilisateur

        const state = await roomService.getPlaybackState(roomId);
        const participants = await roomService.getParticipants(roomId);
        const currentTrackId = await roomService.getCurrentTrack(roomId);
        const currentTrack = await trackService.getTrackById(currentTrackId);

        io.to(roomId).emit('room-state', { state, participants, currentTrack });
        io.to(roomId).emit('user-joined', { userId, participants });

        logger.info(`✅ User ${userId} joined room ${roomId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // 📌 Un utilisateur quitte une salle
    socket.on('leave-room', async (roomId, userId) => {
      try {
        await roomService.leaveRoom(roomId, userId);
        socket.leave(roomId);

        const participants = await roomService.getParticipants(roomId);
        io.to(roomId).emit('user-left', { userId, participants });

        // 🔥 Si dernier utilisateur, supprimer la salle
        if (participants.length === 0) {
          await roomService.deleteRoom(roomId);
          logger.info(`🚮 Room ${roomId} deleted (no more participants)`);
        }

        logger.info(`❌ User ${userId} left room ${roomId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // 📌 Jouer la musique
    socket.on('play', async (roomId) => {
      try {
        await roomService.updatePlaybackState(roomId, true);
        io.to(roomId).emit('play');
        logger.info(`▶️ Play triggered in room ${roomId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // 📌 Pause de la musique
    socket.on('pause', async (roomId) => {
      try {
        await roomService.updatePlaybackState(roomId, false);
        io.to(roomId).emit('pause');
        logger.info(`⏸️ Pause triggered in room ${roomId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // 📌 Changer la position de la lecture
    socket.on('seek', async (roomId, position) => {
      try {
        await roomService.updateCurrentTime(roomId, position);
        io.to(roomId).emit('seek', position);
        logger.info(`⏩ Seek to ${position}s in room ${roomId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // 📌 Changer la musique pour tous les participants
    socket.on('change-track', async (roomId, trackId) => {
      try {
        await roomService.setCurrentTrack(roomId, trackId);
        io.to(roomId).emit('track-changed', { trackId });
        logger.info(`🎵 Track changed in room ${roomId} -> ${trackId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // 📌 Gestion de la déconnexion propre
    socket.on('disconnecting', async () => {
      const rooms = Array.from(socket.rooms).slice(1); // Ignorer `socket.id`
      for (const roomId of rooms) {
        try {
          const userId = socket.userId || socket.id; // 🔥 Récupérer userId
          await roomService.leaveRoom(roomId, userId);
          const participants = await roomService.getParticipants(roomId);
          io.to(roomId).emit('user-left', { userId, participants });

          // 🔥 Supprimer la salle si plus personne
          if (participants.length === 0) {
            await roomService.deleteRoom(roomId);
            logger.info(`🚮 Room ${roomId} deleted (empty)`);
          }
        } catch (error) {
          logger.error(`Erreur lors de la déconnexion: ${error.message}`);
        }
      }
      logger.info(`🔌 User ${socket.id} disconnected`);
    });
  });
};

module.exports = socketHandler;
