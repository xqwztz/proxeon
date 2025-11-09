const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validateRequest = require('_middleware/validate-request');
const authorize = require('_middleware/authorize')
const Role = require('_helpers/role');
const path = require('path');
var fs = require('fs');
const db = require('_helpers/db');


const slideService = require('../services/slide.service.js');
// routes
router.get('/getSlides/:id', authorize(), getSlides);

router.get('/getPresentation/:id', getPresentationAPI);

router.post('/upload/:id', authorize(), uploadSlide);
router.delete('/:id', authorize(), deleteSlide);


module.exports = router;


function getSlides(req, res, next) {
    slideService.getSlides(req.params.id)
        .then(link => res.json(link))
        .catch(next);
}

function uploadSlide(req, res, next) {
    slideService.uploadSlides(req.params.id, req.files)
        .then(msg => res.json(msg))
        .catch(next);

}
function deleteSlide(req, res, next) {
    slideService.deleteSlide(req.params.id)
        .then(msg => res.json(msg))
        .catch(next);
}

async function getPresentationAPI(req, res, next) {
    const ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     (req.connection.socket ? req.connection.socket.remoteAddress : null);
     
    if(req.params.id==="default"){
    res.sendFile(path.join(__dirname, '..', 'public', 'slides', 'default.pdf'))
    return
    }

    const file=await db.Slide.findOne({_id:req.params.id})
    res.sendFile(path.join(__dirname, '..', 'public', 'slides', file.file))
   
}
