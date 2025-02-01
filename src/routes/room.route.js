const express = require('express');
const RoomController = require('../controllers/room.controller');

const router = express.Router();

router.post('/', RoomController.createRoom);
router.get('/:roomId', RoomController.getRoom);
router.get('/:roomId/state', RoomController.getRoomState);

module.exports = router;
