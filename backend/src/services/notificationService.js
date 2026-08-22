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

export async function sendEmergencyCoordinatorNotification(coordUser, requestDetails) {
  const provider = process.env.MAIL_PROVIDER || 'console';

  if (provider === 'console') {
    console.log('==================================================');
    console.log(`[EMERGENCY COORDINATOR SMS/EMAIL SIMULATION]`);
    console.log(`To Coordinator: ${coordUser.name} <${coordUser.email}> (${coordUser.phone})`);
    console.log(`Urgent Action Requested on Blood Request for: ${requestDetails.patient_name} (${requestDetails.blood_group})`);
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
      to: coordUser.email,
      subject: '🚨 EMERGENCY: Action Overdue for assigned request',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 2px solid #C62828; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #C62828; margin-top: 0; margin-bottom: 5px;">🚨 EMERGENCY URGENT NOTICE</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 0; margin-bottom: 20px;">ASN Raju Blood Centre, Bhimavaram</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 16px; color: #0f172a; line-height: 1.5; font-weight: bold;">
            Dear ${coordUser.name},
          </p>
          <p style="font-size: 14px; color: #334155; line-height: 1.5;">
            An emergency follow-up has been issued for the blood request for <strong>${requestDetails.patient_name}</strong> (${requestDetails.blood_group}).
            You have not taken the required coordination action in the expected window. Please log in immediately and coordinate this case.
          </p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { success: true, provider: 'smtp' };
    } catch (err) {
      console.error('SMTP emergency dispatch failure:', err.message);
      throw new Error(`Emergency email delivery failed: ${err.message}`);
    }
  }
}

export async function sendCoordinatorEmailReminder(coordUser, requestDetails) {
  const provider = process.env.MAIL_PROVIDER || 'console';

  if (provider === 'console') {
    console.log('==================================================');
    console.log(`[COORDINATOR EMAIL REMINDER SIMULATION]`);
    console.log(`To Coordinator: ${coordUser.name} <${coordUser.email}> (${coordUser.phone})`);
    console.log(`Reminder: Action Required on Blood Request for: ${requestDetails.patient_name} (${requestDetails.blood_group})`);
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
      to: coordUser.email,
      subject: 'Reminder: Coordination Action Required',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #0284c7; margin-top: 0; margin-bottom: 5px;">Coordination Reminder</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 0; margin-bottom: 20px;">ASN Raju Blood Centre, Bhimavaram</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 16px; color: #0f172a; line-height: 1.5;">
            Dear ${coordUser.name},
          </p>
          <p style="font-size: 14px; color: #334155; line-height: 1.5;">
            This is a reminder to coordinate the blood request for <strong>${requestDetails.patient_name}</strong> (${requestDetails.blood_group}).
            Please contact the donor and log updates in the coordinator workspace.
          </p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { success: true, provider: 'smtp' };
    } catch (err) {
      console.error('SMTP reminder dispatch failure:', err.message);
      throw new Error(`Reminder email delivery failed: ${err.message}`);
    }
  }
}

export async function sendVerificationCodeEmail(user, code) {
  const provider = process.env.MAIL_PROVIDER || 'console';

  if (provider === 'console') {
    console.log('==================================================');
    console.log(`[VERIFICATION EMAIL SIMULATION]`);
    console.log(`To: ${user.name} <${user.email}>`);
    console.log(`Verification OTP Code: ${code}`);
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
      to: user.email,
      subject: 'Gift of Life – Verify Your Account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #C62828; margin-top: 0; margin-bottom: 5px;">Gift of Life</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 0; margin-bottom: 20px;">Blood Donation Platform</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 16px; color: #0f172a; line-height: 1.5; margin-bottom: 20px;">
            Here is your one-time verification code to verify your account:
          </p>
          <div style="margin: 30px 0; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #C62828; background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px dashed #cbd5e1; display: inline-block;">
              ${code}
            </div>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 30px;">
            This code will expire in 10 minutes.
          </p>
          <p style="font-size: 12px; color: #64748b; margin-top: 10px;">
            If you did not request this verification code, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { success: true, provider: 'smtp' };
    } catch (err) {
      console.error('SMTP verification code dispatch failure:', err.message);
      throw new Error(`Email delivery failed: ${err.message}`);
    }
  }

  console.log(`[EMAIL] Attempting delivery to ${user.email} via provider: ${provider}`);
  throw new Error(`Mail provider '${provider}' is not yet connected.`);
}

export async function sendVerificationCodeSMS(user, code) {
  const provider = process.env.SMS_PROVIDER || 'console';

  if (provider === 'console') {
    console.log('==================================================');
    console.log(`[VERIFICATION SMS SIMULATION]`);
    console.log(`To: ${user.phone}`);
    console.log(`Verification OTP Code: ${code}`);
    console.log('==================================================');
    return { success: true, provider: 'console' };
  }

  console.log(`[SMS] Attempting delivery to ${user.phone} via provider: ${provider}`);
  throw new Error(`SMS provider '${provider}' is not yet connected.`);
}
