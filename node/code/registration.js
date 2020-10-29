var mongoose  = null;
var bCrypt = null;
var jwt = null;
var authHelper = null;
var mkdirp = null;
var authHelper = null;

module.exports = {
    init:function(initPlagins)
    {
        privateInit(initPlagins);
    },
    registration_page: function(socket,data,callback) {
        private_registration(socket,data,callback);
    }
}


function privateInit(initPlagins) {
    mongoose    = initPlagins.mongo;
    mkdirp      = initPlagins.mkdirp;
    jwt         = initPlagins.jwt;
    bCrypt      = initPlagins.bCrypt;
    authHelper  = require('../helpers/authHelper');
}


var action_linker = {
    "auth": auth,
    "registration": registration,
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

const updateTokens = (userId) => {

    const accessToken = authHelper.generateAccessToken(userId);

    return authHelper.replaceDbRefreshToken(userId)
        .then(() => ({
            accessToken
        }));
    
};

function auth(socket, data, callback) {

    var phone = data.phone;
    var password = data.password;
    var User = mongoose.model('User');
    
    User.findOne({ phone: phone })
    .exec()
    .then((user) => {
        if (!user) {
            callback({ response: { error: 'User does not exist' } });
            return;
        }
        const isValid = bCrypt.compareSync(password, user.password);
        if (isValid) {
            updateTokens(user._id).then(tokens => callback(tokens));
        } else {
            callback({ response: { error: 'Password fail' }});
        }
    })

}

function registration(socket, data, callback) {

    var User = mongoose.model('User');
    var phone = data.phone;
    var password = data.password;
    var name = data.name;
    var last_name = data.last_name;
    var password = bCrypt.hashSync(password, 10);
    var img = null;

    var messages = [
        {
            user: "5f99c751c6a5c6127c80ce45",
            name: "Служба",
            last_name: "Поддержки",
            img: "/assets/img/YPx1-WuF0Zk.jpg",
            messages: [
                {
                    _id: 000,
                    user: "5f99c751c6a5c6127c80ce45",
                    time: "77:77",
                    msg: "Добро пожаловать! Это бета тест..."
                },
            ]
        }
    ];
    
    User.findOne({ phone: phone }).then((user) => {
        if(user) {
            callback({ response: { error: 'User exist' } });
            return;
        } else {
            User.create({name: name, last_name: last_name, phone: phone, password: password, img: img, messages: messages})
            .then((humen) => {
                mkdirp(`../users/${humen._id}/img/`, { recursive: true }, function (err) {
                    if (err) {
                        callback({ response: { 
                            error: errors["005"],
                            more: err
                        }});
                    }
                });
                callback({ response: {
                    userId: humen._id
                }});
            });
        }
    });

}