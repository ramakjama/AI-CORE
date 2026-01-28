# AIT-CORE Soriano Mediadores - User Manual

**Version 1.0.0** | Last Updated: January 28, 2026

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Applications Overview](#2-applications-overview)
3. [Web Application](#3-web-application)
4. [Admin Panel](#4-admin-panel)
5. [Suite Portal](#5-suite-portal)
6. [Mobile Application](#6-mobile-application)
7. [Module Management](#7-module-management)
8. [AI Agents](#8-ai-agents)
9. [Keyboard Shortcuts](#9-keyboard-shortcuts)
10. [Frequently Asked Questions](#10-frequently-asked-questions)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Getting Started

### 1.1 Introduction

Welcome to AIT-CORE Soriano Mediadores, the next-generation intelligent ERP platform designed specifically for insurance brokerage firms. This comprehensive system combines 57 specialized modules with 16 AI agents to automate and optimize every aspect of your insurance business.

### 1.2 System Requirements

**Minimum Requirements:**
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Internet connection: 5 Mbps minimum
- Screen resolution: 1366x768 minimum
- 4GB RAM (for optimal performance)

**Recommended Requirements:**
- Chrome 120+ or Firefox 120+
- Internet connection: 25 Mbps or higher
- Screen resolution: 1920x1080 or higher
- 8GB RAM or more

### 1.3 First Time Login

1. **Access the Platform**
   - Navigate to: `https://your-company.sorianomediadores.es`
   - Or use your custom domain

2. **Enter Credentials**
   - Email: Provided by your administrator
   - Password: Temporary password (you'll be prompted to change it)
   - Click "Sign In"

3. **Two-Factor Authentication (2FA)**
   - Scan the QR code with Google Authenticator or similar app
   - Enter the 6-digit code
   - Save backup codes in a secure location

4. **Complete Your Profile**
   - Upload a profile picture
   - Set your preferences (language, timezone, theme)
   - Configure notification settings

5. **Dashboard Overview**
   - Take the interactive tour (recommended for new users)
   - Explore the main dashboard
   - Review quick start guides

### 1.4 User Interface Overview

The platform follows a consistent layout across all applications:

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] AIT-CORE        Search...    🔔 👤 ⚙️              │ Header
├─────────────────────────────────────────────────────────────┤
│ 📊 Dashboard   │                                            │
│ 📋 Policies    │                                            │
│ 💰 Claims      │         MAIN CONTENT AREA                  │
│ 👥 Clients     │                                            │
│ 📊 Analytics   │                                            │
│ ⚙️ Settings    │                                            │
│                │                                            │
│   Sidebar      │         Content                            │
│                │                                            │
└────────────────┴────────────────────────────────────────────┘
```

**Key UI Elements:**
- **Header**: Global navigation, search, notifications, user menu
- **Sidebar**: Main application navigation
- **Content Area**: Where you'll do most of your work
- **Footer**: Quick links, system status, help

---

## 2. Applications Overview

AIT-CORE includes 16 integrated applications:

### 2.1 Core Applications

| Application | Purpose | Port | URL |
|------------|---------|------|-----|
| **Web App** | Main insurance management interface | 3001 | https://app.domain.com |
| **Admin Panel** | System administration and monitoring | 3002 | https://admin.domain.com |
| **Suite Portal** | AI-powered productivity suite | 3004 | https://suite.domain.com |
| **Mobile App** | iOS/Android mobile access | - | App Store / Play Store |

### 2.2 Suite Portal Applications (16 apps)

The Suite Portal includes 16 productivity applications:

1. **Documents**: Word processor with real-time collaboration
2. **Spreadsheets**: Advanced spreadsheet with formulas and charts
3. **Presentations**: Create stunning presentations
4. **Forms**: Build custom forms and surveys
5. **Calendar**: Manage schedules and appointments
6. **Mail**: Integrated email client
7. **Tasks**: Task management and to-do lists
8. **Notes**: Quick note-taking application
9. **Drive**: Cloud file storage and sharing
10. **Chat**: Team messaging and collaboration
11. **Video Calls**: HD video conferencing
12. **Analytics**: Business intelligence dashboard
13. **CRM**: Customer relationship management
14. **Projects**: Project management tool
15. **Wiki**: Knowledge base and documentation
16. **AI Assistant**: Intelligent virtual assistant

---

## 3. Web Application

The main web application is your central hub for insurance management.

### 3.1 Dashboard

**Overview:**
The dashboard provides a real-time snapshot of your business.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Welcome back, [Name]!                                  │
├───────────────┬───────────────┬───────────────┬─────────┤
│  Active       │   Pending     │   Claims      │ Revenue │
│  Policies     │   Quotes      │   This Month  │ YTD     │
│  1,234        │   56          │   23          │ €1.2M   │
├───────────────┴───────────────┴───────────────┴─────────┤
│  📊 Revenue Chart (Last 12 Months)                      │
│  [Interactive Chart]                                    │
├─────────────────────────────────────────────────────────┤
│  Recent Activity          │  Quick Actions              │
│  • New policy created     │  ➕ New Policy              │
│  • Claim submitted        │  📄 Create Quote            │
│  • Payment received       │  👤 Add Client              │
│  • Policy renewed         │  💼 Submit Claim            │
└─────────────────────────────────────────────────────────┘
```

**Key Metrics:**
- **Active Policies**: Total number of active insurance policies
- **Pending Quotes**: Quotes awaiting customer decision
- **Claims This Month**: Claims submitted in current month
- **Revenue YTD**: Year-to-date revenue

**Customization:**
- Click the ⚙️ icon to customize your dashboard
- Drag and drop widgets to rearrange
- Add/remove metrics based on your role
- Set refresh intervals for real-time data

### 3.2 Policy Management

**Creating a New Policy:**

1. Navigate to **Policies** > **New Policy**
2. Select policy type (Auto, Home, Life, Health, etc.)
3. Fill in required information:
   - **Client Information**: Select existing client or create new
   - **Coverage Details**: Coverage amount, deductibles, limits
   - **Premium**: System calculates automatically or enter manually
   - **Effective Dates**: Start and end dates
   - **Documents**: Upload required documents

4. Click **Calculate Premium** to get AI-powered pricing
5. Review and adjust as needed
6. Click **Create Policy**

**Policy Details Screen:**

```
┌─────────────────────────────────────────────────────────┐
│  Policy #AUT-2024-001234            Status: ✅ Active    │
├─────────────────────────────────────────────────────────┤
│  Client: John Doe                   Phone: +34 600...   │
│  Type: Auto Insurance               Email: john@...     │
│  Premium: €450/year                 Agent: Maria G.     │
├─────────────────────────────────────────────────────────┤
│  📄 Documents  │  💰 Payments  │  📊 History  │  ⚙️     │
├─────────────────────────────────────────────────────────┤
│  Coverage Details:                                      │
│  • Liability: €50,000                                   │
│  • Collision: €30,000                                   │
│  • Comprehensive: €20,000                               │
│  • Deductible: €500                                     │
├─────────────────────────────────────────────────────────┤
│  [Edit Policy]  [Renew]  [Cancel]  [Generate Doc]      │
└─────────────────────────────────────────────────────────┘
```

**Policy Actions:**
- **Edit**: Modify policy details (creates new version)
- **Renew**: Start renewal process
- **Cancel**: Cancel policy (requires reason)
- **Generate Document**: Create policy documents
- **Send to Client**: Email policy details
- **Add Endorsement**: Add coverage or make changes
- **File Claim**: Submit a claim for this policy

**Filtering and Search:**
- Use the search bar to find policies by number, client name, or vehicle
- Filter by: Status, Type, Agent, Expiration Date, Premium Range
- Sort by: Date, Premium, Client Name, Expiration
- Export: CSV, Excel, PDF

### 3.3 Claims Management

**Submitting a Claim:**

1. Navigate to **Claims** > **New Claim**
2. Select or search for the policy
3. Enter claim details:
   - **Date of Loss**: When the incident occurred
   - **Type of Loss**: Accident, theft, natural disaster, etc.
   - **Description**: Detailed description of what happened
   - **Estimated Loss**: Preliminary estimate
   - **Photos/Documents**: Upload evidence

4. Click **Submit Claim**
5. System assigns claim number and adjuster

**Claim Workflow:**

```
New → Under Review → Investigation → Approved/Denied → Paid/Closed
```

**Claim Status Indicators:**
- 🔵 **New**: Just submitted
- 🟡 **Under Review**: Being evaluated
- 🟠 **Investigation**: Requires further investigation
- 🟢 **Approved**: Claim approved
- 🔴 **Denied**: Claim denied
- ✅ **Paid**: Payment processed
- ⚫ **Closed**: Claim closed

**AI-Powered Claims:**
- Automatic fraud detection alerts
- Estimated processing time
- Similar claim analysis
- Recommended actions

### 3.4 Client Management

**Client Profile:**

```
┌─────────────────────────────────────────────────────────┐
│  👤 John Doe                        🌟 Premium Client    │
├─────────────────────────────────────────────────────────┤
│  📧 john.doe@email.com             📱 +34 600 123 456   │
│  📍 Calle Mayor 15, Madrid 28013                        │
│  🎂 Born: Jan 15, 1980 (46 years)  🆔 DNI: 12345678A   │
├─────────────────────────────────────────────────────────┤
│  📊 Overview  │  📋 Policies  │  💰 Payments  │  📝 Notes│
├─────────────────────────────────────────────────────────┤
│  Active Policies: 3                                     │
│  • Auto Insurance: €450/year                            │
│  • Home Insurance: €300/year                            │
│  • Life Insurance: €600/year                            │
│                                                          │
│  Total Premium: €1,350/year                             │
│  Client Since: Jan 2020                                 │
│  Lifetime Value: €6,750                                 │
│  Claims Filed: 1 (approved)                             │
├─────────────────────────────────────────────────────────┤
│  AI Insights:                                           │
│  • High renewal probability (92%)                       │
│  • Recommended: Health insurance upsell                 │
│  • Risk Score: Low (15/100)                             │
└─────────────────────────────────────────────────────────┘
```

**Client Actions:**
- **Add Policy**: Create new policy for this client
- **Schedule Meeting**: Book appointment
- **Send Email**: Quick email from template
- **Add Note**: Internal note about client
- **View Timeline**: See all interactions
- **Generate Report**: Client portfolio report

**Client Segmentation:**
- 🌟 **Premium**: High-value clients
- 💼 **Business**: Corporate clients
- 👤 **Standard**: Regular individual clients
- 🆕 **New**: Recently acquired clients
- ⚠️ **At Risk**: May churn

### 3.5 Quotes and Proposals

**Creating a Quote:**

1. Navigate to **Quotes** > **New Quote**
2. Select client (or create new lead)
3. Choose insurance type
4. Enter coverage details
5. Click **Calculate Premium**
6. AI engine provides:
   - Base premium calculation
   - Risk assessment
   - Competitor comparison
   - Recommended pricing strategy

7. Adjust and finalize quote
8. Click **Generate Proposal**
9. Send to client via email

**Quote Management:**
```
Status: 📝 Draft → 📤 Sent → 👀 Viewed → ✅ Accepted / ❌ Declined
```

**Follow-up Automation:**
- Day 1: Confirmation email
- Day 3: Reminder if not viewed
- Day 7: Follow-up call task
- Day 14: Final reminder
- Day 30: Archive if no response

### 3.6 Payments and Billing

**Payment Methods:**
- Credit/Debit Card
- Bank Transfer
- Direct Debit (SEPA)
- PayPal
- Cash (tracked for compliance)

**Payment Plans:**
- Annual
- Semi-annual
- Quarterly
- Monthly

**Billing Dashboard:**
```
┌─────────────────────────────────────────────────────────┐
│  💰 Payments Overview                                   │
├─────────────────────────────────────────────────────────┤
│  Collected This Month: €45,230                          │
│  Pending: €12,450                                       │
│  Overdue: €3,200                                        │
├─────────────────────────────────────────────────────────┤
│  Upcoming Payments (Next 30 Days)                       │
│  • Policy #001234 - €450 - Due: Feb 15                 │
│  • Policy #001235 - €300 - Due: Feb 18                 │
│  • Policy #001236 - €600 - Due: Feb 20                 │
├─────────────────────────────────────────────────────────┤
│  Overdue Accounts                                       │
│  • John Smith - €1,200 - 15 days overdue               │
│  • ABC Corp - €2,000 - 30 days overdue                 │
└─────────────────────────────────────────────────────────┘
```

**Automated Collections:**
- Automatic reminders before due date
- Late payment notifications
- Escalation workflow for overdue accounts
- AI-powered payment prediction

### 3.7 Reports and Analytics

**Available Reports:**

1. **Sales Reports**
   - New policies by period
   - Premium revenue
   - Conversion rates
   - Agent performance

2. **Claims Reports**
   - Claims by type
   - Loss ratios
   - Processing times
   - Fraud indicators

3. **Client Reports**
   - Client acquisition
   - Retention rates
   - Lifetime value
   - Churn analysis

4. **Financial Reports**
   - Revenue by product
   - Commission reports
   - Expense tracking
   - Profitability analysis

**Report Generation:**
1. Navigate to **Reports** > **Report Type**
2. Select date range
3. Choose filters (agent, product type, etc.)
4. Click **Generate Report**
5. Export as PDF, Excel, or CSV
6. Schedule automatic delivery

---

## 4. Admin Panel

The Admin Panel is for system administrators and managers.

### 4.1 Admin Dashboard

**System Health Overview:**
```
┌─────────────────────────────────────────────────────────┐
│  🖥️ System Status                      ✅ All Systems OK │
├─────────────────────────────────────────────────────────┤
│  API Server:      ✅ Running    │  Load: 23%            │
│  Database:        ✅ Healthy    │  Connections: 45/100  │
│  Redis Cache:     ✅ Connected  │  Hit Rate: 87%        │
│  Kafka Queue:     ✅ Running    │  Messages: 234        │
├─────────────────────────────────────────────────────────┤
│  Active Users: 45               │  Today's Logins: 127  │
│  Active Sessions: 67            │  Failed Logins: 2     │
├─────────────────────────────────────────────────────────┤
│  Module Status:                                         │
│  • 57 Total Modules                                     │
│  • 34 Enabled                                           │
│  • 33 Healthy                                           │
│  • 1 Warning (Cache Manager - High Memory)             │
└─────────────────────────────────────────────────────────┘
```

### 4.2 User Management

**Creating Users:**

1. Navigate to **Admin** > **Users** > **New User**
2. Enter user information:
   - Full Name
   - Email Address
   - Role (Admin, Manager, Agent, User)
   - Department
   - Employee ID

3. Set permissions:
   - Module access
   - Feature permissions
   - Data access levels

4. Configure settings:
   - Force password change on first login
   - Enable 2FA requirement
   - Set session timeout
   - Email notifications

5. Click **Create User**

**User Roles:**
- **Super Admin**: Full system access
- **Admin**: User and module management
- **Manager**: Team oversight and reporting
- **Agent**: Policy and client management
- **Accountant**: Financial access only
- **Viewer**: Read-only access

**Bulk Operations:**
- Import users from CSV
- Bulk role assignment
- Mass password reset
- Bulk deactivation

### 4.3 Module Management

**Module Administration:**

```
┌─────────────────────────────────────────────────────────┐
│  📦 Module Manager                                      │
├─────────────────────────────────────────────────────────┤
│  Category: Core Business (8 modules)                    │
│                                                          │
│  ✅ ait-accountant         v1.0.0    [Disable] [Config]│
│  ✅ ait-pgc-engine         v1.0.0    [Disable] [Config]│
│  ⭕ ait-treasury           v1.0.0    [Enable]  [Config]│
│  ⭕ ait-encashment         v1.0.0    [Enable]  [Config]│
├─────────────────────────────────────────────────────────┤
│  Category: Insurance Specialized (20 modules)           │
│                                                          │
│  ✅ seguros-vida           v1.0.0    [Disable] [Config]│
│  ✅ seguros-salud          v1.0.0    [Disable] [Config]│
│  ⭕ seguros-hogar          v1.0.0    [Enable]  [Config]│
└─────────────────────────────────────────────────────────┘
```

**Module Actions:**
- **Enable/Disable**: Turn modules on/off without restart
- **Configure**: Module-specific settings
- **Health Check**: Test module connectivity
- **View Logs**: Check module logs
- **Update**: Update to latest version
- **Reload**: Hot reload after configuration change

**Module Monitoring:**
- CPU usage per module
- Memory consumption
- Request count
- Error rates
- Response times

### 4.4 System Configuration

**General Settings:**
- Company name and branding
- Logo upload
- Color scheme
- Default language
- Timezone
- Currency
- Date/time formats

**Email Configuration:**
- SMTP server settings
- Email templates
- Sender addresses
- Email signatures
- Notification rules

**Security Settings:**
- Password policies (length, complexity, expiration)
- Session timeout
- 2FA enforcement
- IP whitelist/blacklist
- Failed login attempts threshold
- Account lockout duration

**Integration Settings:**
- API keys management
- Webhook URLs
- OAuth providers
- External system connections
- Data sync schedules

### 4.5 Audit Logs

**Audit Trail:**
Every action is logged with 23 fields:

```
┌─────────────────────────────────────────────────────────┐
│  📋 Audit Log Entry                                     │
├─────────────────────────────────────────────────────────┤
│  Event ID: AUD-2024-001234                              │
│  Timestamp: 2024-01-28 14:35:22 UTC                     │
│  User: maria.garcia@soriano.es (Agent)                  │
│  Action: POLICY_CREATED                                 │
│  Entity: Policy #AUT-2024-001234                        │
│  IP Address: 192.168.1.105                              │
│  Location: Madrid, Spain                                │
│  Device: Chrome 120.0 / Windows 11                      │
│  Session ID: sess_abc123def456                          │
│  Result: SUCCESS                                        │
│  Changes:                                               │
│    • Status: NULL → Active                              │
│    • Premium: NULL → €450/year                          │
│  + 13 more fields                                       │
└─────────────────────────────────────────────────────────┘
```

**Audit Search:**
- Search by user, action type, date range
- Filter by entity type
- Export audit reports
- Compliance reporting (GDPR, LOPD)

---

## 5. Suite Portal

The Suite Portal contains 16 productivity applications.

### 5.1 Documents (Word Processor)

**Features:**
- Rich text editing
- Real-time collaboration
- Comments and suggestions
- Version history
- Templates library
- Export to PDF, DOCX, ODT

**Creating a Document:**
1. Click **New Document**
2. Choose template or start blank
3. Start typing (auto-saves every few seconds)
4. Use formatting toolbar for styling
5. Click **Share** to collaborate

**Collaboration:**
- Share via link or email
- Set permissions (view, comment, edit)
- See who's editing in real-time
- Chat while editing
- Track changes mode

### 5.2 Spreadsheets

**Features:**
- Formulas and functions (500+)
- Charts and graphs (20+ types)
- Pivot tables
- Conditional formatting
- Data validation
- Import/Export Excel

**Common Use Cases:**
- Premium calculations
- Commission tracking
- Sales forecasting
- Client databases
- Budget management

**Formulas:**
```excel
=SUM(A1:A10)              # Sum range
=AVERAGE(B1:B100)         # Average
=IF(C1>100,"High","Low")  # Conditional
=VLOOKUP(...)             # Lookup
=PremiumCalc(...)         # Custom functions
```

### 5.3 Presentations

**Creating Presentations:**
1. Choose template
2. Add slides (Title, Content, Image, etc.)
3. Add content (text, images, videos, charts)
4. Apply transitions and animations
5. Present or export

**Presentation Modes:**
- **Presenter View**: Notes visible only to you
- **Audience View**: Full-screen presentation
- **Rehearsal Mode**: Practice with timing
- **Recording Mode**: Record presentation

**Layouts:**
```
[Title Slide]
- Company logo
- Title
- Subtitle
- Date

[Content Slide]
- Title
- Bullet points
- Image/Chart
- Footer

[Full Image]
- Background image
- Overlay text
```

### 5.4 Forms

**Form Builder:**
- Drag-and-drop interface
- Multiple question types:
  - Text (short/long)
  - Multiple choice
  - Checkboxes
  - Dropdown
  - File upload
  - Date/Time
  - Rating scale
  - Linear scale

**Use Cases:**
- Client intake forms
- Claim submission forms
- Customer satisfaction surveys
- Employee feedback
- Event registration

**Response Management:**
- View responses in table format
- Export to spreadsheet
- Email notifications
- Automatic routing
- Analytics dashboard

### 5.5 Calendar

**Calendar Views:**
- Day view
- Week view
- Month view
- Agenda view
- Year view

**Creating Events:**
1. Click on date/time
2. Enter event details:
   - Title
   - Description
   - Location (or video link)
   - Start/End time
   - Attendees
   - Reminders
   - Recurrence

3. Click **Save**

**Features:**
- Multiple calendars (Work, Personal, Team)
- Color coding
- Time zone support
- Availability checker
- Meeting scheduling assistant
- Integration with email

### 5.6 Mail

**Email Management:**
- Unlimited storage
- Powerful search
- Labels and filters
- Spam protection
- Email templates
- Scheduled sending
- Snooze emails
- Quick replies

**Inbox Organization:**
```
📥 Inbox (23)
├── ⭐ Starred
├── 📤 Sent
├── 📄 Drafts
├── 🗑️ Trash
└── Custom Labels
    ├── 🏢 Clients
    ├── 💼 Claims
    ├── 📋 Policies
    └── 🤝 Partners
```

**Smart Features:**
- AI-powered categorization
- Important email detection
- Smart reply suggestions
- Attachment preview
- Conversation threading

### 5.7 Tasks

**Task Management:**
```
┌─────────────────────────────────────────────────────────┐
│  ✅ My Tasks                                            │
├─────────────────────────────────────────────────────────┤
│  Today (5)                                              │
│  ⬜ Follow up with John Doe           📅 Due: Today     │
│  ⬜ Review claim #CLM-001234          📅 Due: Today     │
│  ⬜ Prepare monthly report            📅 Due: Today     │
│                                                          │
│  This Week (12)                                         │
│  ⬜ Client meeting preparation        📅 Due: Feb 15    │
│  ⬜ Policy renewal review             📅 Due: Feb 16    │
│                                                          │
│  Later (8)                                              │
│  ⬜ Quarterly planning                📅 Due: Mar 1     │
└─────────────────────────────────────────────────────────┘
```

**Task Properties:**
- Title and description
- Due date and time
- Priority (High, Medium, Low)
- Labels and tags
- Subtasks
- Attachments
- Assignee
- Project

**Views:**
- List view
- Board view (Kanban)
- Calendar view
- Gantt chart

### 5.8 Drive

**File Storage:**
- Unlimited storage (Enterprise)
- File versioning
- Sharing and permissions
- Advanced search
- Offline access
- Mobile sync

**Folder Structure:**
```
📁 My Drive
├── 📁 Policies
│   ├── 📁 2024
│   │   ├── 📄 Policy_AUT-001234.pdf
│   │   └── 📄 Policy_HOME-001235.pdf
│   └── 📁 2023
├── 📁 Claims
├── 📁 Reports
├── 📁 Templates
└── 📁 Client Documents
```

**File Actions:**
- Preview (images, PDFs, videos, documents)
- Download
- Share (link or email)
- Move/Copy
- Rename
- Delete
- Star/Unstar
- Add to favorites

### 5.9 Chat

**Team Messaging:**
- Direct messages
- Group channels
- File sharing
- Voice messages
- Video calls
- Screen sharing
- Message search
- @mentions
- Emojis and reactions

**Channel Types:**
- Public channels (everyone can join)
- Private channels (invite-only)
- Direct messages (1-on-1)
- Group messages (multiple people)

**Productivity Features:**
- Message threading
- Pin important messages
- Reminders
- Status updates
- Do not disturb mode
- Integration with other apps

### 5.10 Video Calls

**Video Conferencing:**
- HD video quality
- Up to 100 participants (Enterprise)
- Screen sharing
- Recording
- Virtual backgrounds
- Noise cancellation
- Closed captions (AI-powered)
- Breakout rooms

**Starting a Call:**
1. Click **New Meeting**
2. Configure settings:
   - Enable/disable camera
   - Enable/disable microphone
   - Choose background
3. Copy meeting link
4. Share with participants
5. Click **Start Meeting**

**In-Meeting Features:**
- Raise hand
- Chat sidebar
- Participant list
- Reactions (👍 ❤️ 👏)
- Polls
- Q&A
- Whiteboard

### 5.11 Analytics

**Business Intelligence Dashboard:**

```
┌─────────────────────────────────────────────────────────┐
│  📊 Business Analytics                                  │
├─────────────────────────────────────────────────────────┤
│  Revenue This Month: €145,230 (+12% vs last month)     │
│  [Revenue Trend Chart - 12 months]                      │
├─────────────────────────────────────────────────────────┤
│  Policies                           Claims              │
│  • New: 45 (+8%)                    • Submitted: 23     │
│  • Renewed: 67 (+5%)                • Approved: 18      │
│  • Cancelled: 12 (-15%)             • Paid: €45,300    │
├─────────────────────────────────────────────────────────┤
│  Top Performing Agents              Top Products        │
│  1. Maria G. - €45K                 1. Auto - €230K     │
│  2. Juan P. - €38K                  2. Home - €180K     │
│  3. Ana L. - €35K                   3. Life - €120K     │
└─────────────────────────────────────────────────────────┘
```

**Custom Dashboards:**
- Drag-and-drop widgets
- Chart types: Line, Bar, Pie, Donut, Area, Scatter
- KPI cards
- Tables and grids
- Real-time data
- Scheduled refreshes
- Export to PDF/Excel

### 5.12 CRM

**Customer Relationship Management:**

Features covered in Section 3.4 (Client Management) apply here with additional:
- Sales pipeline management
- Lead scoring
- Email campaigns
- Marketing automation
- Customer segmentation
- Workflow automation

### 5.13 Projects

**Project Management:**

```
Project: Q1 Marketing Campaign
Status: In Progress (45% complete)

Timeline: Jan 15 - Mar 31, 2024
Budget: €50,000
Team: 5 members

Tasks:
✅ Define objectives (Completed)
✅ Market research (Completed)
🟡 Content creation (In Progress)
⬜ Campaign launch (Not Started)
⬜ Performance tracking (Not Started)

Milestones:
✅ Jan 15 - Project kickoff
✅ Jan 30 - Research complete
🎯 Feb 15 - Content ready
🎯 Mar 1 - Campaign launch
🎯 Mar 31 - Project complete
```

**Project Features:**
- Gantt charts
- Task dependencies
- Resource allocation
- Time tracking
- Budget tracking
- Risk management
- Collaboration tools

### 5.14 Wiki

**Knowledge Base:**

Features:
- Rich text editing
- Hierarchical structure
- Search functionality
- Version history
- Access control
- Templates
- Tags and categories

**Common Wiki Pages:**
- Onboarding guides
- Process documentation
- Product information
- FAQ pages
- Company policies
- Training materials

### 5.15 Notes

**Quick Note-Taking:**

Features:
- Simple interface
- Markdown support
- Tagging
- Search
- Sharing
- Sync across devices
- Offline access

**Use Cases:**
- Meeting notes
- Quick reminders
- Ideas and brainstorming
- To-do lists
- Research notes

### 5.16 AI Assistant

**Intelligent Virtual Assistant:**

**Capabilities:**
- Natural language understanding
- Context-aware responses
- Task automation
- Data analysis
- Document generation
- Email drafting
- Meeting scheduling
- Research assistance

**Example Interactions:**
```
You: "What's our revenue this month?"
AI: "Revenue for January 2024 is €145,230, which is 12% higher
     than December 2023 (€129,670)."

You: "Draft an email to John Doe about his policy renewal"
AI: "I've drafted an email for you. Would you like me to:
     1. Send it now
     2. Save as draft
     3. Make changes"

You: "Schedule a meeting with the sales team next week"
AI: "I found these available times when all team members are free:
     • Tuesday Feb 13, 10:00-11:00 AM
     • Wednesday Feb 14, 2:00-3:00 PM
     • Thursday Feb 15, 3:00-4:00 PM
     Which time works best?"
```

---

## 6. Mobile Application

### 6.1 Mobile Overview

The AIT-CORE mobile app provides access to core features on the go.

**Available on:**
- iOS (iPhone, iPad) - iOS 14.0 or later
- Android - Android 8.0 or later

**Download:**
- App Store: Search "AIT-CORE Soriano"
- Google Play: Search "AIT-CORE Soriano"
- Or scan QR code from web app

### 6.2 Mobile Features

**Core Features:**
- Dashboard overview
- Client search and profiles
- Policy information
- Claims submission
- Quick quotes
- Payment tracking
- Notifications
- Offline mode (limited)

**Mobile-Specific Features:**
- Camera integration for document capture
- GPS location for claims
- Voice-to-text notes
- Biometric authentication (Face ID, Touch ID, Fingerprint)
- Push notifications
- Quick actions (3D Touch/Long Press)

### 6.3 Mobile Workflows

**Submitting a Claim from Mobile:**

1. Open app and navigate to **Claims**
2. Tap **+ New Claim**
3. Search for policy
4. Tap **Take Photo** to capture damage
5. Add multiple photos
6. Use voice input for description
7. Location automatically captured
8. Tap **Submit Claim**
9. Receive confirmation notification

**Creating a Quote on Mobile:**

1. Open app and tap **+ New Quote**
2. Search for client or enter new lead
3. Select insurance type
4. Fill in basic details
5. Take photos if needed (vehicle, property)
6. Tap **Calculate Premium**
7. Review and adjust
8. Tap **Send to Client**
9. Client receives email with quote

---

## 7. Module Management

### 7.1 Understanding Modules

Modules are self-contained functional units that can be enabled or disabled based on your license and needs.

**Module Categories:**
1. Core Business (8 modules)
2. Insurance Specialized (20 modules)
3. Marketing & Sales (10 modules)
4. Analytics & Intelligence (6 modules)
5. Security & Compliance (4 modules)
6. Infrastructure (5 modules)
7. Integration & Automation (4 modules)

### 7.2 Module Licenses

**License Tiers:**

**Standard License:**
- Core Business modules
- Basic Insurance modules (Vida, Salud, Hogar, Autos)
- Essential Infrastructure
- Basic Analytics
- Up to 10 users

**Pro License:**
- All Standard features
- Advanced Insurance modules
- Marketing & Sales modules
- Advanced Analytics
- Security & Compliance
- Up to 50 users
- Priority support

**Enterprise License:**
- All Pro features
- Custom modules
- Unlimited users
- 24/7 support
- Dedicated account manager
- Custom integrations
- SLA guarantees

### 7.3 Enabling Modules

**Prerequisites:**
- Admin permissions
- Valid license for the module
- Dependencies satisfied

**Steps:**
1. Navigate to **Admin Panel** > **Modules**
2. Find the module you want to enable
3. Click **Check Dependencies**
4. If dependencies are met, click **Enable**
5. Module loads automatically (no restart required)
6. Configure module settings
7. Assign user permissions

**Dependency Management:**
The system automatically:
- Checks for required modules
- Detects circular dependencies
- Resolves dependency order
- Warns of conflicts

### 7.4 Module Health

**Health Indicators:**
- 🟢 **Healthy**: Operating normally
- 🟡 **Warning**: Minor issues (high resource usage, slow responses)
- 🔴 **Critical**: Major issues (errors, unresponsive)
- ⚫ **Disabled**: Module is turned off

**Health Monitoring:**
Access health dashboard:
1. **Admin Panel** > **Modules** > **Health**
2. View metrics:
   - CPU usage
   - Memory consumption
   - Request count
   - Error rate
   - Response time
   - Last health check

**Auto-Recovery:**
- Failed health checks trigger automatic restart
- After 3 failed restarts, module is disabled
- Admins receive email notification
- System logs detailed error information

---

## 8. AI Agents

### 8.1 Understanding AI Agents

AI Agents are autonomous intelligent assistants that analyze data, provide recommendations, and execute tasks.

**Two Types:**

**Specialist Agents (Analyze & Recommend):**
- Insurance Specialist
- Finance Specialist
- Legal Specialist
- Marketing Specialist
- Data Specialist
- Security Specialist
- Customer Specialist
- Operations Specialist

**Executive Agents (Execute & Coordinate):**
- CEO Agent
- CFO Agent
- CTO Agent
- CMO Agent
- Sales Manager Agent
- Operations Manager Agent
- HR Manager Agent
- Compliance Officer Agent

### 8.2 Working with Specialist Agents

**Insurance Specialist Example:**

```
You: "Should I approve this auto insurance policy for John Doe?"

Insurance Specialist:
"Based on my analysis:

Risk Assessment:
• Age: 28 years (Moderate risk)
• Driving History: 2 minor incidents in 5 years (Moderate risk)
• Vehicle: 2022 Toyota Camry (Low risk - high safety rating)
• Location: Madrid urban area (Moderate risk)

Overall Risk Score: 6.2/10 (Moderate)

Recommendation:
✅ APPROVE with standard premium of €450/year

Reasoning:
1. Clean driving record overall (no major incidents)
2. Safe, reliable vehicle with excellent safety features
3. Good credit score and payment history
4. Age is within acceptable range

Suggested Conditions:
• Standard deductible: €500
• Optional: Offer telematics discount (up to 15% off)

Alternative Options:
• Higher deductible (€1,000) for €380/year premium
• Lower coverage limits for €320/year premium

Confidence Level: 87%
"
```

**Interacting with Agents:**
- Ask questions in natural language
- Request analysis of specific situations
- Get recommendations for decisions
- Receive proactive alerts and insights

### 8.3 Executive Agents

**CFO Agent Example:**

```
CFO Agent Alert:

📊 Monthly Financial Summary - January 2024

Revenue: €145,230 (+12% MoM, +8% YoY)
✅ Target exceeded by €15,230

Expenses: €78,450 (-3% MoM)
✅ Under budget by €5,550

Net Profit: €66,780 (+32% MoM)
✅ Excellent performance

Cash Flow: €125,340 (+€45,230 this month)
✅ Strong position

Recommendations:
1. Consider investing excess cash in short-term instruments
2. Increase marketing budget to capitalize on momentum
3. Review commission structure - top performers deserve rewards

Action Items:
• Schedule investment planning meeting
• Prepare Q1 board report
• Review pricing strategy for underperforming products

Risks to Monitor:
⚠️ 3 clients have overdue payments (€3,200 total)
⚠️ Rising claims in auto insurance sector
```

### 8.4 Agent Configuration

**Customizing Agent Behavior:**

1. Navigate to **Admin** > **AI Agents** > **Configuration**
2. Select agent to configure
3. Adjust settings:
   - **Proactivity Level**: How often agent sends alerts
     - Low: Only when critical
     - Medium: Important updates
     - High: All insights
   - **Risk Tolerance**: Conservative to Aggressive
   - **Communication Style**: Formal to Casual
   - **Report Frequency**: Daily, Weekly, Monthly
   - **Alert Channels**: Email, In-app, SMS, Slack

4. Click **Save Configuration**

**Training Agents:**
- Agents learn from your feedback
- Mark recommendations as helpful or not helpful
- Agents adjust over time to your preferences
- Historical data improves accuracy

---

## 9. Keyboard Shortcuts

### 9.1 Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open command palette |
| `Ctrl/Cmd + /` | Show keyboard shortcuts |
| `Ctrl/Cmd + S` | Save |
| `Ctrl/Cmd + F` | Search |
| `Ctrl/Cmd + P` | Print |
| `Esc` | Close dialog/Cancel |
| `Alt + N` | Notifications panel |
| `Alt + H` | Help |

### 9.2 Navigation Shortcuts

| Shortcut | Action |
|----------|--------|
| `G then D` | Go to Dashboard |
| `G then P` | Go to Policies |
| `G then C` | Go to Claims |
| `G then L` | Go to Clients |
| `G then R` | Go to Reports |
| `G then A` | Go to Admin |
| `Alt + ←` | Go back |
| `Alt + →` | Go forward |

### 9.3 Data Entry Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | New item |
| `Ctrl/Cmd + E` | Edit item |
| `Ctrl/Cmd + D` | Duplicate item |
| `Delete` | Delete item (with confirmation) |
| `Ctrl/Cmd + Enter` | Submit form |
| `Ctrl/Cmd + ,` | Open settings |

### 9.4 Document Editor Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + B` | Bold |
| `Ctrl/Cmd + I` | Italic |
| `Ctrl/Cmd + U` | Underline |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Y` | Redo |
| `Ctrl/Cmd + X` | Cut |
| `Ctrl/Cmd + C` | Copy |
| `Ctrl/Cmd + V` | Paste |
| `Ctrl/Cmd + A` | Select all |

### 9.5 Suite Portal Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + 1` | Documents |
| `Alt + 2` | Spreadsheets |
| `Alt + 3` | Presentations |
| `Alt + 4` | Calendar |
| `Alt + 5` | Mail |
| `Alt + 6` | Tasks |
| `Alt + 7` | Drive |
| `Alt + 8` | Chat |

---

## 10. Frequently Asked Questions

### 10.1 Account & Access

**Q: I forgot my password. How do I reset it?**
A: Click "Forgot Password" on the login page. Enter your email address, and you'll receive a reset link within a few minutes. The link expires after 1 hour.

**Q: How do I enable two-factor authentication?**
A: Go to Settings > Security > Two-Factor Authentication. Click "Enable 2FA", scan the QR code with your authenticator app, and enter the verification code.

**Q: Can I access the system from multiple devices?**
A: Yes, you can access AIT-CORE from any device with a modern web browser. Your session stays active on all devices.

**Q: Why was my account locked?**
A: Accounts are locked after 5 failed login attempts. Wait 30 minutes or contact your administrator to unlock immediately.

### 10.2 Policies

**Q: How long does it take to create a policy?**
A: With the AI-powered system, creating a standard policy takes 3-5 minutes. Complex policies may take 10-15 minutes.

**Q: Can I modify a policy after it's created?**
A: Yes, but modifications create a new policy version for audit purposes. Some changes may require underwriting approval.

**Q: How do I cancel a policy?**
A: Open the policy, click "Cancel", select the cancellation reason, and confirm. The system will calculate any refunds automatically.

**Q: What happens when a policy expires?**
A: 60 days before expiration, the system sends renewal reminders to the client. 30 days before, it creates a draft renewal policy for your review.

### 10.3 Claims

**Q: How fast are claims processed?**
A: Simple claims are typically processed in 3-5 business days. Complex claims requiring investigation may take 10-15 business days.

**Q: Can clients submit claims directly?**
A: Yes, clients can submit claims through the client portal or mobile app. Claims are automatically assigned to an adjuster.

**Q: How does fraud detection work?**
A: The AI system analyzes claims for fraud indicators: unusual patterns, inconsistent information, photo manipulation, and comparison with similar claims.

**Q: Can I override the AI fraud detection?**
A: Yes, with proper authorization. Document your reasoning for audit purposes.

### 10.4 Technical

**Q: Why is the system slow?**
A: Check your internet connection first. If the issue persists, contact support. Admins can check system status in the Admin Panel.

**Q: My data didn't save. What happened?**
A: The system auto-saves every 30 seconds. Check the status indicator (saving/saved). If you lost connection, reconnect and check for drafts.

**Q: Can I work offline?**
A: Limited offline functionality is available in the mobile app. Web app requires internet connection.

**Q: How is my data backed up?**
A: Data is backed up every 6 hours to redundant locations. Point-in-time recovery available for up to 30 days.

### 10.5 Integrations

**Q: Can I import data from my old system?**
A: Yes, we provide data migration tools for common systems. Contact support for assistance with custom imports.

**Q: Does it integrate with accounting software?**
A: Yes, integrations available for QuickBooks, Xero, Sage, and others. Some require Pro or Enterprise license.

**Q: Can I export my data?**
A: Yes, you can export data in CSV, Excel, and PDF formats. Bulk exports available via API.

---

## 11. Troubleshooting

### 11.1 Login Issues

**Problem: Can't log in**
- Verify email and password are correct (check caps lock)
- Clear browser cache and cookies
- Try incognito/private browsing mode
- Check if account is locked (5 failed attempts)
- Reset password if needed
- Contact administrator if issue persists

**Problem: 2FA code not working**
- Ensure device time is synced correctly
- Generate new code (they expire after 30 seconds)
- Try backup codes if available
- Contact administrator to reset 2FA

### 11.2 Performance Issues

**Problem: System is slow**
- Check internet speed (minimum 5 Mbps required)
- Close unnecessary browser tabs
- Clear browser cache
- Disable browser extensions temporarily
- Try different browser
- Check system status page

**Problem: Page won't load**
- Refresh the page (F5 or Ctrl+R)
- Clear browser cache
- Check internet connection
- Try accessing from different device
- Check if maintenance is scheduled

### 11.3 Data Issues

**Problem: Data didn't save**
- Check status indicator (should show "Saved")
- Look for error messages
- Check your permissions for that module
- Try saving again
- Contact support with error details

**Problem: Can't find a record**
- Check search filters are correct
- Verify spelling
- Try advanced search
- Check if record was deleted (check trash)
- Contact administrator if permissions issue

### 11.4 Module Issues

**Problem: Module won't enable**
- Check if you have required license
- Verify dependencies are satisfied
- Check module health status
- Review error logs
- Contact administrator

**Problem: Module showing errors**
- Check module health dashboard
- Review error logs
- Try disabling and re-enabling module
- Check if update is available
- Contact support if issue persists

### 11.5 Reporting Issues

**Problem: Report has incorrect data**
- Verify date range is correct
- Check applied filters
- Ensure you have permission to see all data
- Try regenerating report
- Compare with source data

**Problem: Can't export report**
- Check if export limit is reached
- Verify file format is supported
- Ensure sufficient permissions
- Try smaller date range
- Contact support for large exports

### 11.6 Getting Help

**Support Channels:**

1. **In-App Help**
   - Click ? icon in top right
   - Search documentation
   - Watch video tutorials
   - View FAQs

2. **Email Support**
   - support@sorianomediadores.es
   - Include: Description, screenshots, error messages
   - Response time: 4-24 hours (based on license tier)

3. **Phone Support** (Pro/Enterprise)
   - +34 900 XXX XXX
   - Monday-Friday, 9:00-18:00 CET
   - 24/7 for Enterprise

4. **Live Chat** (Enterprise)
   - Click chat icon
   - Average response: < 5 minutes
   - Available 24/7

5. **Community Forum**
   - community.aintech.es
   - Search existing topics
   - Ask questions
   - Share tips and tricks

**Before Contacting Support:**
- Try troubleshooting steps above
- Check system status page
- Search documentation
- Prepare relevant information:
  - Your email/username
  - Description of issue
  - Steps to reproduce
  - Screenshots or error messages
  - Browser and OS version

---

## Appendix A: Glossary

**Terms:**
- **Module**: Self-contained functional unit
- **Agent**: AI-powered intelligent assistant
- **Policy**: Insurance policy contract
- **Claim**: Insurance claim submission
- **Premium**: Insurance premium amount
- **Underwriting**: Risk assessment process
- **Endorsement**: Policy modification
- **Loss Ratio**: Claims paid vs premiums collected
- **Renewal**: Extending policy for another term
- **Lapse**: Policy expiration without renewal

---

## Appendix B: Support Contact Information

**Technical Support:**
- Email: tech@aintech.es
- Phone: +34 900 XXX XXX
- Portal: support.aintech.es

**Sales:**
- Email: sales@aintech.es
- Phone: +34 900 YYY YYY

**Billing:**
- Email: billing@aintech.es
- Phone: +34 900 ZZZ ZZZ

**Emergency Support (Enterprise):**
- Phone: +34 900 AAA AAA
- Available 24/7/365

---

*This manual is regularly updated. Last update: January 28, 2026*
*For the latest version, visit: https://docs.aintech.es/user-manual*
