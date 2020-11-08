var jwt             = null;
var mongoose        = null;
var io              = null;
const { secret }    = require('../config.json');
var User            = null;
var Messages        = null;
var fs              = null;

module.exports = {
    init:function(initPlagins)
    {
        privateInit(initPlagins);
    },
    messenger_page: function(socket,data,callback) {
        private_registration(socket,data,callback);
    }
}

function privateInit(initPlagins) {
    mongoose    = initPlagins.mongo;
    jwt         = initPlagins.jwt;
    io          = initPlagins.io;
    fs          = initPlagins.fs;
    User = mongoose.model('User');
    Messages = mongoose.model('Messages');
}

var action_linker = {
    'get_all_data': getAllData,
    'get_msgs': getMsgs,
    'get_line_data': getLineId,
    'cheack_users': cheackUsers,
    'get_messages': getMessages,
    'add_photo_chat': addPhotoChat,
    'add_user_msg': addUserMsg,
}

var private_registration = function(socket,data,callback) {
    var action = data.action;
    if(typeof action_linker[action] != "undefined")     {
        action_linker[action](socket,data.data,callback,data)   
    } else {
        callback({
            error:{
                code:0 //no action
            }
        })
    }
}


function getAllData(socket, data, callback) {

    const userId = jwt.verify(data.token, secret).userId;
    var allData = new Array();

    User.findOne({ _id: userId }).then((humen) => {
        if(!humen) {
            callback('error');
        } else {
            allData = {
                user: {
                    name: humen.name,
                    last_name: humen.last_name,
                    phone: humen.phone,
                    photo: humen.img,
                    userId: humen._id,
                    friends: humen.friends,
                }
            }
            callback(allData);
        }
    });
}

function getMsgs(socket, data, callback) {

    const userId = jwt.verify(data, secret).userId;

    User.findOne({ _id: userId }).select('messages').then((messages) => {
        callback(messages.messages); 
    });
    
}

function getLineId(socket, data, callback) {
    User.findOne({ _id: data.userId }, {name: 1, last_name: 1, img: 1}).then((hook) => {
        Messages.findOne({ _id: data.chatId }, {messages: 1}).then((messages) => {
            var msgLast = '';
            if(typeof messages.messages[messages.messages.length - 1] != 'undefined') {
                msgLast = messages.messages[messages.messages.length - 1].message;
            }
            callback({
                user: hook,
                last_message: msgLast,
            })
        });
        
    });
}

function cheackUsers(socket, data, callback) {
    User.find({name: data.data}, {name: 1, last_name: 1, phone: 1, img: 1}).then((humens) => {
        if(humens.length > 0) {
            callback(humens);
        } else {
            User.find({phone: data.data}, {name: 1, last_name: 1, phone: 1, img: 1}).then((humens2) => {
                if(humens2.length > 0) {
                    callback(humens2);
                } else {
                    callback('error');
                }
            })
        }
    })
}

function getMessages(socket, data, callback) {
    Messages.findOne({_id: data.id}).then((msgs) => {
        callback(msgs.messages);
    })
}

function addPhotoChat(socket, data, callback) {
    var chatId = data.chatId;
    var userId = jwt.verify(data.token, secret).userId;
    function str_rand() {
        var result       = '';
        var words        = '0123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
        var max_position = words.length - 1;
            for( i = 0; i < 5; ++i ) {
                position = Math.floor ( Math.random() * max_position );
                result = result + words.substring(position, position + 1);
            }
        return result;
    }
    var uuid_god    = str_rand();
    var type        = data.type.split('/')[1];
    fs.appendFile('../users/'+ userId +'/img/'+ uuid_god + '.' + type, data.photo, (err) => {
        if(err) throw err;
        Messages.findOne({ _id: chatId }, {messages: 1}).then((messages) => {
            var allMessages = messages.messages;
            allMessages.push({
                from: userId,
                time: new Date(),
                message: '',
                photo: uuid_god + '.' + type,
            })
            Messages.findOneAndUpdate({ _id: chatId }, {messages: allMessages}).then( function() {
                callback('ok');
            })
        })
    });
}

function addUserMsg(socket, data, callback) {
    var userId  = jwt.verify(data.token, secret).userId;
    var NotMe   = data.userId;
    const uuid =()=>([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15 >> c/4).toString(16));
    Messages.create({
        messages: []
    }).then((msg) => {
        User.findOne({ _id: userId}, {friends: 1}).then((friends) => {
            var fr = friends.friends;
            fr.push({
                id: NotMe,
                type: 'open',
                chatId: msg._id
            })
            User.findOneAndUpdate({ _id: userId}, {friends: fr}).then( function() {
                User.findOne({ _id: NotMe}, {friends: 1}).then((friends2) => {
                    var fr2 = friends2.friends;
                    fr2.push({
                        id: NotMe,
                        type: 'open',
                        chatId: msg._id
                    })
                    User.findOneAndUpdate({ _id: userId}, {friends: fr2}).then( function() {
                        callback('ok');
                    })
                })
            })
        })
    })
}