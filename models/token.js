const mongoose = require('mongoose');

const TokenShema = new mongoose.Schema({
    userId: String,
});

mongoose.model('Token', TokenShema);