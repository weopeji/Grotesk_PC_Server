var mongoose  = null;
var bCrypt = null;
var jwt = null;
var authHelper = null;
var mkdirp = null;
var authHelper = null;


var User = null;
var Messages = null;

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
    User = mongoose.model('User');
    Messages = mongoose.model('Messages');
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

    var phone = data.phone;
    var password = data.password;
    var name = data.name;
    var last_name = data.last_name;
    var password = bCrypt.hashSync(password, 10);
    var img = null;

    var friends = [];
    
    User.findOne({ phone: phone }).then((user) => {
        if(user) {
            callback({ error: 'User exist' });
        } else {
            User.create({name: name, last_name: last_name, phone: phone, password: password, img: img, friends: friends})
            .then((humen) => {
                mkdirp(`../users/${humen._id}/img/`, { recursive: true }, function (err) {
                    if (err) 
                    {
                        callback({ error: errors["005"] });
                    } else 
                    {
                        User.findOne({phone: '+79668539379'}).then((admin) => {

                            const uuid =()=>([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15 >> c/4).toString(16));
                            Messages.create({
                                messages: [
                                    {
                                        id: uuid,
                                        from: admin._id,
                                        time: new Date(),
                                        message: 'Доброго времени суток! Это бетта тест мэсенджера...'
                                    }
                                ]
                            }).then((msg) => {
                                User.findOneAndUpdate({ _id: humen._id }, 
                                {
                                    friends: 
                                    [{
                                        id: admin._id,
                                        type: 'open',
                                        chatId: msg._id
                                    }]
                                }).then( function() {
                                    if(phone == '+79668539379') {
                                        callback({
                                            userId: humen._id
                                        })
                                    } else {
                                        var friends_admin = admin.friends;
                                        friends_admin.push({
                                            id: humen._id,
                                            type: 'open',
                                            chatId: msg._id
                                        })
                                        User.findOneAndUpdate({phone: '+79668539379'}, {friends: friends_admin}).then( function() {
                                            callback({
                                                userId: humen._id
                                            })
                                        });
                                    }
                                })
                            });
                        })
                    }
                });
            });
        }
    });

}