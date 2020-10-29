const express       = require('express');
const mongoose      = require('mongoose');
const bodyParser    = require('body-parser');
const config_app    = require('./config.json');
const app           = express();
const jwt           = require('jsonwebtoken');
const bCrypt        = require('bcrypt');
const models        = require('./models');
const mkdirp        = require('mkdirp');
const { text } = require('body-parser');

app.use(bodyParser.json());

const io 	        = require('socket.io')();
const server_http   = require('http').createServer(app);

mongoose.connect(config_app.mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then( function() {
        console.log(`Mongo Db Connect to ${config_app.mongoUri}`);
        server_http.listen(config_app.appPort,
            () => {
                console.log(`Занят ${config_app.appPort} порт...`);
                documentReadyRequire();
            }
        );
    })
    .catch(err => console.error(`Error connection to mogoDB: ${mongoUri}`, err));


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

    const { secret } = config_app.jwt;
    const userId = jwt.verify(socket.handshake.query.token, secret).userId;
    
    all_users.push({
        socketId: socket.id,
        userId: userId,
    })

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

        var User = mongoose.model('User');
        var me = jwt.verify(data.token, secret).userId;
        var not_me  = data.not_me;
        var msg     = data.text;
        var socketNotMe = all_users.find(item => item.userId == not_me).socketId;



        User.findOne({ _id: me }).then((humen) => {

            var messages = humen.messages;
            var msg_user = messages.find(item => item.user == not_me);
            var only_msgs = msg_user.messages;
            only_msgs.push({
                _id: 0,
                user: me,
                time: '77:77',
                msg: msg,
            });

            User.updateOne({ _id: me }, { messages: messages }).then((data) => {
                User.updateOne({ _id: not_me }, { messages: messages }).then((data) => {
                    callback('ok')
                })
            });
        })

        
    })

});