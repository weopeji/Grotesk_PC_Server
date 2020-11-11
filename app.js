const express                       = require('express');
const mongoose                      = require('mongoose');
const bodyParser                    = require('body-parser');
const {mongoUri, appPort, secret}   = require('./config.json');
const app                           = express();
const jwt                           = require('jsonwebtoken');
const bCrypt                        = require('bcrypt');
const models                        = require('./models');
const mkdirp                        = require('mkdirp');
const { memory }                    = require('console');
var fs                              = require('fs');


const io 	        = require('socket.io')();
const server_http   = require('http').createServer(app);

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then( function() {
        console.log(`Mongo Db Connect to ${mongoUri}`);
        server_http.listen(appPort,
            () => {
                console.log(`Занят ${appPort} порт...`);
                documentReadyRequire();
            }
        );
    })
    .catch(err => console.error(`Error connection to mogoDB: ${mongoUri}`, err));


app.use(bodyParser.json())

app.get('/', function (req, res, next) {
    res.send('Default page git');
});

var registration_html   = null;
var messenger_html      = null;

var documentReadyRequire = function() 
{

    if(registration_html == null) {
        registration_html = require('./code/registration');
        registration_html.init({
            mongo: mongoose,
            jwt: jwt,
            bCrypt: bCrypt,
            mkdirp: mkdirp,
        })
    }

    if(messenger_html == null) {
        messenger_html = require('./code/messenger');
        messenger_html.init({
            mongo: mongoose,
            jwt: jwt,
            io: io,
            fs: fs,
        })
    }

}

var registration_page = function registration_page(socket,data,callback)
{
    if(registration_html)
    {
        registration_html.registration_page(socket,data,callback);
    }
}

var messenger_page = function messenger_page(socket,data,callback)
{
    if(messenger_html)
    {
        messenger_html.messenger_page(socket,data,callback);
    }
}

io.attach(server_http);

var all_users = new Array();

io.on('connection', function(socket) 
{
    if(typeof socket.handshake.query.token != "undefined") {
        const userId = jwt.verify(socket.handshake.query.token, secret).userId;
        all_users.push({
            socketId: socket.id,
            userId: userId,
        })
    }
    

    socket.on('registration_page', function(data, callback) {
        registration_page(this, data, callback);
    });

    socket.on('messenger', function(data, callback) {
        messenger_page(this, data, callback);
    });

    socket.on('disconnect', function () {
        var indexElement = all_users.findIndex(item => item.socketId == socket.id);
        all_users.splice(indexElement, 1);
    })

    socket.on('msg', function(data, callback) {

        var Messages = mongoose.model('Messages');
        var me = jwt.verify(data.token, secret).userId;
        var chatId  = data.chatId;
        var msg     = data.text;

        // if(typeof all_users.find(item => item.userId == not_me) != "undefined") {
        //     var socketNotMe = all_users.find(item => item.userId == not_me).socketId;
        //     io.to(socketNotMe).emit('add_msg_take');
        // }

        Messages.findOne({ _id: chatId }, {messages: 1}).then((messages) => {
            var allMessages = messages.messages;
            allMessages.push({
                from: me,
                time: new Date(),
                message: msg,
            })
            Messages.findOneAndUpdate({ _id: chatId }, {messages: allMessages}).then( function() {
                callback('ok');
            })
        })
    })
});