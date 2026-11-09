import { toolDirectory } from "./tool-directory";
import { SUPPORT_EMAIL, SUPPORT_EMAIL_HREF } from "./support";

export type HelpLink = { label: string; href: string };
export type HelpReply = { text: string; links: HelpLink[] };

export const HELP_MESSAGE_LIMIT = 300;
export const helpTopics = [
  "Find an HVAC tool",
  "Create a work order",
  "Schedule a service visit",
  "Contact support",
] as const;

const allTools: HelpLink = { label: "Browse all HVAC tools", href: "/tools" };
const contact: HelpLink = { label: `Email ${SUPPORT_EMAIL}`, href: SUPPORT_EMAIL_HREF };

export const helpWelcome: HelpReply = {
  text: "Hi! I can help you find an HVAC tool, use the dashboard, or contact support. Choose a topic below or type a short question in English.",
  links: [],
};

const stopWords = new Set("a an and are as at be can could do does for from get help how i in is it me my not of on or please show tell that the there this to use want what where which why with would you your need find working work wont doesnt isn t s".split(" "));

function tokens(value: string): string[] {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
}

// Rank only known directory entries. Never generate a URL or a technical diagnosis.
function findTools(query: string): HelpLink[] {
  const terms = [...new Set(tokens(query).filter((term) => !stopWords.has(term)))];
  return toolDirectory.map((tool) => {
    const title = new Set(tokens(tool.title));
    const keywords = new Set(tokens(tool.keywords));
    const description = new Set(tokens(tool.description));
    const score = terms.reduce((total, term) => total + (
      title.has(term) ? 3 : keywords.has(term) ? 2 : description.has(term) ? 1 : 0
    ), 0);
    return { tool, score };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ tool }) => ({
      label: tool.title,
      href: tool.href.startsWith("#") ? `/tools${tool.href}` : tool.href,
    }));
}

export function getHelpReply(message: string): HelpReply {
  const value = message.trim();
  if (!value) return helpWelcome;
  if (value.length > HELP_MESSAGE_LIMIT) {
    return { text: `Please keep your question to ${HELP_MESSAGE_LIMIT} characters or fewer.`, links: [] };
  }
  const query = tokens(value).join(" ");

  if (/\b(emergency|gas leak|smell gas|smell of gas|carbon monoxide|smoke in|fire in)\b/.test(query)) {
    return {
      text: "This chat is not an emergency service. If there is immediate danger, stop using this chat and contact local emergency services from a safe location. A chat reply cannot establish that equipment is safe.",
      links: [],
    };
  }
  if (/\b(bypass|jumper|defeat|override)\b/.test(query) && /\b(safety|safeties|interlock|limit|fire|lockout)\b/.test(query)) {
    return {
      text: "This guide cannot help bypass safety controls or interlocks. Follow the equipment manufacturer's procedures and involve a qualified technician. For non-emergency website help, use the email link below.",
      links: [contact],
    };
  }
  if (/\b(privacy|private|ai|chatgpt|human|live agent|live chat)\b|\b(chat|messages?|conversation)\b.*\b(store|stored|saved|history)\b|\b(store|stored|saved|history)\b.*\b(chat|messages?|conversation)\b/.test(query)) {
    return {
      text: "This is a guided helper with prewritten replies, not AI or a live agent. Chat messages stay in this page's memory; this feature does not send or save them to a server. Refreshing the page or selecting Clear chat removes the conversation. Email opens your mail app and is sent only if you choose to send it there.",
      links: [contact],
    };
  }
  if (/\b(email|support|reach|person|contact us|contact aj)\b/.test(query) || query === "contact") {
    return {
      text: `For help from AJ Climate Controls, email ${SUPPORT_EMAIL}. Describe the page or tool and the issue, without passwords or sensitive site details. This opens your mail app; no message is sent by this chat. A response time is not guaranteed.`,
      links: [contact],
    };
  }
  if (/\b(work orders?|maintenance tasks?|priority)\b/.test(query)) {
    return {
      text: "On the dashboard, select New work order or Add work order. Enter a work description, select equipment and a priority, then choose Save work order. Use the Work orders table to update its status, filter by priority, or hide completed orders. This chat does not create or change records.",
      links: [{ label: "Go to work orders", href: "/#work-orders" }],
    };
  }
  if (/\b(schedule|scheduling|appointment|appointments|calendar|service visit)\b/.test(query)) {
    return {
      text: "Open the Appointment calendar and select Schedule visit. Choose the equipment, date, start and end times, then save the visit. The end time must be later than the start time on the same day. Creating a calendar record does not send a booking request to a technician.",
      links: [{ label: "Open the service calendar", href: "/#schedule" }],
    };
  }
  if (/\b(equipment status|search equipment|find equipment|assets?|asset registry)\b/.test(query)) {
    return {
      text: "In Equipment status, search by name, type, or location. Use Filter by status to narrow the list, or Clear filters to show all equipment. Changing a status updates the dashboard record; it does not operate the physical equipment.",
      links: [{ label: "Find equipment", href: "/#equipment" }],
    };
  }
  if (!/\bfire\b/.test(query) && /\b(alarms?|acknowledge|acknowledging)\b/.test(query)) {
    return {
      text: "Review Active alarms on the dashboard. Acknowledge marks an alarm as acknowledged in the dashboard; it does not fix the underlying issue or reset physical equipment. Follow your site's approved response procedures.",
      links: [{ label: "Review active alarms", href: "/#alarms" }],
    };
  }
  if (/\b(dark|light|theme)\b/.test(query)) {
    return {
      text: "On the dashboard, use the sun or moon button to switch between light and dark mode. On smaller screens, open the navigation menu for the theme button. Your choice is saved in this browser when browser storage is available.",
      links: [{ label: "Open the dashboard", href: "/" }],
    };
  }
  if (/^(find an hvac tool|hvac tools?|tools?|help|hello|hi)$/.test(query)) {
    return { text: "Browse the HVAC tool directory, or tell me the tool or topic you need—for example BACnet, boiler flow, 4–20 mA, or CFM. Tool suggestions are navigation help, not a diagnosis.", links: [allTools] };
  }

  const matches = findTools(value);
  if (matches.length) {
    return {
      text: "These tools may match your question. Open a tool to enter your readings and review its guidance. I have not diagnosed the equipment or checked any live readings.",
      links: [...matches, allTools],
    };
  }
  return {
    text: "I don't have a prepared answer for that. I can help you find HVAC tools, use work orders or the calendar, and contact support. Try a topic below or email AJ Climate Controls.",
    links: [allTools, contact],
  };
}
