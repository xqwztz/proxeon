const express = require("express");
const router = express.Router();
const Joi = require("joi");
const validateRequest = require("_middleware/validate-request");
const authorize = require("_middleware/authorize");
const meetingService = require("../services/meeting.service.js");
const Role = require("_helpers/role");

// routes
router.post("/", authorize(), createSchema, create);
router.post("/end-meeting", authorize(), endMeetingSchema, endMeeting);
router.post("/recordingReady", recordingReady);

router.get("/get-meetings", authorize(), getMeetings);
router.get("/get-all-meetings", authorize([Role.Admin]), getAllMeetings);
router.get("/get-recordings", authorize(), getRecordings);
router.get("/get-all-recordings", authorize([Role.Admin]), getAllRecordings);
router.get("/meetingEnded", meetingEnded);
router.get("/active-users/:id", authorize(), getActiveUsers);

router.delete("/onbox/:id", deleteOnboxRecording);
router.delete("/:id/:lang", authorize(), deleteRecording);

module.exports = router;

function getAllRecordings(req, res, next){
  meetingService
    .getAllRecordings()
    .then((meetings) => res.json(meetings))
    .catch(next);
}

function getAllMeetings(req, res, next) {
  meetingService
    .getAllMeetings()
    .then((meetings) => res.json(meetings))
    .catch(next);
}

function getMeetings(req, res, next) {
  meetingService
    .getMeetings(req.query.id)
    .then((meetings) => res.json(meetings))
    .catch(next);
}
function getRecordings(req, res, next) {
  meetingService
    .getRecordings()
    .then((recordings) => res.json(recordings))
    .catch(next);
}

function meetingEnded(req, res, next) {
  meetingService
    .meetingEnded(req.query)
    .then((meeting) => res.json(meeting))
    .catch(next);
}

function recordingReady(req, res, next) {
  meetingService
    .recordingReady(req.body)
    .then((meeting) => res.json(meeting))
    .catch(next);
}

function endMeetingSchema(req, res, next) {
  const schema = Joi.object({
    url: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function endMeeting(req, res, next) {
  meetingService
    .endMeeting(req.body)
    .then((meeting) => res.json(meeting))
    .catch(next);
}

function createSchema(req, res, next) {
  const schema = Joi.object({
    author: Joi.string().required(),
    name: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function create(req, res, next) {
  meetingService
    .create(req.body)
    .then((meeting) => res.json(meeting))
    .catch(next);
}

function deleteRecording(req, res, next) {
  meetingService
    .deleteRecording(req.params.id, req.params.lang)
    .then((respond) => res.json(respond))
    .catch(next);
}

function deleteOnboxRecording(req, res, next) {
  meetingService
    .deleteOnboxRecording(req.params.id)
    .then((respond) => res.json(respond))
    .catch(next);
}

function getActiveUsers(req, res, next) {
  meetingService
    .getActiveUsers(req.params.id, req.user)
    .then((respond) => res.json(respond))
    .catch(next);
}
