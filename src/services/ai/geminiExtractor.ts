import { ServiceItem, BusinessProfile } from '../../types/catalog';
import { Lead, LeadUrgency } from '../../types/lead';

export interface AIAnalysisResult {
  category: string;
  urgency: LeadUrgency;
  budgetEstimate: string;
  location: string;
  matchScore: number;
  aiSummary: string;
  extractedNeeds: string[];
  matchedServiceId?: string;
  suggestedQuote?: number;
}

export async function analyzeLead(
  rawText: string,
  services: ServiceItem[],
  apiKey?: string,
  modelName: string = 'gemini-2.5-flash'
): Promise<AIAnalysisResult> {
  // If API key is provided, attempt live Google Gemini API call
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const activeServicesDescription = services
        .filter((s) => s.isActive)
        .map(
          (s) =>
            `- ID: ${s.id} | Title: ${s.title} | Category: ${s.category} | Price: $${s.price} (${s.pricingModel}) | Deliverables: ${s.keyDeliverables.join(', ')}`
        )
        .join('\n');

      const systemPrompt = `You are Mikana AI, an expert B2B deal qualification engine for contractors and service providers.
Analyze the following raw message/lead posted in a business channel and match it against our active service catalog.

Available Services:
${activeServicesDescription}

Return a valid JSON object matching this exact TypeScript structure:
{
  "category": "string",
  "urgency": "low" | "medium" | "urgent",
  "budgetEstimate": "string with currency symbol or 'Not Specified'",
  "location": "string or 'Remote/Unspecified'",
  "matchScore": number (0 to 100 representing relevance to our services),
  "aiSummary": "1-2 sentence executive summary of what the buyer wants",
  "extractedNeeds": ["3-4 bullet points of exact requirements"],
  "matchedServiceId": "ID of best matching service from catalog or null",
  "suggestedQuote": number or null
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nIncoming Lead Message:\n"""${rawText}"""` }],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJsonText) {
          const parsed = JSON.parse(rawJsonText);
          return {
            category: parsed.category || 'General Service',
            urgency: parsed.urgency === 'urgent' || parsed.urgency === 'medium' ? parsed.urgency : 'low',
            budgetEstimate: parsed.budgetEstimate || 'Quote Required',
            location: parsed.location || 'Remote',
            matchScore: Math.min(100, Math.max(0, Number(parsed.matchScore) || 85)),
            aiSummary: parsed.aiSummary || 'Buyer service inquiry.',
            extractedNeeds: Array.isArray(parsed.extractedNeeds) ? parsed.extractedNeeds : ['Scope breakdown required'],
            matchedServiceId: parsed.matchedServiceId || services[0]?.id,
            suggestedQuote: parsed.suggestedQuote || services[0]?.price,
          };
        }
      }
    } catch (e) {
      console.warn('Gemini API call failed, falling back to local heuristic extraction:', e);
    }
  }

  // Fallback / Offline / Demo intelligent heuristic parser
  return localHeuristicAnalysis(rawText, services);
}

export async function generateTailoredPitch(
  lead: Lead,
  matchedService: ServiceItem | undefined,
  profile: BusinessProfile,
  apiKey?: string,
  modelName: string = 'gemini-2.5-flash'
): Promise<string> {
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const prompt = `You are Mikana AI, writing a high-converting, professional WhatsApp DM sales proposal.
Buyer Name: ${lead.senderName}
Buyer Request: "${lead.rawText}"
Key Needs: ${lead.extractedNeeds.join(', ')}
Buyer Budget/Location: ${lead.budgetEstimate || 'N/A'} | ${lead.location || 'N/A'}

Our Business Profile:
- Name: ${profile.businessName}
- Tagline: ${profile.tagline}
- Phone/WhatsApp: ${profile.whatsappNumber}
- Pitch Rules: ${profile.customPitchGuidelines}

Matched Service:
- Title: ${matchedService?.title || 'Custom Engineering & Commercial Service'}
- Pricing: $${matchedService?.price || 1500} (${matchedService?.pricingModel || 'fixed'})
- Delivery: ${matchedService?.turnaroundTime || '5-7 Days'}
- Deliverables: ${matchedService?.keyDeliverables?.join(', ') || 'End-to-end execution'}
- Portfolio: ${matchedService?.portfolioLinks?.[0] || profile.website}

Requirements:
- Format directly for WhatsApp DM (use *bold* and _italic_ formatting where appropriate).
- Start with a cordial, professional opening addressing the buyer.
- Directly answer their scope, timeline, and exact deliverables.
- State clear, transparent pricing and warranty/guarantee.
- Include portfolio proof link.
- End with a low-friction Call to Action (e.g. "Can I send a 1-page spec over WhatsApp?").
- Do NOT use tacky emojis or buzzwords. Keep it high-trust and executive.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.3,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch (e) {
      console.warn('Gemini pitch generation failed, falling back to template engine:', e);
    }
  }

  // High-converting default pitch template
  const buyerGreeting = lead.senderName ? `Hi ${lead.senderName}` : 'Hello';
  const serviceTitle = matchedService?.title || 'our specialized commercial services';
  const priceDisplay = matchedService?.price ? `$${matchedService.price.toLocaleString()}` : '$1,500';
  const delivery = matchedService?.turnaroundTime || '5–7 business days';
  const portfolio = matchedService?.portfolioLinks?.[0] || profile.website || 'https://vanguardsolutions.io';

  return `${buyerGreeting},

I saw your inquiry regarding "${lead.aiSummary}" in ${lead.channelName}.

At *${profile.businessName}*, we specialize in ${serviceTitle}. We have immediate capacity to deliver this for you with the following terms:

• *Deliverables:* ${matchedService?.keyDeliverables.slice(0, 3).join(' • ') || 'Full specification & delivery'}
• *Timeline:* ${delivery}
• *Indicative Pricing:* ${priceDisplay} (${matchedService?.pricingModel || 'fixed'})
• *Portfolio Reference:* ${portfolio}

Would you be open to a quick 5-minute WhatsApp call or review of our 1-page specification sheet today?

Best regards,
*${profile.contactName}*
${profile.businessName} | ${profile.phone}`;
}

function localHeuristicAnalysis(rawText: string, services: ServiceItem[]): AIAnalysisResult {
  const lower = rawText.toLowerCase();

  // Match urgency
  let urgency: LeadUrgency = 'low';
  if (lower.includes('urgent') || lower.includes('asap') || lower.includes('immediately') || lower.includes('today')) {
    urgency = 'urgent';
  } else if (lower.includes('before') || lower.includes('this week') || lower.includes('friday') || lower.includes('quote')) {
    urgency = 'medium';
  }

  // Budget detection
  const budgetMatch = rawText.match(/(\$|€|£|zar|usd)\s?([\d,]+(\.\d{2})?)/i) || rawText.match(/([\d,]+)\s?(usd|zar|dollars)/i);
  const budgetEstimate = budgetMatch ? budgetMatch[0].toUpperCase() : 'Quote on Request';

  // Category and service matching
  let matchedService = services[0];
  let category = 'Commercial Services';
  let matchScore = 86;

  if (lower.includes('react') || lower.includes('app') || lower.includes('mobile') || lower.includes('code') || lower.includes('software')) {
    category = 'Software & Mobile Dev';
    matchedService = services.find((s) => s.category.includes('Software')) || services[0];
    matchScore = 96;
  } else if (lower.includes('solar') || lower.includes('inverter') || lower.includes('electric') || lower.includes('lithium') || lower.includes('generator')) {
    category = 'Solar & Electrical';
    matchedService = services.find((s) => s.category.includes('Solar')) || services[0];
    matchScore = 94;
  } else if (lower.includes('design') || lower.includes('brand') || lower.includes('figma') || lower.includes('logo') || lower.includes('ui')) {
    category = 'Design & UI/UX';
    matchedService = services.find((s) => s.category.includes('Design')) || services[0];
    matchScore = 92;
  }

  // Needs extraction
  const extractedNeeds: string[] = [
    `Target Scope: ${category}`,
    `Timeline: ${urgency === 'urgent' ? 'Immediate Turnaround' : 'Standard Turnaround'}`,
    `Budget Target: ${budgetEstimate}`,
  ];

  return {
    category,
    urgency,
    budgetEstimate,
    location: lower.includes('remote') ? 'Remote' : 'Regional / On-Site',
    matchScore,
    aiSummary: rawText.length > 90 ? `${rawText.slice(0, 90)}...` : rawText,
    extractedNeeds,
    matchedServiceId: matchedService?.id,
    suggestedQuote: matchedService?.price,
  };
}
