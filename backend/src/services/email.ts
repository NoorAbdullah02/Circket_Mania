// Email service using Brevo (Sendinblue) API

interface EmailParams {
  to: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

// Get config dynamically to ensure env vars are loaded
function getConfig() {
  return {
    BREVO_API_KEY: (process.env.BREVO_API_KEY || '').trim(),
    BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || 'noreply@cricketmania.com',
    BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME || 'ICE Cricket Mania',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  };
}

export async function sendEmail({ to, toName, subject, htmlContent }: EmailParams): Promise<boolean> {
  try {
    const config = getConfig();
    console.log(`[Email Service] Attempting to send email to: ${to}`);
    console.log(`[Email Service] Sender: ${config.BREVO_SENDER_NAME} <${config.BREVO_SENDER_EMAIL}>`);
    console.log(`[Email Service] API Key check: ${!config.BREVO_API_KEY ? 'MISSING' : 'PRESENT'}`);

    // If no API key, log to console (development mode)
    if (!config.BREVO_API_KEY || config.BREVO_API_KEY === 'your-brevo-api-key') {
      console.log('📧 [EMAIL - DEV MODE] Email would be sent:');
      console.log(`  To: ${to} (${toName})`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Content Preview: ${htmlContent.substring(0, 150)}...`);
      return true;
    }

    console.log(`[Email Service] Using Brevo API to send email to ${to} with subject "${subject}"`);
    const emailPayload = {
      sender: { name: config.BREVO_SENDER_NAME, email: config.BREVO_SENDER_EMAIL },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent,
    };

    console.log(`[Email Service] Payload:`, JSON.stringify(emailPayload, null, 2));

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': config.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Email Service] ❌ Email send failed to ${to}:`);
      console.error(`  Status: ${response.status}`);
      console.error(`  Error Details: ${errorText}`);
      try {
        const errorJson = JSON.parse(errorText);
        console.error(`  Parsed Error: ${JSON.stringify(errorJson, null, 2)}`);
      } catch (e) {
        // errorText is not JSON
      }
      return false;
    }

    const responseData = await response.json();
    console.log(`✅ [Email Service] Email successfully sent to ${to}: ${subject}`);
    console.log(`  Brevo Response: ${responseData?.messageId ? 'Message ID: ' + responseData.messageId : 'OK'}`);
    return true;
  } catch (error) {
    console.error('[Email Service] Error:', error);
    return false;
  }
}

// Email templates
export function playerSelectedEmail(playerName: string, teamName: string, activationLink: string, teamToken?: string): EmailParams {
  return {
    to: '',
    toName: playerName,
    subject: `🏏 You've been selected for ${teamName}! - ICE Cricket Mania Season 2`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #fff; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #facc15; font-size: 28px;">🏏 ICE Cricket Mania</h1>
          <p style="color: #38bdf8; font-size: 16px;">Season 2</p>
        </div>
        <h2 style="color: #22c55e;">Congratulations, ${playerName}! 🎉</h2>
        <p style="color: #e2e8f0; line-height: 1.8; font-size: 16px;">
          You have been selected for <strong style="color: #facc15;">${teamName}</strong> in ICE Cricket Mania – Season 2!
        </p>
        ${teamToken ? `
        <div style="background: #1e293b; border: 1px dashed #38bdf8; padding: 20px; border-radius: 12px; margin: 25px 0; text-align: center;">
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 10px; margin-top: 0;">YOUR TEAM VERIFICATION TOKEN</p>
            <span style="color: #38bdf8; font-size: 32px; font-weight: bold; letter-spacing: 8px;">${teamToken}</span>
        </div>
        ` : ''}
        <p style="color: #e2e8f0; line-height: 1.8; font-size: 16px;">
          Click the button below to activate your account and set your password. You will need the token above to unlock your profile later.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" style="background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
            Activate My Account
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">This link will expire in 48 hours.</p>
        <hr style="border: 1px solid #1e293b; margin: 30px 0;" />
        <p style="color: #64748b; font-size: 12px; text-align: center;">ICE Cricket Mania – Season 2 | University Tournament</p>
      </div>
    `,
  };
}

export function captainSelectedEmail(playerName: string, teamName: string): EmailParams {
  return {
    to: '',
    toName: playerName,
    subject: `👑 You're the Captain of ${teamName}! - ICE Cricket Mania Season 2`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #fff; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #facc15; font-size: 28px;">🏏 ICE Cricket Mania</h1>
          <p style="color: #38bdf8; font-size: 16px;">Season 2</p>
        </div>
        <h2 style="color: #facc15;">👑 Captain ${playerName}!</h2>
        <p style="color: #e2e8f0; line-height: 1.8; font-size: 16px;">
          You have been selected as the <strong style="color: #facc15;">Captain</strong> of <strong style="color: #38bdf8;">${teamName}</strong>!
        </p>
        <p style="color: #e2e8f0; line-height: 1.8; font-size: 16px;">Lead your team to victory! 🏆</p>
        <hr style="border: 1px solid #1e293b; margin: 30px 0;" />
        <p style="color: #64748b; font-size: 12px; text-align: center;">ICE Cricket Mania – Season 2</p>
      </div>
    `,
  };
}

export function matchScheduledEmail(playerName: string, teamA: string, teamB: string, date: string, time: string, venue: string): EmailParams {
  return {
    to: '',
    toName: playerName,
    subject: `📅 Match Scheduled: ${teamA} vs ${teamB} - ICE Cricket Mania`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #fff; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #facc15; font-size: 28px;">🏏 ICE Cricket Mania</h1>
        </div>
        <h2 style="color: #38bdf8;">📅 Match Scheduled</h2>
        <div style="background: #111827; padding: 24px; border-radius: 12px; margin: 20px 0;">
          <p style="color: #facc15; font-size: 20px; text-align: center; font-weight: bold;">${teamA} vs ${teamB}</p>
          <p style="color: #e2e8f0; text-align: center;">📅 ${date} | 🕐 ${time}</p>
          <p style="color: #e2e8f0; text-align: center;">📍 ${venue}</p>
        </div>
        <hr style="border: 1px solid #1e293b; margin: 30px 0;" />
        <p style="color: #64748b; font-size: 12px; text-align: center;">ICE Cricket Mania – Season 2</p>
      </div>
    `,
  };
}

export function finalMatchEmail(playerName: string, teamA: string, teamB: string, date: string, time: string, venue: string): EmailParams {
  return {
    to: '',
    toName: playerName,
    subject: `🏆 FINAL MATCH: ${teamA} vs ${teamB} - ICE Cricket Mania`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #fff; padding: 40px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #facc15; font-size: 28px;">🏆 ICE Cricket Mania</h1>
          <p style="color: #ef4444; font-size: 20px; font-weight: bold;">🔥 THE GRAND FINAL 🔥</p>
        </div>
        <div style="background: linear-gradient(135deg, #111827, #1e293b); padding: 30px; border-radius: 16px; border: 2px solid #facc15; margin: 20px 0;">
          <p style="color: #facc15; font-size: 24px; text-align: center; font-weight: bold;">${teamA} vs ${teamB}</p>
          <p style="color: #e2e8f0; text-align: center; font-size: 16px;">📅 ${date} | 🕐 ${time}</p>
          <p style="color: #e2e8f0; text-align: center; font-size: 16px;">📍 ${venue}</p>
        </div>
        <p style="color: #e2e8f0; text-align: center; font-size: 16px;">Don't miss it! 🎉</p>
      </div>
    `,
  };
}
