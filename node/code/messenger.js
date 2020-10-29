var jwt         = null;
var mongoose    = null;
var io          = null;
const { secret, tokens } = require('../config.json').jwt;

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
}

var action_linker = {
    'get_all_data': getAllData,
    'get_msgs': getMsgs,
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
    var User = mongoose.model('User');

    User.findOne({ _id: userId }).then((humen) => {

        allData = {
            user: {
                name: humen.name,
                last_name: humen.last_name,
                phone: humen.phone,
                photo: humen.img,
                userId: humen._id,
            },
            messages: humen.messages,
        }

        callback(allData);
    });
}

function getMsgs(socket, data, callback) {

    var User = mongoose.model('User');
    const userId = jwt.verify(data, secret).userId;

    User.findOne({ _id: userId }).select('messages').then((messages) => {
        callback(messages.messages); 
    });
    
}