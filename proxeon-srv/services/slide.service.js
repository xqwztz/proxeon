const db = require('_helpers/db');
var fs = require('fs');

const path = require('path');
const shortid = require('shortid');

module.exports = {
    getSlides,
    uploadSlides,
    deleteSlide
};

async function getSlides(id) {
    const presentations = await db.Slide.find({ roomID: id })
    return presentations
}

async function uploadSlides(id, params) {
    if (!params.file)
        throw "No file"
    if(params.file.size/1024/1024 >= 100)
        throw 'File cannot be bigger than '+100+"MB" //presentation max size


    var img = params.file

    const name = shortid.generate()

    await img.mv(path.join(__dirname,'..','public','slides',name+'.pdf'), async function (err) {
        if (err) {
            throw err
        } else {
            const slide_params={roomID:id, file:name+".pdf", localName:params.file.name}
            const slide = new db.Slide(slide_params)
            await slide.save()
        }
    })

    return 'saved'
}

async function deleteSlide(id) {
    const slide=await db.Slide.findOne({_id:id})
    const file=path.join(__dirname,"..", "public", "slides",slide.file)
    try {
        fs.unlinkSync(file)
    } catch (err) {
        throw err
    }
    await slide.remove()
}