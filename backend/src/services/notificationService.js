import nodemailer from 'nodemailer';

export async function sendPasswordResetNotification(user, rawToken) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}`;
  const provider = process.env.MAIL_PROVIDER || 'console';

  if (provider === 'console') {
    console.log('==================================================');
    console.log(`[PASSWORD RESET EMAIL SIMULATION]`);
    console.log(`To: ${user.name} <${user.email}>`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log(`Raw Token: ${rawToken}`);
    console.log('==================================================');
    return { success: true, provider: 'console' };
  }

  if (provider === 'smtp') {
    const port = parseInt(process.env.MAIL_PORT || '587', 10);
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_FROM || 'no-reply@giftoflife.org',
      to: user.email,
      subject: 'Gift of Life – Password Reset Request',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #C62828; margin-top: 0; margin-bottom: 5px;">Gift of Life</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 0; margin-bottom: 20px;">Blood Donation Platform</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 16px; color: #0f172a; line-height: 1.5; margin-bottom: 20px;">
            We received a request to reset the password for your account.
          </p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${resetUrl}" style="background-color: #C62828; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 30px;">
            This password reset link will expire after 30 minutes.
          </p>
          <p style="font-size: 12px; color: #64748b; margin-top: 10px;">
            If you did not request this password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { success: true, provider: 'smtp' };
    } catch (err) {
      console.error('SMTP email dispatch failure:', err.message);
      throw new Error(`Email delivery failed: ${err.message}`);
    }
  }

  console.log(`[EMAIL] Attempting delivery to ${user.email} via provider: ${provider}`);
  throw new Error(`Mail provider '${provider}' is not yet connected.`);
}

export async function sendStaffInvitationNotification(invitation, rawToken) {
  const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${rawToken}`;
  const provider = process.env.MAIL_PROVIDER || 'console';

  if (provider === 'console') {
    console.log('==================================================');
    console.log(`[STAFF INVITATION EMAIL SIMULATION]`);
    console.log(`To: ${invitation.name} <${invitation.email}>`);
    console.log(`Role: ${invitation.role}`);
    console.log(`Invitation URL: ${invitationUrl}`);
    console.log(`Raw Token: ${rawToken}`);
    console.log('==================================================');
    return { success: true, provider: 'console' };
  }

  if (provider === 'smtp') {
    const port = parseInt(process.env.MAIL_PORT || '587', 10);
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: port,
      secure: port === 465,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_FROM || 'no-reply@giftoflife.org',
      to: invitation.email,
      subject: `Gift of Life – Invited as ${invitation.role}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #C62828; margin-top: 0; margin-bottom: 5px;">Gift of Life</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 0; margin-bottom: 20px;">Blood Donation Platform</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 16px; color: #0f172a; line-height: 1.5; margin-bottom: 20px;">
            You have been invited to join the Gift of Life team as a <strong>${invitation.role}</strong> at the ASN Raju Blood Centre, Bhimavaram.
          </p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${invitationUrl}" style="background-color: #C62828; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Accept Invitation & Setup Account</a>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 30px;">
            This invitation link will expire in 24 hours.
          </p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { success: true, provider: 'smtp' };
    } catch (err) {
      console.error('SMTP email dispatch failure:', err.message);
      throw new Error(`Email delivery failed: ${err.message}`);
    }
  }
}

export async function sendPasswordResetSMS(user, rawToken) {
  const provider = process.env.SMS_PROVIDER || 'console';

  if (provider === 'console') {
    console.log('==================================================');
    console.log(`[PASSWORD RESET SMS SIMULATION]`);
    console.log(`To: ${user.phone}`);
    console.log(`Verification token: ${rawToken}`);
    console.log('==================================================');
    return { success: true, provider: 'console' };
  }

  console.log(`[SMS] Attempting delivery to ${user.phone} via provider: ${provider}`);
  throw new Error(`SMS provider '${provider}' is not yet connected.`);
}
