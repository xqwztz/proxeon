const express = require("express");
const router = express.Router();
const Joi = require("joi");
const validateRequest = require("_middleware/validate-request");
const authorize = require("_middleware/authorize");
const Role = require("_helpers/role");
const accountService = require("./account.service");
const translations = require("../messages.json");

// routes
router.post("/authenticate", authenticateSchema, authenticate);
router.post("/refresh-token", refreshToken);
router.post("/revoke-token", authorize(), revokeTokenSchema, revokeToken);
router.post("/register", registerSchema, register);
router.post("/verify-email", verifyEmailSchema, verifyEmail);
router.post("/forgot-password", forgotPasswordSchema, forgotPassword);
router.post(
  "/validate-reset-token",
  validateResetTokenSchema,
  validateResetToken
);
router.post("/reset-password", resetPasswordSchema, resetPassword);
router.get("/", authorize(Role.Admin), getAll);
router.get("/active-users", authorize(Role.Admin), getActiveUsers);
router.get("/:id/:lang", authorize(), getById);

router.post("/", authorize(Role.Admin), createSchema, create);
router.put("/:id", authorize(), updateSchema, update);
router.put(
  "/changePassword/:id",
  authorize(),
  changePasswordSchema,
  changePassword
);
router.delete("/:id", authorize(), _delete);

module.exports = router;

function authenticateSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
    lang: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function authenticate(req, res, next) {
  const { email, password, lang } = req.body;
  const ipAddress = req.ip;
  accountService
    .authenticate({ email, password, ipAddress, lang })
    .then(({ refreshToken, ...account }) => {
      setTokenCookie(res, refreshToken);
      res.json(account);
    })
    .catch(next);
}

function refreshToken(req, res, next) {
  const token = req.cookies.refreshToken;
  const ipAddress = req.ip;
  accountService
    .refreshToken({ token, ipAddress })
    .then(({ refreshToken, ...account }) => {
      setTokenCookie(res, refreshToken);
      res.json(account);
    })
    .catch(next);
}

function revokeTokenSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().empty(""),
    lang: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function revokeToken(req, res, next) {
  const token = req.body.token || req.cookies.refreshToken;
  const ipAddress = req.ip;

  if (!token)
    return res
      .status(400)
      .json({ message: translations[req.body.lang]["token-required"] });

  // users can revoke their own tokens and admins can revoke any tokens
  if (!req.user.ownsToken(token) && req.user.role !== Role.Admin) {
    return res
      .status(401)
      .json({ message: translations[req.body.lang]["unauthorized"] });
  }

  accountService
    .revokeToken({ token, ipAddress })
    .then(() => {
      removeTokenCookie(res, "refreshToken");
      res.json({ message: translations[req.body.lang]["token-expired"] });
    })
    .catch(next);
}

function registerSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    lang: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function register(req, res, next) {
  accountService
    .register(req.body, req.get("origin"))
    .then(() =>
      res.json({ message: translations[req.body.lang]["register-success"] })
    )
    .catch(next);
}

function verifyEmailSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required(),
    lang: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function verifyEmail(req, res, next) {
  accountService
    .verifyEmail(req.body)
    .then(() =>
      res.json({ message: translations[req.body.lang]["email-verified"] })
    )
    .catch(next);
}

function forgotPasswordSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    lang: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function forgotPassword(req, res, next) {
  accountService
    .forgotPassword(req.body, req.get("origin"))
    .then(() =>
      res.json({
        message: translations[req.body.lang]["remind-password-success"],
      })
    )
    .catch(next);
}

function validateResetTokenSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required(),
    lang: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function validateResetToken(req, res, next) {
  accountService
    .validateResetToken(req.body)
    .then(() => res.json({ message: translations[req.body.lang]["token-ok"] }))
    .catch(next);
}

function resetPasswordSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
    lang: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function resetPassword(req, res, next) {
  accountService
    .resetPassword(req.body)
    .then(() =>
      res.json({
        message: translations[req.body.lang]["password-reset-success"],
      })
    )
    .catch(next);
}

function getAll(req, res, next) {
  accountService
    .getAll(req.params.lang)
    .then((accounts) => res.json(accounts))
    .catch(next);
}

function getById(req, res, next) {
  // users can get their own account and admins can get any account
  if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  accountService
    .getById(req.params.id, req.body, req.params.lang)
    .then((account) => (account ? res.json(account) : res.sendStatus(404)))
    .catch(next);
}

function createSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
    role: Joi.string().valid(Role.Admin, Role.User).required(),
    lang: Joi.string().required(),
    hostname:Joi.string().regex(/^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.).*[a-zA-Z0-9]$/)
  });
  validateRequest(req, next, schema);
}

function create(req, res, next) {
  accountService
    .create(req.body)
    .then((account) => res.json(account))
    .catch(next);
}

function updateSchema(req, res, next) {
  const schemaRules = {
    email: Joi.string().email().empty(""),
    password: Joi.string().min(6).empty(""),
    lang: Joi.string().required(),
    color: Joi.string(),
    logo: Joi.string(),
    hostname:Joi.string().regex(/^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.).*[a-zA-Z0-9]$/)
  };

  // only admins can update role
  if (req.user.role === Role.Admin) {
    schemaRules.role = Joi.string().valid(Role.Admin, Role.User).empty("");
  }

  const schema = Joi.object(schemaRules);
  validateRequest(req, next, schema);
}

function update(req, res, next) {
  // users can update their own account and admins can update any account
  if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  accountService
    .update(req.params.id, req.body)
    .then((account) => res.json(account))
    .catch(next);
}

function changePasswordSchema(req, res, next) {
  const schemaRules = {
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
    newPasswordRepeat: Joi.string().required(),
    lang: Joi.string().required(),
  };
  const schema = Joi.object(schemaRules);

  validateRequest(req, next, schema);
}

function changePassword(req, res, next) {
  // users can update their own account and admins can update any account
  if (req.params.id !== req.user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  accountService
    .changePassword(req.params.id, req.body)
    .then((account) => res.json(account))
    .catch(next);
}

function _delete(req, res, next) {
  // users can delete their own account and admins can delete any account
  if (req.params.id !== req.user.id && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  accountService
    .delete(req.params.id)
    .then(() => res.json({ message: "OK" }))
    .catch(next);
}

function getActiveUsers(req, res, next) {
  accountService
    .getActiveUsers()
    .then((respond) => res.json(respond))
    .catch(next);
}

// helper functions

function setTokenCookie(res, token) {
  // create cookie with refresh token that expires in 7 days
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'None',
    secure:true,
    expires: new Date(Date.now() + 600000),
  };
  res.cookie("refreshToken", token, cookieOptions);
}
function removeTokenCookie(res, cookieName) {
  res.clearCookie(cookieName);
}
