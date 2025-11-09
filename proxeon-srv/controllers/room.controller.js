const express = require("express");
const router = express.Router();
const Joi = require("joi");
const validateRequest = require("_middleware/validate-request");
const authorize = require("_middleware/authorize");
const Role = require("_helpers/role");
const path = require("path");
var fs = require("fs");
const db = require("../_helpers/db.js");

const roomService = require("../services/room.service.js");

// routes
router.post("/", authorize(), createSchema, create);
router.post("/create-link", linkSchema, getLink);
router.post("/validateCode", validateCode);
router.post("/create-onbox",  createOnboxSchema, createOnbox);

router.put("/:id", authorize(), updateSchema, update);
router.put("/create-meeting/:id", authorize(), createMeeting);

router.get("/check-bbb-status", checkBBBStatus);
router.get("/get-rooms/:id", authorize(), getRooms);
router.get("/:id", getOneRoom);
router.get("/meetingEnded/:id", meetingEnded);
router.get("/checkCode/:id", checkCode);
router.get("/check-recordings/:id", authorize(), checkRecordings);
router.get("/get-onbox-meetings/:id", getOnboxMeetings);


router.delete('/delete-room/:id', authorize(), deleteRoom)
module.exports = router;


function linkSchema(req, res, next) {
  const schema = Joi.object({
    userID: Joi.string(),
    roomID: Joi.string().required(),
    login: Joi.string().required(),
    type: Joi.string().required(),
    code: Joi.string().empty(""),
  });
  validateRequest(req, next, schema);
}

function getLink(req, res, next) {
  roomService
    .getLink(req.body, req.ip)
    .then((link) => {
      res.json(link);
    })
    .catch((err) => {
      console.error('❌ Error in getLink:', err);
      next(err);
    });
}

function meetingEnded(req, res, next) {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null);

  if (ip.split(",")[0] !== "193.187.68.204")
    res.status(401).json({ message: "Unauthorized" });

  roomService.meetingEnded(req.params.id);
}

function createSchema(req, res, next) {
  const schema = Joi.object({
    userID: Joi.string().required(),
    name: Joi.string().required(),
    user_start_meeting: Joi.boolean().required(),
    mute_on_start: Joi.boolean().required(),
    ask_moderator: Joi.boolean().required(), //true-ask, false-always_accept
    accessCode: Joi.string(),
    welcomeMessage: Joi.string().allow(null, "").empty(""),
  });
  validateRequest(req, next, schema);
}

function create(req, res, next) {
  roomService
    .create(req.body)
    .then((meeting) => res.json(meeting))
    .catch(next);
}


function createOnboxSchema(req, res, next) {
  const schema = Joi.object({
    name: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function createOnbox(req, res, next) {
  roomService
    .createOnbox(req.body)
    .then((meeting) => res.json(meeting))
    .catch(next);
}


function createMeeting(req, res, next) {
  roomService
    .createMeeting(req.params.id, req.user)
    .then((room) => res.json(room))
    .catch(next);
}

function getRooms(req, res, next) {
  roomService
    .getAll(req.params.id)
    .then((meetings) => res.json(meetings))
    .catch(next);
}

function getOneRoom(req, res, next) {
  roomService
    .getOneRoom(req.params.id)
    .then((meetings) => res.json(meetings))
    .catch(next);
}

function getOnboxMeetings(req, res, next) {
  roomService
    .getOnboxMeetings(req.params.id)
    .then((meetings) => res.json(meetings))
    .catch(next);
}

function updateSchema(req, res, next) {
  const schemaRules = {
    name: Joi.string().empty(""),
    user_start_meeting: Joi.boolean().empty(""),
    mute_on_start: Joi.boolean().empty(""),
    ask_moderator: Joi.boolean().empty(""),
    userID: Joi.string().required(),
    accessCode: Joi.string(),
    welcomeMessage: Joi.string().allow(null, "").empty(""),
  };

  if (req.user.role === Role.Admin) {
    schemaRules.role = Joi.string().valid(Role.Admin, Role.User).empty("");
  }

  const schema = Joi.object(schemaRules);
  validateRequest(req, next, schema);
}

async function update(req, res, next) {
  const room = await db.Room.findOne({ id: req.params.id });
  if (room.userID !== req.user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  roomService
    .update(req.params.id, req.body)
    .then((room) => res.json(room))
    .catch(next);
}

function checkCode(req, res, next) {
  roomService
    .checkCode(req.params.id)
    .then((respond) => res.json(respond))
    .catch(next);
}

function validateCode(req, res, next) {
  roomService
    .validateCode(req.body)
    .then((respond) => res.json(respond))
    .catch(next);
}

function checkRecordings(req, res, next) {
  roomService
    .checkRecordings(req.params.id, req.user)
    .then((respond) => {
      res.json(respond);
    })
    .catch(next);
}

function checkBBBStatus(req, res, next) {
  roomService
    .checkBBBStatus()
    .then((respond) => {
      res.json(respond);
    })
    .catch(next);
}

function deleteRoom(req,res,next){
    roomService
    .deleteRoom(req.params.id, req.user)
    .then(respond=>res.json(respond))
    .catch(next)
}