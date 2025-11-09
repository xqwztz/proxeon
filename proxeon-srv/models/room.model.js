const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    id:{type:String, required:true, unique:true},
    user_join_id:{type:String, required:true},
    mod_join_id:{type:String, required:true},
    userID: { type: String, required: true },
    name: { type: String, required: true },
    user_start_meeting:{type:Boolean, required:true},
    mute_on_start:{type:Boolean, required:true},
    ask_moderator:{type:Boolean, required:true}, //true-ask, false-always_accept
    meetingID:{type:String, required:false, default:null},
    createDate:{type:Date, required:true},
    accessCode:{type:String, required:false},
    waitingForStart:{type: Boolean, required:false},
    waitingForStartTimeStamp: {type: Date, required:false}
});

schema.set('toJSON', {
    virtuals: true,
    versionKey: false
});

module.exports = mongoose.model('Room', schema);