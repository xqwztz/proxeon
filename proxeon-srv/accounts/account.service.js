// Use JWT_SECRET from .env, fallback to config.json for backward compatibility
const jwtSecret = process.env.JWT_SECRET || (() => {
    try {
        return require("config.json").secret;
    } catch (e) {
        throw new Error('JWT_SECRET not found! Set JWT_SECRET in .env or secret in config.json');
    }
})();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("_helpers/send-email");
const db = require("_helpers/db");
const Role = require("_helpers/role");
const translations = require("../messages.json");

// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
module.exports = {
  authenticate,
  refreshToken,
  revokeToken,
  register,
  verifyEmail,
  forgotPassword,
  validateResetToken,
  resetPassword,
  getAll,
  getById,
  create,
  update,
  changePassword,
  delete: _delete,
  getActiveUsers,
};

async function authenticate({ email, password, ipAddress, lang }) {
  const account = await db.Account.findOne({ email });

  if (!account || !bcrypt.compareSync(password, account.passwordHash)) {
    throw translations[lang]["email-or-password-invalid"];
  }
  if (!account.isVerified) {
    throw translations[lang]["verify-your-email"];
  }

  // authentication successful so generate jwt and refresh tokens
  const jwtToken = generateJwtToken(account);
  const refreshToken = generateRefreshToken(account, ipAddress);

  // save refresh token
  await refreshToken.save();

  // return basic details and tokens
  return {
    ...basicDetails(account),
    jwtToken,
    refreshToken: refreshToken.token,
  };
}

async function refreshToken({ token, ipAddress }) {
  const refreshToken = await getRefreshToken(token);

  const { account } = refreshToken;

  // replace old refresh token with a new one and save
  const newRefreshToken = generateRefreshToken(account, ipAddress);
  refreshToken.revoked = Date.now();
  refreshToken.revokedByIp = ipAddress;
  refreshToken.replacedByToken = newRefreshToken.token;
  await refreshToken.save();
  await newRefreshToken.save();

  // generate new jwt
  const jwtToken = generateJwtToken(account);

  // return basic details and tokens
  return {
    ...basicDetails(account),
    jwtToken,
    refreshToken: newRefreshToken.token,
  };
}

async function revokeToken({ token, ipAddress }) {
  const refreshToken = await getRefreshToken(token);

  // revoke token and save
  refreshToken.revoked = Date.now();
  refreshToken.revokedByIp = ipAddress;
  await refreshToken.save();
}

async function register(params, origin) {
  // validate
  if (await db.Account.findOne({ email: params.email })) {
    // send already registered error in email to prevent account enumeration
    throw translations[params.lang]["email-already-registered"];
  }

  // create account object
  const account = new db.Account(params);

  // first registered account is an admin
  const isFirstAccount = (await db.Account.countDocuments({})) === 0;
  account.role = isFirstAccount ? Role.Admin : Role.User;
  account.verificationToken = randomTokenString();

  // hash password
  account.passwordHash = hash(params.password);

  // save account
  await account.save();

  // send email
  await sendVerificationEmail(account, origin, params.lang);
}

async function verifyEmail(params) {
  const account = await db.Account.findOne({ verificationToken: params.token });

  if (!account) throw translations[params.lang]["verification-failed"];

  account.verified = Date.now();
  account.verificationToken = undefined;
  await account.save();
}

async function forgotPassword({ email, lang }, origin) {
  const account = await db.Account.findOne({ email });

  // always return ok response to prevent email enumeration
  if (!account) return;

  // create reset token that expires after 24 hours
  account.resetToken = {
    token: randomTokenString(),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
  await account.save();

  // send email
  await sendPasswordResetEmail(account, origin, lang);
}

async function validateResetToken(params) {
  const account = await db.Account.findOne({
    "resetToken.token": params.token,
    "resetToken.expires": { $gt: Date.now() },
  });

  if (!account) throw translations[params.lang]["invalid-token"];
}

async function resetPassword({ token, password, lang }) {
  const account = await db.Account.findOne({
    "resetToken.token": token,
    "resetToken.expires": { $gt: Date.now() },
  });

  if (!account) throw translations[lang]["invalid-token"];

  // update password and remove reset token
  account.passwordHash = hash(password);
  account.passwordReset = Date.now();
  account.resetToken = undefined;
  await account.save();
}

async function getAll() {
  const accounts = await db.Account.find();
  return accounts.map((x) => basicDetails(x));
}

async function getById(id, lang) {
  const account = await getAccount(id, lang);
  return basicDetails(account);
}

async function create(params) {
  // validate
  if (await db.Account.findOne({ email: params.email })) {
    throw (
      'E-mail "' +
      params.email +
      translations[params.lang]["already-registered"]
    );
  }

  const account = new db.Account(params);
  account.verified = Date.now();

  // hash password
  account.passwordHash = hash(params.password);

  // save account
  await account.save();

  return basicDetails(account);
}

async function changePassword(id, params) {
  if (params.newPassword !== params.newPasswordRepeat)
    throw translations[params.lang]["password-must-match"];

  const account = await getAccount(id);

  if (!bcrypt.compareSync(params.currentPassword, account.passwordHash)) {
    throw translations[params.lang]["wrong-password"];
  }

  account.passwordHash = hash(params.newPassword);

  account.updated = Date.now();
  await account.save();

  return "OK";
}

async function update(id, params) {
  const account = await getAccount(id);

  // validate
  if (
    account.email !== params.email &&
    (await db.Account.findOne({ email: params.email }))
  ) {
    throw JSON.parse(
      'E-mail "' +
        params.email +
        translations[params.lang]["already-registered"]
    );
  }

  // hash password if it was entered
  if (params.password) {
    params.passwordHash = hash(params.password);
  }
  // copy params to account and save
  Object.assign(account, params);
  account.updated = Date.now();
  await account.save();

  return basicDetails(account);
}

async function _delete(id) {
  const account = await getAccount(id);
  await account.remove();
}

// helper functions

async function getAccount(id, lang) {
  if (!db.isValidId(id)) throw translations[params.lang]["no-account"];
  const account = await db.Account.findById(id);
  if (!account) throw translations[params.lang]["no-account"];
  return account;
}

async function getRefreshToken(token) {
  const refreshToken = await db.RefreshToken.findOne({ token }).populate(
    "account"
  );
  if (!refreshToken || !refreshToken.isActive) throw "No-account";
  return refreshToken;
}

function hash(password) {
  return bcrypt.hashSync(password, 10);
}

function generateJwtToken(account) {
  // create a jwt token containing the account id that expires in 15 minutes
  return jwt.sign({ sub: account.id, id: account.id }, jwtSecret, {
    expiresIn: "15m",
  });
}

function generateRefreshToken(account, ipAddress) {
  // create a refresh token that expires in 7 days
  return new db.RefreshToken({
    account: account.id,
    token: randomTokenString(),
    expires: new Date(Date.now() + 600000),
    createdByIp: ipAddress,
  });
}

function randomTokenString() {
  return crypto.randomBytes(40).toString("hex");
}

function basicDetails(account) {
  const {
    id,
    email,
    role,
    created,
    updated,
    isVerified,
    color,
    logo,
    hostname
  } = account;
  return { id, email, role, created, updated, isVerified, color, logo, hostname };
}

async function getActiveUsers() {
  const date_now = new Date();
  const all_users = await db.Account.find({});
  let active_users = [];
  for (const user of all_users) {
    let refreshTokens = await db.RefreshToken.find({
      account: user._id,
    }).sort({ expires: -1 });
    if (
      refreshTokens.length > 0 &&
      Date.parse(refreshTokens[0].expires) > date_now &&
      !refreshTokens[0].revoked
    ) {
      active_users.push(basicDetails(user));
    }
  }
  return active_users;
}

async function sendVerificationEmail(account, origin, lang) {
  let message;
  if (origin) {
    const verifyUrl = `${origin}/verifyEmail?token=${account.verificationToken}`;
    message = `<p>${translations[lang]["press-btn-verify"]}</p>
                   <p><a href="${verifyUrl}">${translations[lang]["click"]}</a></p>`;
  } else {
    message = `<p>${translations[lang]["use-token-verify"]}<code>/account/verify-email</code></p>
                   <p><code>${account.verificationToken}</code></p>`;
  }

  await sendEmail({
    to: account.email,
    subject: `Proxeon - ${translations[lang]["mail-confirm"]}`,
    html: `<h4>${translations[lang]["verify-your-email"]}</h4>
               <p>${translations[lang]["thanks-for-register"]}</p>
               ${message}`,
  });
}

async function sendPasswordResetEmail(account, origin, lang) {
  let message;
  if (origin) {
    const resetUrl = `${origin}/resetPassword?token=${account.resetToken.token}`;
    message = `<p>${translations[lang]["reset-passw-link"]}</p>
                   <p><a href="${resetUrl}">${translations[lang]["click"]}</a></p>`;
  } else {
    message = `<p>${translations[lang]["reset-passw-token"]}<code>/account/reset-password</code></p>
                   <p><code>${account.resetToken.token}</code></p>`;
  }

  await sendEmail({
    to: account.email,
    subject: `Proxeon - ${translations[lang]["reset-passw-title"]}`,
    html: `<h4>${translations[lang]["reset-passw-title"]}</h4>
               ${message}`,
  });
}
