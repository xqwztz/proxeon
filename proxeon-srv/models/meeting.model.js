const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    meetingID: { type: String, unique: true, required: true },
    startDate: { type: Date, required: true },
    recordingID:{type:String, required:false},
    recordingStatus:{type:String, required:false},
    recordingLink:{type:String, required:false},
    roomID:{type:String, required:true},
    admin_passw:{type:String, required:true},
    user_passw:{type:String, required:true},

});

schema.set('toJSON', {
    virtuals: true,
    versionKey: false
});

module.exports = mongoose.model('Meeting', schema);