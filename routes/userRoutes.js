const express = require('express');
const router = express.Router();
const {
    authenticateUser,
} = require('../middleware/authentication');

const {
    getData,
} = require('../controllers/userController');

router.get('/getdata/:limit', getData);

module.exports = router;
