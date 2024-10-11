const express = require('express');
const router = express.Router();
const {
    authenticateUser,
} = require('../middleware/authentication');

const {
    getAllData,
    getDataByEventId,
} = require('../controllers/userController');

router.get('/get/all/:limit', getAllData);
router.get('/get/event/:eventid', getDataByEventId);

module.exports = router;
