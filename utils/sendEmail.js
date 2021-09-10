const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create reusable transporter object using the default STMP transport
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        // secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    // Send mail with defined transport object
    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`, // sender
        to: options.email, // list of receivers
        subject: options.subject, // subject
        text: options.message, // plain text body
        // html: 'hdjhdhd' // html body
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
