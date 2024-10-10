const mongoose = require('mongoose');

// Define the Follow schema
const Bet = new mongoose.Schema({
  title: { type: String, required: true },
});

module.exports = mongoose.model('Bet', FollowSchema);