const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    roomID: { type: String, required: true },
    file: { type: String, required: true },
    localName:{type:String, required:true}
});

schema.set('toJSON', {
    virtuals: true,
    versionKey: false
});

module.exports = mongoose.model('Slide', schema);