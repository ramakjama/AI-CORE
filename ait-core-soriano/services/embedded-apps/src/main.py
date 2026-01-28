"""
AI-Suite Embedded Apps Service

Manages external web applications embedded within AI-Suite.
Supports WhatsApp Web, Telegram, Slack, and 50+ other applications.
"""

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID, uuid4
from enum import Enum
import structlog
import uvicorn

logger = structlog.get_logger(__name__)


# ============================================
# ENUMS & CONSTANTS
# ============================================

class AppCategory(str, Enum):
    """Categories for embedded applications."""
    COMMUNICATION = "communication"
    SOCIAL = "social"
    PRODUCTIVITY = "productivity"
    DEVELOPMENT = "development"
    DESIGN = "design"
    STORAGE = "storage"
    PROJECT_MANAGEMENT = "project_management"
    CRM = "crm"
    MARKETING = "marketing"
    FINANCE = "finance"
    HR = "hr"
    SUPPORT = "support"
    AI = "ai"
    VIDEO = "video"
    MUSIC = "music"
    NEWS = "news"
    CUSTOM = "custom"


class AppStatus(str, Enum):
    """Status of an embedded app."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"
    DEPRECATED = "deprecated"


# ============================================
# PREDEFINED APPS CATALOG
# ============================================

EMBEDDED_APPS_CATALOG = [
    # ========== COMMUNICATION ==========
    {
        "id": "whatsapp-web",
        "name": "WhatsApp Web",
        "description": "WhatsApp messaging in your browser",
        "url": "https://web.whatsapp.com",
        "icon": "whatsapp",
        "category": AppCategory.COMMUNICATION,
        "color": "#25D366",
        "features": ["messaging", "voice", "video", "files"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "telegram-web",
        "name": "Telegram Web",
        "description": "Fast and secure messaging",
        "url": "https://web.telegram.org",
        "icon": "telegram",
        "category": AppCategory.COMMUNICATION,
        "color": "#0088cc",
        "features": ["messaging", "channels", "bots", "files"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "slack",
        "name": "Slack",
        "description": "Team communication platform",
        "url": "https://app.slack.com",
        "icon": "slack",
        "category": AppCategory.COMMUNICATION,
        "color": "#4A154B",
        "features": ["messaging", "channels", "apps", "huddles"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "discord",
        "name": "Discord",
        "description": "Voice, video and text communication",
        "url": "https://discord.com/app",
        "icon": "discord",
        "category": AppCategory.COMMUNICATION,
        "color": "#5865F2",
        "features": ["messaging", "voice", "video", "servers"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "microsoft-teams",
        "name": "Microsoft Teams",
        "description": "Microsoft collaboration platform",
        "url": "https://teams.microsoft.com",
        "icon": "microsoft-teams",
        "category": AppCategory.COMMUNICATION,
        "color": "#6264A7",
        "features": ["messaging", "video", "files", "apps"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "zoom",
        "name": "Zoom",
        "description": "Video conferencing",
        "url": "https://app.zoom.us/wc",
        "icon": "zoom",
        "category": AppCategory.COMMUNICATION,
        "color": "#2D8CFF",
        "features": ["video", "webinars", "recordings"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "google-meet",
        "name": "Google Meet",
        "description": "Google video meetings",
        "url": "https://meet.google.com",
        "icon": "google-meet",
        "category": AppCategory.COMMUNICATION,
        "color": "#00897B",
        "features": ["video", "screen-share", "recordings"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "signal",
        "name": "Signal",
        "description": "Private messenger",
        "url": "https://signal.org",
        "icon": "signal",
        "category": AppCategory.COMMUNICATION,
        "color": "#3A76F0",
        "features": ["messaging", "voice", "video", "encrypted"],
        "requires_auth": True,
        "mobile_friendly": False,
    },
    {
        "id": "messenger",
        "name": "Facebook Messenger",
        "description": "Facebook messaging",
        "url": "https://www.messenger.com",
        "icon": "messenger",
        "category": AppCategory.COMMUNICATION,
        "color": "#0084FF",
        "features": ["messaging", "video", "games"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "skype",
        "name": "Skype",
        "description": "Video calls and chat",
        "url": "https://web.skype.com",
        "icon": "skype",
        "category": AppCategory.COMMUNICATION,
        "color": "#00AFF0",
        "features": ["messaging", "voice", "video"],
        "requires_auth": True,
        "mobile_friendly": True,
    },

    # ========== SOCIAL ==========
    {
        "id": "linkedin",
        "name": "LinkedIn",
        "description": "Professional networking",
        "url": "https://www.linkedin.com",
        "icon": "linkedin",
        "category": AppCategory.SOCIAL,
        "color": "#0A66C2",
        "features": ["networking", "jobs", "learning"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "twitter",
        "name": "X (Twitter)",
        "description": "Social media platform",
        "url": "https://x.com",
        "icon": "twitter",
        "category": AppCategory.SOCIAL,
        "color": "#000000",
        "features": ["posts", "spaces", "dms"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "facebook",
        "name": "Facebook",
        "description": "Social network",
        "url": "https://www.facebook.com",
        "icon": "facebook",
        "category": AppCategory.SOCIAL,
        "color": "#1877F2",
        "features": ["posts", "groups", "marketplace"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "instagram",
        "name": "Instagram",
        "description": "Photo and video sharing",
        "url": "https://www.instagram.com",
        "icon": "instagram",
        "category": AppCategory.SOCIAL,
        "color": "#E4405F",
        "features": ["photos", "stories", "reels", "dms"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "reddit",
        "name": "Reddit",
        "description": "Community forums",
        "url": "https://www.reddit.com",
        "icon": "reddit",
        "category": AppCategory.SOCIAL,
        "color": "#FF4500",
        "features": ["communities", "posts", "chat"],
        "requires_auth": False,
        "mobile_friendly": True,
    },
    {
        "id": "tiktok",
        "name": "TikTok",
        "description": "Short video platform",
        "url": "https://www.tiktok.com",
        "icon": "tiktok",
        "category": AppCategory.SOCIAL,
        "color": "#000000",
        "features": ["videos", "live", "shop"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "pinterest",
        "name": "Pinterest",
        "description": "Visual discovery",
        "url": "https://www.pinterest.com",
        "icon": "pinterest",
        "category": AppCategory.SOCIAL,
        "color": "#E60023",
        "features": ["pins", "boards", "ideas"],
        "requires_auth": True,
        "mobile_friendly": True,
    },

    # ========== PRODUCTIVITY ==========
    {
        "id": "gmail",
        "name": "Gmail",
        "description": "Google email",
        "url": "https://mail.google.com",
        "icon": "gmail",
        "category": AppCategory.PRODUCTIVITY,
        "color": "#EA4335",
        "features": ["email", "labels", "filters"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "google-calendar",
        "name": "Google Calendar",
        "description": "Google calendar",
        "url": "https://calendar.google.com",
        "icon": "google-calendar",
        "category": AppCategory.PRODUCTIVITY,
        "color": "#4285F4",
        "features": ["events", "reminders", "sharing"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "google-drive",
        "name": "Google Drive",
        "description": "Cloud storage",
        "url": "https://drive.google.com",
        "icon": "google-drive",
        "category": AppCategory.STORAGE,
        "color": "#4285F4",
        "features": ["files", "sharing", "collaboration"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "google-docs",
        "name": "Google Docs",
        "description": "Document editor",
        "url": "https://docs.google.com",
        "icon": "google-docs",
        "category": AppCategory.PRODUCTIVITY,
        "color": "#4285F4",
        "features": ["documents", "collaboration", "templates"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "google-sheets",
        "name": "Google Sheets",
        "description": "Spreadsheet editor",
        "url": "https://sheets.google.com",
        "icon": "google-sheets",
        "category": AppCategory.PRODUCTIVITY,
        "color": "#0F9D58",
        "features": ["spreadsheets", "formulas", "charts"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "notion",
        "name": "Notion",
        "description": "All-in-one workspace",
        "url": "https://www.notion.so",
        "icon": "notion",
        "category": AppCategory.PRODUCTIVITY,
        "color": "#000000",
        "features": ["notes", "databases", "wikis"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "obsidian",
        "name": "Obsidian",
        "description": "Knowledge management",
        "url": "https://obsidian.md",
        "icon": "obsidian",
        "category": AppCategory.PRODUCTIVITY,
        "color": "#7C3AED",
        "features": ["notes", "linking", "plugins"],
        "requires_auth": False,
        "mobile_friendly": False,
    },
    {
        "id": "evernote",
        "name": "Evernote",
        "description": "Note-taking app",
        "url": "https://www.evernote.com/client",
        "icon": "evernote",
        "category": AppCategory.PRODUCTIVITY,
        "color": "#00A82D",
        "features": ["notes", "web-clipper", "search"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "todoist",
        "name": "Todoist",
        "description": "Task management",
        "url": "https://app.todoist.com",
        "icon": "todoist",
        "category": AppCategory.PRODUCTIVITY,
        "color": "#E44332",
        "features": ["tasks", "projects", "labels"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "dropbox",
        "name": "Dropbox",
        "description": "Cloud storage",
        "url": "https://www.dropbox.com/home",
        "icon": "dropbox",
        "category": AppCategory.STORAGE,
        "color": "#0061FF",
        "features": ["files", "sharing", "sync"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "onedrive",
        "name": "OneDrive",
        "description": "Microsoft cloud storage",
        "url": "https://onedrive.live.com",
        "icon": "onedrive",
        "category": AppCategory.STORAGE,
        "color": "#0078D4",
        "features": ["files", "sharing", "sync"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "box",
        "name": "Box",
        "description": "Enterprise cloud storage",
        "url": "https://app.box.com",
        "icon": "box",
        "category": AppCategory.STORAGE,
        "color": "#0061D5",
        "features": ["files", "workflows", "security"],
        "requires_auth": True,
        "mobile_friendly": True,
    },

    # ========== DEVELOPMENT ==========
    {
        "id": "github",
        "name": "GitHub",
        "description": "Code hosting platform",
        "url": "https://github.com",
        "icon": "github",
        "category": AppCategory.DEVELOPMENT,
        "color": "#181717",
        "features": ["repos", "issues", "actions", "copilot"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "gitlab",
        "name": "GitLab",
        "description": "DevOps platform",
        "url": "https://gitlab.com",
        "icon": "gitlab",
        "category": AppCategory.DEVELOPMENT,
        "color": "#FC6D26",
        "features": ["repos", "ci-cd", "issues"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "bitbucket",
        "name": "Bitbucket",
        "description": "Code hosting by Atlassian",
        "url": "https://bitbucket.org",
        "icon": "bitbucket",
        "category": AppCategory.DEVELOPMENT,
        "color": "#0052CC",
        "features": ["repos", "pipelines", "issues"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "codepen",
        "name": "CodePen",
        "description": "Frontend playground",
        "url": "https://codepen.io",
        "icon": "codepen",
        "category": AppCategory.DEVELOPMENT,
        "color": "#000000",
        "features": ["pens", "projects", "challenges"],
        "requires_auth": False,
        "mobile_friendly": True,
    },
    {
        "id": "replit",
        "name": "Replit",
        "description": "Online IDE",
        "url": "https://replit.com",
        "icon": "replit",
        "category": AppCategory.DEVELOPMENT,
        "color": "#F26207",
        "features": ["ide", "deploy", "ai"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "stackblitz",
        "name": "StackBlitz",
        "description": "Web IDE",
        "url": "https://stackblitz.com",
        "icon": "stackblitz",
        "category": AppCategory.DEVELOPMENT,
        "color": "#1389FD",
        "features": ["ide", "instant-dev", "webcontainers"],
        "requires_auth": True,
        "mobile_friendly": False,
    },
    {
        "id": "codesandbox",
        "name": "CodeSandbox",
        "description": "Cloud development",
        "url": "https://codesandbox.io",
        "icon": "codesandbox",
        "category": AppCategory.DEVELOPMENT,
        "color": "#151515",
        "features": ["sandboxes", "devboxes", "collaboration"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "vercel",
        "name": "Vercel",
        "description": "Deploy platform",
        "url": "https://vercel.com/dashboard",
        "icon": "vercel",
        "category": AppCategory.DEVELOPMENT,
        "color": "#000000",
        "features": ["deploy", "analytics", "domains"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "netlify",
        "name": "Netlify",
        "description": "Deploy platform",
        "url": "https://app.netlify.com",
        "icon": "netlify",
        "category": AppCategory.DEVELOPMENT,
        "color": "#00C7B7",
        "features": ["deploy", "forms", "functions"],
        "requires_auth": True,
        "mobile_friendly": True,
    },

    # ========== DESIGN ==========
    {
        "id": "figma",
        "name": "Figma",
        "description": "Collaborative design",
        "url": "https://www.figma.com",
        "icon": "figma",
        "category": AppCategory.DESIGN,
        "color": "#F24E1E",
        "features": ["design", "prototypes", "dev-mode"],
        "requires_auth": True,
        "mobile_friendly": False,
    },
    {
        "id": "canva",
        "name": "Canva",
        "description": "Graphic design",
        "url": "https://www.canva.com",
        "icon": "canva",
        "category": AppCategory.DESIGN,
        "color": "#00C4CC",
        "features": ["templates", "design", "videos"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "miro",
        "name": "Miro",
        "description": "Online whiteboard",
        "url": "https://miro.com/app",
        "icon": "miro",
        "category": AppCategory.DESIGN,
        "color": "#FFD02F",
        "features": ["boards", "templates", "collaboration"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "excalidraw",
        "name": "Excalidraw",
        "description": "Virtual whiteboard",
        "url": "https://excalidraw.com",
        "icon": "excalidraw",
        "category": AppCategory.DESIGN,
        "color": "#6965DB",
        "features": ["sketching", "collaboration", "libraries"],
        "requires_auth": False,
        "mobile_friendly": True,
    },
    {
        "id": "whimsical",
        "name": "Whimsical",
        "description": "Visual workspace",
        "url": "https://whimsical.com",
        "icon": "whimsical",
        "category": AppCategory.DESIGN,
        "color": "#7B68EE",
        "features": ["flowcharts", "wireframes", "docs"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "lucidchart",
        "name": "Lucidchart",
        "description": "Diagramming tool",
        "url": "https://lucid.app",
        "icon": "lucidchart",
        "category": AppCategory.DESIGN,
        "color": "#F96B13",
        "features": ["diagrams", "flowcharts", "org-charts"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "dribbble",
        "name": "Dribbble",
        "description": "Design inspiration",
        "url": "https://dribbble.com",
        "icon": "dribbble",
        "category": AppCategory.DESIGN,
        "color": "#EA4C89",
        "features": ["shots", "designers", "jobs"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "behance",
        "name": "Behance",
        "description": "Creative portfolio",
        "url": "https://www.behance.net",
        "icon": "behance",
        "category": AppCategory.DESIGN,
        "color": "#1769FF",
        "features": ["projects", "galleries", "jobs"],
        "requires_auth": True,
        "mobile_friendly": True,
    },

    # ========== PROJECT MANAGEMENT ==========
    {
        "id": "jira",
        "name": "Jira",
        "description": "Project tracking",
        "url": "https://www.atlassian.com/software/jira",
        "icon": "jira",
        "category": AppCategory.PROJECT_MANAGEMENT,
        "color": "#0052CC",
        "features": ["issues", "boards", "roadmaps"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "trello",
        "name": "Trello",
        "description": "Kanban boards",
        "url": "https://trello.com",
        "icon": "trello",
        "category": AppCategory.PROJECT_MANAGEMENT,
        "color": "#0079BF",
        "features": ["boards", "cards", "power-ups"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "asana",
        "name": "Asana",
        "description": "Work management",
        "url": "https://app.asana.com",
        "icon": "asana",
        "category": AppCategory.PROJECT_MANAGEMENT,
        "color": "#F06A6A",
        "features": ["tasks", "projects", "portfolios"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "monday",
        "name": "Monday.com",
        "description": "Work OS",
        "url": "https://monday.com",
        "icon": "monday",
        "category": AppCategory.PROJECT_MANAGEMENT,
        "color": "#FF3D57",
        "features": ["boards", "automations", "dashboards"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "clickup",
        "name": "ClickUp",
        "description": "Productivity platform",
        "url": "https://app.clickup.com",
        "icon": "clickup",
        "category": AppCategory.PROJECT_MANAGEMENT,
        "color": "#7B68EE",
        "features": ["tasks", "docs", "whiteboards"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "basecamp",
        "name": "Basecamp",
        "description": "Project management",
        "url": "https://basecamp.com",
        "icon": "basecamp",
        "category": AppCategory.PROJECT_MANAGEMENT,
        "color": "#1D2D35",
        "features": ["projects", "messages", "schedules"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "linear",
        "name": "Linear",
        "description": "Issue tracking",
        "url": "https://linear.app",
        "icon": "linear",
        "category": AppCategory.PROJECT_MANAGEMENT,
        "color": "#5E6AD2",
        "features": ["issues", "cycles", "roadmaps"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "height",
        "name": "Height",
        "description": "Project tool",
        "url": "https://height.app",
        "icon": "height",
        "category": AppCategory.PROJECT_MANAGEMENT,
        "color": "#6366F1",
        "features": ["tasks", "spreadsheets", "chat"],
        "requires_auth": True,
        "mobile_friendly": True,
    },

    # ========== CRM & SALES ==========
    {
        "id": "salesforce",
        "name": "Salesforce",
        "description": "CRM platform",
        "url": "https://login.salesforce.com",
        "icon": "salesforce",
        "category": AppCategory.CRM,
        "color": "#00A1E0",
        "features": ["crm", "sales", "service"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "hubspot",
        "name": "HubSpot",
        "description": "CRM and marketing",
        "url": "https://app.hubspot.com",
        "icon": "hubspot",
        "category": AppCategory.CRM,
        "color": "#FF7A59",
        "features": ["crm", "marketing", "sales"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "pipedrive",
        "name": "Pipedrive",
        "description": "Sales CRM",
        "url": "https://app.pipedrive.com",
        "icon": "pipedrive",
        "category": AppCategory.CRM,
        "color": "#017737",
        "features": ["deals", "pipeline", "reports"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "zoho-crm",
        "name": "Zoho CRM",
        "description": "CRM solution",
        "url": "https://crm.zoho.com",
        "icon": "zoho",
        "category": AppCategory.CRM,
        "color": "#C8202B",
        "features": ["leads", "deals", "analytics"],
        "requires_auth": True,
        "mobile_friendly": True,
    },

    # ========== AI TOOLS ==========
    {
        "id": "chatgpt",
        "name": "ChatGPT",
        "description": "OpenAI chatbot",
        "url": "https://chat.openai.com",
        "icon": "openai",
        "category": AppCategory.AI,
        "color": "#10A37F",
        "features": ["chat", "code", "analysis"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "claude",
        "name": "Claude",
        "description": "Anthropic AI assistant",
        "url": "https://claude.ai",
        "icon": "anthropic",
        "category": AppCategory.AI,
        "color": "#D97757",
        "features": ["chat", "analysis", "coding"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "gemini",
        "name": "Gemini",
        "description": "Google AI",
        "url": "https://gemini.google.com",
        "icon": "google",
        "category": AppCategory.AI,
        "color": "#4285F4",
        "features": ["chat", "images", "code"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "perplexity",
        "name": "Perplexity",
        "description": "AI search engine",
        "url": "https://www.perplexity.ai",
        "icon": "perplexity",
        "category": AppCategory.AI,
        "color": "#20808D",
        "features": ["search", "research", "citations"],
        "requires_auth": False,
        "mobile_friendly": True,
    },
    {
        "id": "midjourney",
        "name": "Midjourney",
        "description": "AI image generation",
        "url": "https://www.midjourney.com",
        "icon": "midjourney",
        "category": AppCategory.AI,
        "color": "#000000",
        "features": ["images", "art", "design"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "dall-e",
        "name": "DALL-E",
        "description": "OpenAI image generation",
        "url": "https://labs.openai.com",
        "icon": "openai",
        "category": AppCategory.AI,
        "color": "#10A37F",
        "features": ["images", "editing", "variations"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "copilot",
        "name": "GitHub Copilot",
        "description": "AI coding assistant",
        "url": "https://github.com/features/copilot",
        "icon": "github",
        "category": AppCategory.AI,
        "color": "#000000",
        "features": ["code", "completions", "chat"],
        "requires_auth": True,
        "mobile_friendly": False,
    },

    # ========== VIDEO & STREAMING ==========
    {
        "id": "youtube",
        "name": "YouTube",
        "description": "Video platform",
        "url": "https://www.youtube.com",
        "icon": "youtube",
        "category": AppCategory.VIDEO,
        "color": "#FF0000",
        "features": ["videos", "live", "shorts"],
        "requires_auth": False,
        "mobile_friendly": True,
    },
    {
        "id": "youtube-studio",
        "name": "YouTube Studio",
        "description": "Creator tools",
        "url": "https://studio.youtube.com",
        "icon": "youtube",
        "category": AppCategory.VIDEO,
        "color": "#FF0000",
        "features": ["analytics", "content", "monetization"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "vimeo",
        "name": "Vimeo",
        "description": "Video hosting",
        "url": "https://vimeo.com",
        "icon": "vimeo",
        "category": AppCategory.VIDEO,
        "color": "#1AB7EA",
        "features": ["videos", "hosting", "streaming"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "loom",
        "name": "Loom",
        "description": "Video messaging",
        "url": "https://www.loom.com",
        "icon": "loom",
        "category": AppCategory.VIDEO,
        "color": "#625DF5",
        "features": ["recording", "sharing", "transcripts"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "twitch",
        "name": "Twitch",
        "description": "Live streaming",
        "url": "https://www.twitch.tv",
        "icon": "twitch",
        "category": AppCategory.VIDEO,
        "color": "#9146FF",
        "features": ["streams", "chat", "clips"],
        "requires_auth": False,
        "mobile_friendly": True,
    },

    # ========== MUSIC ==========
    {
        "id": "spotify",
        "name": "Spotify",
        "description": "Music streaming",
        "url": "https://open.spotify.com",
        "icon": "spotify",
        "category": AppCategory.MUSIC,
        "color": "#1DB954",
        "features": ["music", "podcasts", "playlists"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "youtube-music",
        "name": "YouTube Music",
        "description": "Music streaming",
        "url": "https://music.youtube.com",
        "icon": "youtube-music",
        "category": AppCategory.MUSIC,
        "color": "#FF0000",
        "features": ["music", "videos", "playlists"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "soundcloud",
        "name": "SoundCloud",
        "description": "Audio platform",
        "url": "https://soundcloud.com",
        "icon": "soundcloud",
        "category": AppCategory.MUSIC,
        "color": "#FF5500",
        "features": ["music", "upload", "discover"],
        "requires_auth": False,
        "mobile_friendly": True,
    },

    # ========== NEWS & READING ==========
    {
        "id": "feedly",
        "name": "Feedly",
        "description": "RSS reader",
        "url": "https://feedly.com",
        "icon": "feedly",
        "category": AppCategory.NEWS,
        "color": "#2BB24C",
        "features": ["feeds", "boards", "ai"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "pocket",
        "name": "Pocket",
        "description": "Save articles",
        "url": "https://getpocket.com",
        "icon": "pocket",
        "category": AppCategory.NEWS,
        "color": "#EF4056",
        "features": ["save", "read", "discover"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "medium",
        "name": "Medium",
        "description": "Publishing platform",
        "url": "https://medium.com",
        "icon": "medium",
        "category": AppCategory.NEWS,
        "color": "#000000",
        "features": ["articles", "publications", "membership"],
        "requires_auth": False,
        "mobile_friendly": True,
    },

    # ========== SUPPORT & HELPDESK ==========
    {
        "id": "zendesk",
        "name": "Zendesk",
        "description": "Customer support",
        "url": "https://www.zendesk.com",
        "icon": "zendesk",
        "category": AppCategory.SUPPORT,
        "color": "#03363D",
        "features": ["tickets", "chat", "knowledge"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "intercom",
        "name": "Intercom",
        "description": "Customer messaging",
        "url": "https://app.intercom.com",
        "icon": "intercom",
        "category": AppCategory.SUPPORT,
        "color": "#6AFDEF",
        "features": ["chat", "bots", "help"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "freshdesk",
        "name": "Freshdesk",
        "description": "Helpdesk software",
        "url": "https://freshdesk.com",
        "icon": "freshworks",
        "category": AppCategory.SUPPORT,
        "color": "#25C16F",
        "features": ["tickets", "automation", "reports"],
        "requires_auth": True,
        "mobile_friendly": True,
    },

    # ========== FINANCE ==========
    {
        "id": "quickbooks",
        "name": "QuickBooks",
        "description": "Accounting software",
        "url": "https://quickbooks.intuit.com",
        "icon": "quickbooks",
        "category": AppCategory.FINANCE,
        "color": "#2CA01C",
        "features": ["invoicing", "expenses", "reports"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "xero",
        "name": "Xero",
        "description": "Accounting platform",
        "url": "https://go.xero.com",
        "icon": "xero",
        "category": AppCategory.FINANCE,
        "color": "#13B5EA",
        "features": ["accounting", "invoicing", "payroll"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "stripe-dashboard",
        "name": "Stripe Dashboard",
        "description": "Payment management",
        "url": "https://dashboard.stripe.com",
        "icon": "stripe",
        "category": AppCategory.FINANCE,
        "color": "#635BFF",
        "features": ["payments", "subscriptions", "reports"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
    {
        "id": "paypal",
        "name": "PayPal",
        "description": "Online payments",
        "url": "https://www.paypal.com",
        "icon": "paypal",
        "category": AppCategory.FINANCE,
        "color": "#003087",
        "features": ["payments", "invoicing", "transfers"],
        "requires_auth": True,
        "mobile_friendly": True,
    },
]


# ============================================
# PYDANTIC MODELS
# ============================================

class EmbeddedApp(BaseModel):
    """Model for an embedded application."""
    id: str
    name: str
    description: str
    url: str
    icon: str
    category: AppCategory
    color: str
    features: List[str] = []
    requires_auth: bool = True
    mobile_friendly: bool = True
    status: AppStatus = AppStatus.ACTIVE


class UserAppConfig(BaseModel):
    """User's configuration for an embedded app."""
    app_id: str
    enabled: bool = True
    pinned: bool = False
    position: int = 0
    custom_name: Optional[str] = None
    custom_url: Optional[str] = None
    settings: Dict[str, Any] = {}


class CustomApp(BaseModel):
    """User-defined custom embedded app."""
    name: str
    url: HttpUrl
    icon: Optional[str] = "link"
    category: AppCategory = AppCategory.CUSTOM
    color: Optional[str] = "#6B7280"
    description: Optional[str] = None


class AppLaunchEvent(BaseModel):
    """Event when user launches an app."""
    app_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    duration_seconds: Optional[int] = None


# ============================================
# APPLICATION
# ============================================

app = FastAPI(
    title="AI-Suite Embedded Apps Service",
    description="Manage embedded web applications within AI-Suite",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
user_app_configs: Dict[str, List[UserAppConfig]] = {}
custom_apps: Dict[str, List[Dict]] = {}
app_usage: Dict[str, List[AppLaunchEvent]] = {}


# ============================================
# ENDPOINTS
# ============================================

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "embedded-apps"}


@app.get("/api/v1/embedded-apps/catalog", response_model=List[EmbeddedApp])
async def get_catalog(
    category: Optional[AppCategory] = None,
    search: Optional[str] = None,
):
    """Get the catalog of available embedded apps."""
    apps = [EmbeddedApp(**app) for app in EMBEDDED_APPS_CATALOG]

    if category:
        apps = [a for a in apps if a.category == category]

    if search:
        search_lower = search.lower()
        apps = [
            a for a in apps
            if search_lower in a.name.lower()
            or search_lower in a.description.lower()
            or any(search_lower in f.lower() for f in a.features)
        ]

    return apps


@app.get("/api/v1/embedded-apps/categories")
async def get_categories():
    """Get all available categories with counts."""
    category_counts = {}
    for app in EMBEDDED_APPS_CATALOG:
        cat = app["category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1

    return {
        "categories": [
            {
                "id": cat.value,
                "name": cat.value.replace("_", " ").title(),
                "count": category_counts.get(cat, 0)
            }
            for cat in AppCategory
        ]
    }


@app.get("/api/v1/embedded-apps/{app_id}")
async def get_app(app_id: str):
    """Get a specific embedded app."""
    for app in EMBEDDED_APPS_CATALOG:
        if app["id"] == app_id:
            return EmbeddedApp(**app)

    raise HTTPException(status_code=404, detail="App not found")


@app.get("/api/v1/embedded-apps/user/config")
async def get_user_config(user_id: str = "default"):
    """Get user's app configurations."""
    return {
        "user_id": user_id,
        "configs": user_app_configs.get(user_id, []),
        "custom_apps": custom_apps.get(user_id, []),
    }


@app.post("/api/v1/embedded-apps/user/config")
async def save_user_config(config: UserAppConfig, user_id: str = "default"):
    """Save user's app configuration."""
    if user_id not in user_app_configs:
        user_app_configs[user_id] = []

    # Update or add config
    existing = next(
        (c for c in user_app_configs[user_id] if c.app_id == config.app_id),
        None
    )

    if existing:
        idx = user_app_configs[user_id].index(existing)
        user_app_configs[user_id][idx] = config
    else:
        user_app_configs[user_id].append(config)

    return {"status": "saved", "config": config}


@app.post("/api/v1/embedded-apps/user/custom")
async def add_custom_app(app: CustomApp, user_id: str = "default"):
    """Add a custom embedded app."""
    if user_id not in custom_apps:
        custom_apps[user_id] = []

    custom_app = {
        "id": f"custom-{uuid4().hex[:8]}",
        "name": app.name,
        "url": str(app.url),
        "icon": app.icon,
        "category": app.category,
        "color": app.color,
        "description": app.description or f"Custom app: {app.name}",
        "is_custom": True,
        "created_at": datetime.utcnow().isoformat(),
    }

    custom_apps[user_id].append(custom_app)

    return {"status": "created", "app": custom_app}


@app.delete("/api/v1/embedded-apps/user/custom/{app_id}")
async def delete_custom_app(app_id: str, user_id: str = "default"):
    """Delete a custom embedded app."""
    if user_id in custom_apps:
        custom_apps[user_id] = [
            a for a in custom_apps[user_id] if a["id"] != app_id
        ]

    return {"status": "deleted"}


@app.post("/api/v1/embedded-apps/launch/{app_id}")
async def launch_app(app_id: str, user_id: str = "default"):
    """Record app launch event."""
    event = AppLaunchEvent(app_id=app_id)

    if user_id not in app_usage:
        app_usage[user_id] = []

    app_usage[user_id].append(event)

    # Find the app
    app_data = next(
        (a for a in EMBEDDED_APPS_CATALOG if a["id"] == app_id),
        None
    )

    if not app_data:
        # Check custom apps
        if user_id in custom_apps:
            app_data = next(
                (a for a in custom_apps[user_id] if a["id"] == app_id),
                None
            )

    if not app_data:
        raise HTTPException(status_code=404, detail="App not found")

    return {
        "status": "launched",
        "app": app_data,
        "embed_url": app_data["url"],
    }


@app.get("/api/v1/embedded-apps/user/recent")
async def get_recent_apps(user_id: str = "default", limit: int = 10):
    """Get recently used apps."""
    if user_id not in app_usage:
        return {"apps": []}

    # Get unique recent apps
    recent = {}
    for event in reversed(app_usage[user_id]):
        if event.app_id not in recent:
            recent[event.app_id] = event

        if len(recent) >= limit:
            break

    recent_apps = []
    for app_id, event in recent.items():
        app_data = next(
            (a for a in EMBEDDED_APPS_CATALOG if a["id"] == app_id),
            None
        )
        if app_data:
            recent_apps.append({
                **app_data,
                "last_used": event.timestamp.isoformat()
            })

    return {"apps": recent_apps}


@app.get("/api/v1/embedded-apps/user/favorites")
async def get_favorite_apps(user_id: str = "default"):
    """Get user's pinned/favorite apps."""
    configs = user_app_configs.get(user_id, [])
    favorites = [c for c in configs if c.pinned]

    favorite_apps = []
    for config in favorites:
        app_data = next(
            (a for a in EMBEDDED_APPS_CATALOG if a["id"] == config.app_id),
            None
        )
        if app_data:
            favorite_apps.append({
                **app_data,
                "custom_name": config.custom_name,
                "position": config.position,
            })

    return {"apps": sorted(favorite_apps, key=lambda x: x.get("position", 0))}


@app.get("/api/v1/embedded-apps/stats")
async def get_stats():
    """Get embedded apps statistics."""
    total_apps = len(EMBEDDED_APPS_CATALOG)
    by_category = {}

    for app in EMBEDDED_APPS_CATALOG:
        cat = app["category"]
        by_category[cat] = by_category.get(cat, 0) + 1

    return {
        "total_apps": total_apps,
        "by_category": by_category,
        "categories_count": len(AppCategory),
        "custom_apps_enabled": True,
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8020,
        reload=True
    )
