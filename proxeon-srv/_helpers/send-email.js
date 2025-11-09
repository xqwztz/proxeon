const nodemailer = require('nodemailer');

// Use environment variables, fallback to config.json for backward compatibility
const getEmailConfig = () => {
    if (process.env.EMAIL_FROM && process.env.EMAIL_HOST) {
        return {
            emailFrom: process.env.EMAIL_FROM,
            smtpOptions: {
                host: process.env.EMAIL_HOST,
                port: parseInt(process.env.EMAIL_PORT || '587'),
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            }
        };
    }
    
    // Fallback to config.json
    try {
        return require('config.json');
    } catch (e) {
        throw new Error('Email configuration not found! Set EMAIL_FROM, EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD in .env or use config.json');
    }
};

module.exports = sendEmail;

async function sendEmail({ to, subject, html, from }) {
    const config = getEmailConfig();
    const emailFrom = from || config.emailFrom;
    const transporter = nodemailer.createTransport(config.smtpOptions);
    await transporter.sendMail({ from: emailFrom, to, subject, html });
}