const config = require('config.json');
const mongoose = require('mongoose');
const connectionOptions = { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false };
mongoose.connect( config.connectionString, connectionOptions);
mongoose.Promise = global.Promise;

module.exports = {
    Account: require('accounts/account.model'),
    RefreshToken: require('accounts/refresh-token.model'),
    Meeting: require('models/meeting.model'),
    Room:require('models/room.model'),
    Slide:require('models/slide.model'),

    isValidId
};

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}