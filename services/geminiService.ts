import { GoogleGenAI } from "@google/genai";
import { Deal, ScanResult } from "../types";

// VITE REQUIREMENT: Use import.meta.env and the VITE_ prefix
const apiKey = import.meta.env.VITE_API_KEY || '';

// Map store names to their official domains for better link matching
const STORE_DOMAINS: Record<string, string> = {
  'steam': 'store.steampowered.com',
  'gog': 'gog.com',
  'epic': 'store.epicgames.com',
  'humble': 'humblebundle.com',
  'fanatical': 'fanatical.com',
  'green man gaming': 'greenmangaming.com',
  'gamesplanet': 'gamesplanet.com',
  'indiegala': 'indiegala.com',
  'cdkeys': 'cdkeys.com',
  'xbox': 'xbox.com',
  'microsoft': 'microsoft.com',
  'ubisoft': 'store.ubisoft.com',
  'ea': 'ea.com',
  'origin': 'ea.com'
};

const STORE_SEARCH_PATTERNS: Record<string, (term: string) => string> = {
  'steam': (t) => `https://store.steampowered.com/search/?term=${encodeURIComponent(t)}`,
  'gog': (t) => `https://www.gog.com/en/games?query=${encodeURIComponent(t)}`,
  'epic': (t) => `https://store.epicgames.com/en-US/browse?q=${encodeURIComponent(t)}&sortBy=relevancy`,
  'humble': (t) => `https://www.humblebundle.com/store/search?sort=bestselling&search=${encodeURIComponent(t)}`,
  'fanatical': (t) => `https://www.fanatical.com/en/search?search=${encodeURIComponent(t)}`,
  'green man gaming': (t) => `https://www.greenmangaming.com/search?query=${encodeURIComponent(t)}`,
  'gamesplanet': (t) => `https://us.gamesplanet.com/search?query=${encodeURIComponent(t)}`,
  'indiegala': (t) => `https://www.indiegala.com/search/store-games/${encodeURIComponent(t)}`,
  'cdkeys': (t) => `https://www.cdkeys.com/catalogsearch/result/?q=${encodeURIComponent(t)}`,
  'xbox': (t) => `https://www.xbox.com/en-US/search?q=${encodeURIComponent(t)}`,
  'microsoft': (t) => `https://www.microsoft.com/en-us/search/shop/games?q=${encodeURIComponent(t)}`,
  'ubisoft': (t) => `https://store.ubisoft.com/us/search/?q=${encodeURIComponent(t)}`,
  'ea': (t) => `https://www.ea.com/search?q=${encodeURIComponent(t)}`
};

export const checkGamePrices = async (gameTitle: string, findFreeKeys: boolean = false): Promise<ScanResult> => {
  // Check for the key inside the function to avoid immediate crash
  if (!apiKey || apiKey === '') {
    console.error("API Key is missing from Vercel Environment Variables!");
    throw new Error("API Key is missing. Please check your Vercel configuration.");
  }

  // Initialize the AI client
  const ai = new GoogleGenAI(apiKey);
  const modelId = "gemini-1.5-flash-latest"; // Fixed: Changed from 2.5 to 1.5
  
  let prompt = '';

  if (findFreeKeys) {
    if (!gameTitle.trim()) {
      prompt = `
        Search for legitimate FREE STEAM KEYS, 100% OFF giveaways, and active "Free to Keep" promotions for ANY popular PC games currently available.
        Check Steam, Epic, Humble, Indiegala, GOG, and Reddit.
        Output result STRICTLY as a valid JSON object. Do not wrap in markdown.
        {
          "deals": [
            {
              "store": "Store Name",
              "edition": "Game Title",
              "currentPrice": "Free",
              "originalPrice": "$XX.XX",
              "discountPercent": 100
            }
          ],
          "summary": "Summary text here."
        }
      `;
    } else {
      prompt = `
        Search for legitimate FREE STEAM KEYS, 100% OFF giveaways, or current "Free to Keep" promotions for: '${gameTitle}'.
        Check Steam, Humble, Indiegala, GOG, Epic, and Reddit.
        Output result STRICTLY as a valid JSON object.
        {
          "deals": [
            {
              "store": "Store Name",
              "edition": "Edition",
              "currentPrice": "Free",
              "originalPrice": "$XX.XX",
              "discountPercent": 100
            }
          ],
          "summary": "Summary text here."
        }
      `;
    }
  } else {
    prompt = `
      Find current real-time prices for '${gameTitle}' on Steam, GOG, Epic, Humble, Green Man Gaming, Fanatical, Gamesplanet, Indiegala, CDKeys.
      Output result STRICTLY as a valid JSON object.
      {
        "deals": [
          {
            "store": "Store Name",
            "edition": "Edition Name",
            "currentPrice": "$XX.XX",
            "originalPrice": "$XX.XX",
            "discountPercent": 0
          }
        ],
        "summary": "Summary text here."
      }
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    let parsedResult: { deals: any[], summary: string } | null = null;
    
    // Clean potential markdown blocks
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      parsedResult = JSON.parse(jsonString);
    } catch (e) {
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          parsedResult = JSON.parse(jsonString.substring(firstBrace, lastBrace + 1));
        } catch (e2) {
          console.error("JSON Recovery failed", e2);
        }
      }
    }

    const deals: Deal[] = (parsedResult?.deals || []).map((d: any, index: number) => {
      const normalizedStoreName = d.store.toLowerCase();
      let targetDomain = '';
      
      for (const [key, domain] of Object.entries(STORE_DOMAINS)) {
        if (normalizedStoreName.includes(key)) {
          targetDomain = domain;
          break;
        }
      }

      let bestUrl = '#';
      
      if (targetDomain) {
        const domainMatch = groundingChunks.find(c => 
          c.web?.uri?.toLowerCase().includes(targetDomain)
        );
        if (domainMatch?.web?.uri) {
          bestUrl = domainMatch.web.uri;
        }
      }

      if (bestUrl === '#' || bestUrl.includes('google.com/url')) {
         let searchUrlGenerator = null;
         for (const [key, generator] of Object.entries(STORE_SEARCH_PATTERNS)) {
           if (normalizedStoreName.includes(key)) {
             searchUrlGenerator = generator;
             break;
           }
         }

         if (searchUrlGenerator) {
            let searchTerm = (gameTitle && gameTitle.trim()) ? gameTitle : d.edition;
            if (searchTerm) {
                searchTerm = searchTerm.replace(/\s*-\s*Giveaway/i, '')
                                     .replace(/\s*-\s*Free/i, '')
                                     .replace(/\s*Edition/i, '')
                                     .trim();
                bestUrl = searchUrlGenerator(searchTerm);
            }
         } else {
             const term = (gameTitle && gameTitle.trim()) ? `${gameTitle} ${d.store}` : `${d.edition} ${d.store}`;
             bestUrl = `https://www.google.com/search?q=${encodeURIComponent(term + ' store page')}`;
         }
      }

      let discPercent = d.discountPercent;
      if (typeof discPercent === 'string') {
        discPercent = parseFloat(discPercent.replace('%', ''));
      }
      
      if ((d.currentPrice === 'Free' || d.currentPrice === '$0.00') && !discPercent) {
        discPercent = 100;
      }

      return {
        id: `deal-${index}-${Date.now()}`,
        store: d.store,
        edition: d.edition,
        currentPrice: d.currentPrice,
        originalPrice: d.originalPrice,
        discountPercent: discPercent || 0,
        url: bestUrl,
        lastChecked: new Date().toLocaleTimeString()
      };
    });

    return {
      deals: deals,
      summary: parsedResult?.summary || "Prices retrieved successfully."
    };

  } catch (error) {
    console.error("Error checking prices:", error);
    throw error;
  }
};
