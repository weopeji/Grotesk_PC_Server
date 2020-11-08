const mongoose = require('mongoose');

const UserShema = new mongoose.Schema({
    messages: Array,
});

mongoose.model('Messages', UserShema);