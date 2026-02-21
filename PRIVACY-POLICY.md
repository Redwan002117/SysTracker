# Privacy Policy for SysTracker

**Last Updated:** February 21, 2026  
**Version:** 3.1.2

---

## Overview

SysTracker is a system monitoring application for Windows that provides real-time performance tracking and analytics. This privacy policy explains how SysTracker collects, uses, and protects your information.

---

## Information We Collect

### 1. System Information

SysTracker collects the following system metrics:

- **CPU Usage** - Processor utilization percentage
- **Memory Usage** - RAM consumption and availability
- **Disk Usage** - Storage space and disk I/O
- **Network Information** - Bandwidth usage
- **Process Information** - Running applications and services
- **System Specifications** - Hardware and OS details
- **Performance Metrics** - System benchmarks and statistics

### 2. User Configuration Data

- **Dashboard Settings** - User preferences and customizations
- **Application Preferences** - Theme, language, layout choices
- **Authentication Data** - Login credentials (stored locally, encrypted)
- **Custom Alerts** - User-defined monitoring rules

### 3. Log Information

- **Application Logs** - Operational events and errors
- **Debug Information** - System diagnostics (optional)
- **Performance History** - Historical monitoring data

### 4. Information NOT Collected

SysTracker does **NOT** collect:

- ❌ Personal identification information (name, email, address, etc.)
- ❌ Browsing history or web activity
- ❌ File contents or file system details
- ❌ User keystrokes or input monitoring
- ❌ Location information or GPS data
- ❌ Camera or microphone access
- ❌ Biometric data
- ❌ Financial or payment information

---

## How We Use Information

### 1. Core Functionality

Your system information is used to:

- Display real-time performance metrics
- Calculate system health statistics
- Generate performance reports
- Create historical trend analysis
- Provide performance alerts and notifications

### 2. System Improvement

- Identify performance bottlenecks
- Optimize monitoring algorithms
- Improve dashboard responsiveness
- Enhance feature reliability

### 3. Error Prevention

- Detect and prevent system crashes
- Diagnose performance issues
- Troubleshoot application errors
- Improve stability and reliability

### 4. Feature Enhancement

- Develop new monitoring features
- Improve existing functionality
- Provide better insights and analytics
- Enhance user experience

---

## Data Storage

### Local Storage

All data is stored **locally on your device** by default:

- **Database Location:** `%ProgramFiles%\SysTracker\data\systracker.db`
- **Configuration:** `%AppData%\SysTracker\config.json`
- **Logs:** `%AppData%\SysTracker\logs\`

### Encryption

- User credentials are hashed using industry-standard algorithms
- API tokens are securely stored
- Sensitive configuration is encrypted at rest

### Data Retention

- **Current Data:** Kept indefinitely while application is active
- **Historical Data:** Retained for 90 days by default (configurable)
- **Log Files:** Rotated weekly, kept for 30 days
- **User Deletion:** All data can be deleted via application settings

---

## Information Sharing

### We Do NOT Share

SysTracker does NOT:

- ❌ Sell user data to third parties
- ❌ Share data with advertisers
- ❌ Transfer data to external services without consent
- ❌ Share data with other applications
- ❌ Send data to analytics services (by default)

### Optional Cloud Features

If you enable optional cloud features (future version):

- You will be explicitly prompted
- Clear consent is required before enabling
- Only explicitly enabled data is shared
- You can disable at any time

---

## Third-Party Services

### Dependencies

SysTracker uses the following open-source libraries:

- **ExpressJS** - Web server framework
- **Socket.IO** - Real-time communication
- **SQLite3** - Database engine
- **React** - User interface framework
- **JSONWebToken** - Authentication

None of these dependencies access your data or send information externally.

### External URLs

SysTracker may connect to:

- ❌ No external services by default
- ✅ GitHub (optional) - For update checking
- ✅ Windows Update - For system updates

---

## User Rights

### Your Privacy Rights

You have the right to:

1. **Access** - View all data collected about your system
2. **Delete** - Remove any stored data at any time
3. **Control** - Configure what data is collected
4. **Export** - Export your performance history
5. **Disable** - Turn off monitoring features

### Data Access

To access your data:

1. Open SysTracker Dashboard
2. Go to Settings → Data Management
3. Click "Export Data"
4. Select date range and format

### Data Deletion

To delete stored data:

1. Open SysTracker Dashboard
2. Go to Settings → Privacy
3. Click "Delete All Data"
4. Confirm deletion

### Disable Monitoring

To disable specific monitoring:

1. Open Settings → Monitoring
2. Toggle features on/off as needed
3. Changes take effect immediately

---

## Security Measures

### Application Security

- **Local-Only by Default** - No network communication required
- **Authentication** - Multi-user sign-in support
- **Encryption** - Sensitive data encrypted at rest
- **Validation** - Input validation on all fields
- **Error Handling** - Secure error handling

### Transport Security

- If using remote access: HTTPS/TLS encryption required
- API communications use JSON Web Tokens (JWT)
- No passwords transmitted in plain text
- CORS protection enabled

### System Security

- Runs with appropriate privilege levels
- Does not modify system files unnecessarily
- Respects Windows permission model
- Compatible with Windows Security

---

## Children's Privacy

SysTracker is designed for system administrators and technical users. We do not knowingly collect information from children under 13. If you believe we've collected information from a child, contact us immediately.

---

## Changes to This Policy

We may update this privacy policy to reflect:

- Changes in our practices
- New features or capabilities
- Legal or regulatory requirements
- Improved clarity or transparency

**Notification:** Material changes will be announced in-app and on our GitHub page.

---

## Data Breach Notification

In the unlikely event of a security incident:

1. We will investigate immediately
2. Affected users will be notified
3. Steps taken to secure data will be disclosed
4. Support resources will be provided

Since data is stored locally, server breaches do not affect personal systems. Users remain responsible for their local system security.

---

## Compliance

### Standards and Regulations

SysTracker complies with:

- **GDPR** - General Data Protection Regulation (EU)
- **CCPA** - California Consumer Privacy Act
- **COPPA** - Children's Online Privacy Protection Act
- **Windows Privacy Guidelines** - Microsoft standards

### Data Minimization

We follow the principle of data minimization:

- Only collect data necessary for functionality
- No unnecessary personal information collection
- Regular audit of data collection practices
- User control over data scope

---

## Regional Variations

### European Union (GDPR)

EU users have additional rights:

- Right to be forgotten (data deletion)
- Data portability (export all data)
- Right to object to processing
- Automated decision-making clarity

**Contact:** EU GDPR requests can be sent to support@systracker.app

### California (CCPA)

California residents have the right to:

- Know what personal information is collected
- Delete personal information
- Opt-out of information sharing (not applicable - we don't share)
- Non-discrimination for exercising rights

---

## Contact Us

For privacy-related questions or concerns:

### Support Channels

- **GitHub Issues:** https://github.com/Redwan002117/SysTracker/issues
- **Contact Form:** Via GitHub repository
- **Email:** support@systracker.app (when available)

### Privacy Inquiries

For specific privacy inquiries or data requests:

1. Visit GitHub Issues
2. Select the "Privacy" label
3. Describe your request clearly
4. Include any relevant details

### Response Time

We aim to respond to privacy requests within:

- **7 days** - Acknowledgment of receipt
- **30 days** - Full response and resolution

---

## Important Notes

### Local Monitoring

SysTracker is installed locally on your device. You are responsible for:

- Keeping your operating system updated
- Maintaining strong login credentials
- Enabling Windows Firewall and security features
- Monitoring access to your system

### Admin Privileges

Some features require administrator access. Users must:

- Grant appropriate permissions
- Understand security implications
- Monitor who has administrative access
- Revoke access when no longer needed

### Third-Party Tools

If you integrate SysTracker with third-party tools:

- Review their privacy policies
- Understand data sharing implications
- Configure appropriate permissions
- Monitor integrations

---

## FAQ

### Q: Does SysTracker send my data to the cloud?
**A:** No. By default, all data remains on your local machine. Optional cloud features (if available) require explicit user consent.

### Q: Can I access my data from another computer?
**A:** To access data remotely, you can enable remote dashboard access (requires configuration). Data transfer uses encrypted connections.

### Q: How often is data collected?
**A:** System metrics are collected in real-time (multiple times per second). Performance snapshots are stored according to your configured retention policy.

### Q: Can I export my monitoring data?
**A:** Yes. Dashboard Settings → Data Management → Export Data. Choose your format and date range.

### Q: What happens to my data if I uninstall SysTracker?
**A:** All data is removed unless you manually backup your database file. You can configure automatic backups before uninstalling.

### Q: Is my data encrypted?
**A:** User credentials and sensitive settings are encrypted. System monitoring data is stored in local SQLite database with permission-based security.

### Q: Who has access to my monitoring data?
**A:** Only you and other users on your system who log into SysTracker. No external services have access by default.

---

## Acknowledgment

By installing and using SysTracker, you acknowledge that:

1. You have read and understood this Privacy Policy
2. You consent to the data collection practices described
3. You understand your rights regarding your data
4. You can contact us with privacy concerns

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 3.1.2 | Feb 21, 2026 | Initial comprehensive privacy policy |
| 3.1.1 | Jan 15, 2026 | Beta version |

---

**SysTracker Privacy Policy**  
Maintained by: Development Team  
Last Updated: February 21, 2026  
Status: ✅ Certification Ready

---

*This privacy policy is effective immediately upon publication. We reserve the right to modify this policy at our discretion. Users will be notified of material changes.*
