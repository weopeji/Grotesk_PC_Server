const jwt = require('jsonwebtoken');
const { secret, tokens }    = require('../config.json').jwt;
const mongoose = require('mongoose');


const Token = mongoose.model('Token');


const generateAccessToken = (userId) => {

    const payload = {
        userId,
    };

    const options = { expiresIn: tokens.access.expiresIn };
    return jwt.sign(payload, secret, options);
};

const replaceDbRefreshToken = (userId) => 
    Token.findOneAndDelete({ userId })
        .exec()
        .then(() => Token.create({ userId }));

module.exports = {
    generateAccessToken,
    replaceDbRefreshToken,
};