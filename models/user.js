const mongoose = require('mongoose');

const UserShema = new mongoose.Schema({
    name: String,
    last_name: String,
    phone: String,
    password: String,
    img: String,
    friends: Array,
});

mongoose.model('User', UserShema);