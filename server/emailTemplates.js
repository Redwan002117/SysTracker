/**
 * SysTracker Email Templates
 * UI/UX Pro-Max: Glossy, Animated-look, Colorful, Dark-themed
 * Inline CSS for maximum email client compatibility
 */

// Base64 logo — use a hosted or data URI approach.
// We'll reference the logo via URL since emails support URLs.
const LOGO_URL = 'https://monitor.rico.bd/logo.png';
const BRAND_NAME = 'SysTracker';
const BRAND_TAGLINE = 'Real-Time System Intelligence';
const BRAND_URL = 'https://monitor.rico.bd';
const SUPPORT_EMAIL = 'SysTracker@rico.bd';
const CURRENT_YEAR = new Date().getFullYear();

// ─── Shared CSS Tokens (all inline for email compatibility) ────────────────────
const COLOR = {
    bg: '#0b1120',
    card: '#111827',
    cardBorder: '#1f2d45',
    surface: '#172033',
    accent: '#3b82f6',  // blue-500
    accentEnd: '#6d28d9',  // purple-700
    green: '#10b981',
    orange: '#f59e0b',
    red: '#ef4444',
    textPrim: '#f1f5f9',
    textSec: '#94a3b8',
    textMuted: '#64748b',
    white: '#ffffff',
};

// ─── Shared Building Blocks ────────────────────────────────────────────────────

function logoHtml() {
    return `
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
        <tr>
            <td align="center" style="padding-bottom: 10px;">
                <img src="${LOGO_URL}" alt="${BRAND_NAME} Logo"
                     width="56" height="56"
                     style="border-radius: 14px; box-shadow: 0 0 0 3px rgba(59,130,246,0.35); display: block;" />
            </td>
        </tr>
        <tr>
            <td align="center">
                <span style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: ${COLOR.white};">${BRAND_NAME}</span>
                <br>
                <span style="font-size: 12px; color: rgba(255,255,255,0.55); letter-spacing: 1.5px; text-transform: uppercase;">${BRAND_TAGLINE}</span>
            </td>
        </tr>
    </table>`;
}

function headerHtml(accentColor1 = '#3b82f6', accentColor2 = '#6d28d9') {
    return `
    <td align="center" style="
        background: linear-gradient(135deg, ${accentColor1} 0%, ${accentColor2} 100%);
        padding: 40px 30px 32px;
        border-radius: 16px 16px 0 0;
    ">
        ${logoHtml()}
    </td>`;
}

function dividerHtml() {
    return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr><td style="border-top: 1px solid ${COLOR.cardBorder}; padding: 0;"></td></tr>
    </table>`;
}

function buttonHtml(label, href, color = COLOR.accent) {
    return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px auto 0;">
        <tr>
            <td align="center">
                <a href="${href}" style="
                    display: inline-block;
                    background: linear-gradient(135deg, ${color} 0%, #2563eb 100%);
                    color: #ffffff;
                    text-decoration: none;
                    padding: 14px 36px;
                    border-radius: 10px;
                    font-weight: 700;
                    font-size: 15px;
                    letter-spacing: 0.3px;
                    box-shadow: 0 4px 20px rgba(59,130,246,0.45);
                    border: 1px solid rgba(255,255,255,0.12);
                ">${label}</a>
            </td>
        </tr>
    </table>`;
}

function infoCardHtml(rows) {
    const rowsHtml = rows.map(([label, value]) => `
        <tr>
            <td style="
                padding: 10px 16px;
                font-size: 12px;
                color: ${COLOR.textMuted};
                text-transform: uppercase;
                letter-spacing: 0.8px;
                font-weight: 600;
                white-space: nowrap;
                width: 35%;
            ">${label}</td>
            <td style="
                padding: 10px 16px;
                font-size: 14px;
                color: ${COLOR.textPrim};
                font-weight: 500;
            ">${value}</td>
        </tr>
    `).join('');

    return `
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%"
           style="
               background: ${COLOR.surface};
               border-radius: 12px;
               border: 1px solid ${COLOR.cardBorder};
               margin: 20px 0;
               overflow: hidden;
           ">
        ${rowsHtml}
    </table>`;
}

function badgeHtml(text, color = COLOR.green) {
    return `<span style="
        display: inline-block;
        background: ${color}22;
        color: ${color};
        border: 1px solid ${color}55;
        border-radius: 50px;
        font-size: 12px;
        font-weight: 600;
        padding: 4px 12px;
        letter-spacing: 0.5px;
    ">${text}</span>`;
}

function signatureHtml() {
    return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
        <tr>
            <td style="
                padding: 20px;
                background: ${COLOR.surface};
                border-radius: 12px;
                border: 1px solid ${COLOR.cardBorder};
            ">
                <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                    <tr>
                        <td style="vertical-align: middle; padding-right: 14px; width: 44px;">
                            <img src="${LOGO_URL}" alt="Logo" width="40" height="40"
                                 style="border-radius: 10px; display: block;" />
                        </td>
                        <td style="vertical-align: middle;">
                            <span style="font-size: 14px; font-weight: 700; color: ${COLOR.textPrim};">${BRAND_NAME} Team</span>
                            <br>
                            <span style="font-size: 12px; color: ${COLOR.textMuted};">Automated Notification System</span>
                            <br>
                            <a href="${BRAND_URL}" style="font-size: 12px; color: ${COLOR.accent}; text-decoration: none;">${BRAND_URL}</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>`;
}

function footerHtml() {
    return `
    <td align="center" style="
        background: ${COLOR.bg};
        padding: 24px 30px;
        border-top: 1px solid ${COLOR.cardBorder};
        border-radius: 0 0 16px 16px;
    ">
        <p style="font-size: 12px; color: ${COLOR.textMuted}; margin: 0 0 8px;">
            &copy; ${CURRENT_YEAR} ${BRAND_NAME}. All rights reserved.
        </p>
        <p style="font-size: 11px; color: ${COLOR.textMuted}; margin: 0;">
            This is an automated notification. Please do not reply.<br>
            <a href="mailto:${SUPPORT_EMAIL}" style="color: ${COLOR.accent}; text-decoration: none;">${SUPPORT_EMAIL}</a>
        </p>
    </td>`;
}

function wrapHtml(title, bodyRows) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | ${BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.bg};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-text-size-adjust:none;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
           style="background:${COLOR.bg};padding:40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0"
                       style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;border:1px solid ${COLOR.cardBorder};box-shadow:0 25px 50px rgba(0,0,0,0.5);">
                    <tr>${bodyRows}</tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function contentWrap(html) {
    return `
    <td style="background:${COLOR.card};padding:36px 32px;">
        ${html}
    </td>`;
}

// ─── Template Exports ──────────────────────────────────────────────────────────

module.exports = {

    // 1. FORGOT PASSWORD EMAIL
    forgotPassword: (username, resetLink) => {
        const body = `
            <h2 style="margin:0 0 6px;font-size:22px;color:${COLOR.textPrim};font-weight:700;">Reset Your Password</h2>
            <p style="margin:0 0 24px;font-size:14px;color:${COLOR.textMuted};">We received a request to reset the password for your account.</p>

            ${infoCardHtml([
            ['Account', `<strong>${username}</strong>`],
            ['Requested', new Date().toLocaleString()],
            ['Expires In', '1 Hour'],
        ])}

            <p style="font-size:14px;color:${COLOR.textSec};line-height:1.7;margin:20px 0 0;">
                Click the button below to set a new password. If you didn't request a reset, you can safely ignore this email.
            </p>

            ${buttonHtml('🔐 Reset My Password', resetLink)}

            <p style="font-size:12px;color:${COLOR.textMuted};margin:20px 0 0;line-height:1.6;">
                Or copy this link:<br>
                <a href="${resetLink}" style="color:${COLOR.accent};word-break:break-all;">${resetLink}</a>
            </p>

            ${dividerHtml()}
            ${signatureHtml()}
        `;
        return wrapHtml('Reset Password', headerHtml('#ef4444', '#b91c1c') + contentWrap(body) + footerHtml());
    },

    // 2. SMTP TEST EMAIL
    testEmail: (email) => {
        const body = `
            <h2 style="margin:0 0 6px;font-size:22px;color:${COLOR.textPrim};font-weight:700;">SMTP Test Successful</h2>
            <p style="margin:0 0 24px;font-size:14px;color:${COLOR.textMuted};">Your email configuration is working correctly.</p>

            <table role="presentation" width="100%" style="
                background:${COLOR.green}11;
                border:1px solid ${COLOR.green}44;
                border-radius:12px;
                padding:18px;
                margin-bottom:20px;
            ">
                <tr>
                    <td>
                        <span style="font-size:28px;">✅</span>
                        <span style="font-size:16px;font-weight:700;color:${COLOR.green};margin-left:10px;vertical-align:middle;">Connection Verified</span>
                        <p style="margin:8px 0 0;font-size:13px;color:${COLOR.textSec};">
                            Email notifications are now active. SysTracker will use this configuration to deliver alerts, system reports, and security notifications.
                        </p>
                    </td>
                </tr>
            </table>

            ${infoCardHtml([
            ['Delivery To', email],
            ['Status', `${badgeHtml('OK', COLOR.green)}`],
            ['Sent At', new Date().toLocaleString()],
        ])}

            ${dividerHtml()}
            ${signatureHtml()}
        `;
        return wrapHtml('SMTP Test', headerHtml('#10b981', '#065f46') + contentWrap(body) + footerHtml());
    },

    // 3. SYSTEM ALERT EMAIL
    alertEmail: (machineName, alerts) => {
        const alertRows = alerts.map(a => `
            <tr>
                <td style="padding:12px 16px;border-bottom:1px solid ${COLOR.cardBorder};">
                    <span style="font-size:13px;font-weight:700;color:${COLOR.orange};">${a.type}</span><br>
                    <span style="font-size:13px;color:${COLOR.textSec};">${a.message}</span>
                </td>
            </tr>
        `).join('');

        const body = `
            <h2 style="margin:0 0 6px;font-size:22px;color:${COLOR.textPrim};font-weight:700;">System Alert Detected</h2>
            <p style="margin:0 0 24px;font-size:14px;color:${COLOR.textMuted};">
                Machine <strong>${machineName}</strong> has triggered ${alerts.length} alert(s).
            </p>

            <table role="presentation" width="100%" style="
                background:${COLOR.surface};border:1px solid ${COLOR.cardBorder};
                border-radius:12px;overflow:hidden;margin-bottom:20px;
            ">
                <tr>
                    <td style="
                        padding:12px 16px;background:${COLOR.orange}22;
                        border-bottom:1px solid ${COLOR.cardBorder};
                        font-size:12px;font-weight:700;color:${COLOR.orange};
                        text-transform:uppercase;letter-spacing:1px;
                    ">⚠ Active Alerts</td>
                </tr>
                ${alertRows}
            </table>

            ${buttonHtml('📊 View Dashboard', BRAND_URL, COLOR.orange)}

            ${dividerHtml()}
            ${signatureHtml()}
        `;
        return wrapHtml('System Alert', headerHtml('#f59e0b', '#b45309') + contentWrap(body) + footerHtml());
    },

    // 4. WELCOME / ACCOUNT CREATED EMAIL
    welcomeEmail: (username) => {
        const body = `
            <h2 style="margin:0 0 6px;font-size:22px;color:${COLOR.textPrim};font-weight:700;">Welcome to ${BRAND_NAME}! 🚀</h2>
            <p style="margin:0 0 24px;font-size:14px;color:${COLOR.textMuted};">Your admin account has been created.</p>

            ${infoCardHtml([
            ['Username', `<strong>${username}</strong>`],
            ['Role', 'Administrator'],
            ['Joined', new Date().toLocaleDateString()],
        ])}

            <p style="font-size:14px;color:${COLOR.textSec};line-height:1.7;margin:20px 0;">
                You now have full access to the SysTracker dashboard. Monitor all your systems, set up email alerts, and manage agent connections from one centralized hub.
            </p>

            ${buttonHtml('🖥 Go to Dashboard', BRAND_URL)}

            ${dividerHtml()}
            ${signatureHtml()}
        `;
        return wrapHtml('Welcome', headerHtml('#3b82f6', '#6d28d9') + contentWrap(body) + footerHtml());
    },

    // 5. PASSWORD CHANGED CONFIRMATION
    passwordChangedEmail: (username) => {
        const body = `
            <h2 style="margin:0 0 6px;font-size:22px;color:${COLOR.textPrim};font-weight:700;">Password Changed</h2>
            <p style="margin:0 0 24px;font-size:14px;color:${COLOR.textMuted};">Your password has been updated successfully.</p>

            ${infoCardHtml([
            ['Account', `<strong>${username}</strong>`],
            ['Changed At', new Date().toLocaleString()],
            ['Status', `${badgeHtml('Secured', COLOR.green)}`],
        ])}

            <table role="presentation" width="100%" style="
                background:${COLOR.red}11;border:1px solid ${COLOR.red}44;
                border-radius:12px;padding:16px;margin:20px 0;
            ">
                <tr>
                    <td>
                        <span style="font-size:14px;color:${COLOR.red};">⚠ Wasn't you?</span>
                        <p style="margin:6px 0 0;font-size:13px;color:${COLOR.textSec};">
                            If you didn't make this change, contact your administrator immediately.
                        </p>
                    </td>
                </tr>
            </table>

            ${dividerHtml()}
            ${signatureHtml()}
        `;
        return wrapHtml('Password Changed', headerHtml('#10b981', '#065f46') + contentWrap(body) + footerHtml());
    },
};
