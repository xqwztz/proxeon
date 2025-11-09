const config = require('config.json');
const mongoose = require('mongoose');

// Use MONGO_URI from .env if available (production), otherwise use config.json (development)
const connectionString = process.env.MONGO_URI || config.connectionString;

if (!connectionString) {
    throw new Error('MongoDB connection string not found! Set MONGO_URI in .env or connectionString in config.json');
}

const connectionOptions = { 
    useCreateIndex: true, 
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    useFindAndModify: false 
};

mongoose.connect(connectionString, connectionOptions);
mongoose.Promise = global.Promise;

// Log which connection method is being used (without exposing password)
const maskedUri = connectionString.replace(/:[^:@]+@/, ':****@');
console.log(`📊 MongoDB: ${maskedUri}`);

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