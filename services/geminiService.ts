import { GoogleGenAI } from "@google/genai";
import { Deal, ScanResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

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

// Fallback search patterns for when a specific deal link isn't found
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
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  const modelId = "gemini-2.5-flash"; // Using flash for speed
  
  let prompt = '';

  if (findFreeKeys) {
    if (!gameTitle.trim()) {
      // General Free Key Search
      prompt = `
        Search for legitimate FREE STEAM KEYS, 100% OFF giveaways, and active "Free to Keep" promotions for ANY popular PC games currently available.
        
        Check sources like:
        1. Steam (100% off discounts/free to keep)
        2. Epic Games Store (Current Weekly Free Games)
        3. Humble Bundle (Active Giveaways)
        4. Indiegala (Freebies section)
        5. GOG.com (Giveaways)
        6. Reddit (r/FreeGameFindings, r/FreeGamesOnSteam)
        
        Identify 3-6 of the best currently active free offers. Exclude generic "Free to Play" MMOs unless they are trending; focus on paid games that are temporarily free.

        CRITICAL: Output the result strictly as a valid JSON object. Do not wrap in markdown code blocks. The JSON should have this structure:
        {
          "deals": [
            {
              "store": "Source/Store Name",
              "edition": "Game Title (e.g. 'Deus Ex - GoG Giveaway')",
              "currentPrice": "Free",
              "originalPrice": "$XX.XX",
              "discountPercent": 100
            }
          ],
          "summary": "A 1-sentence summary of the best free games available right now."
        }
      `;
    } else {
      // Specific Game Free Search
      prompt = `
        Search for legitimate FREE STEAM KEYS, 100% OFF giveaways, or current "Free to Keep" promotions for the game: '${gameTitle}'.
        
        Check sources like:
        1. Steam (Free to Play or 100% off)
        2. Humble Bundle (Giveaways)
        3. Indiegala (Freebies section)
        4. Fanatical (Giveaways)
        5. GOG.com (Free giveaways)
        6. Epic Games Store (Weekly free games)
        7. Reddit (r/FreeGamesOnSteam, r/GameDeals)
        
        If the game is permanently Free-to-Play, please list that as a "deal" with $0.00 price.
        If no active giveaways are found for this specific game, look for the lowest historical price or heavily discounted keys (under $1) as alternatives.

        CRITICAL: Output the result strictly as a valid JSON object. Do not wrap in markdown code blocks. The JSON should have this structure:
        {
          "deals": [
            {
              "store": "Source/Store Name",
              "edition": "Edition/Type (e.g. 'Giveaway', 'Free to Play', 'Steam Key')",
              "currentPrice": "Free" or "$0.00",
              "originalPrice": "$XX.XX",
              "discountPercent": 100
            }
          ],
          "summary": "A 1-sentence summary stating if a free key was found or if the game is paid only."
        }
        
        If no free option is found, provide the cheapest available paid option but clearly mark discountPercent relative to full price.
      `;
    }
  } else {
    // Standard Price Check (Specific Game)
    prompt = `
      Find the current real-time price of '${gameTitle}' on the following stores:
      1. Steam
      2. GOG.com
      3. Epic Games Store
      4. Humble Bundle
      5. Green Man Gaming
      6. Fanatical
      7. Gamesplanet
      8. Indiegala
      9. CDKeys (or similar popular key sites)

      IMPORTANT HANDLING FOR DLCs:
      If the requested title implies a group of items like "ESO DLC", "The Elder Scrolls Online DLC", or "Sims 4 DLC", please identify the 3 most recent or major expansions (e.g., Gold Road, Necrom, High Isle) and list them as separate deal entries. Do not just list one generic price.

      If you find a specific price, please list it. If you cannot find a specific price, estimate based on standard prices.
      
      CRITICAL: Output the result strictly as a valid JSON object. Do not wrap in markdown code blocks. The JSON should have this structure:
      {
        "deals": [
          {
            "store": "Store Name",
            "edition": "Edition Name / DLC Name",
            "currentPrice": "$XX.XX",
            "originalPrice": "$XX.XX",
            "discountPercent": 0
          }
        ],
        "summary": "A brief 1-sentence summary of the best deal found."
      }

      If a store is not on sale, discountPercent should be 0.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // schema is not allowed with googleSearch
      },
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Attempt to extract JSON from the text response
    let parsedResult: { deals: any[], summary: string } | null = null;
    
    // Cleanup markdown if present
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      parsedResult = JSON.parse(jsonString);
    } catch (e) {
      console.warn("Failed to parse pure JSON, attempting to extract object from string", e);
      // Fallback: Try to find the first { and last }
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          parsedResult = JSON.parse(jsonString.substring(firstBrace, lastBrace + 1));
        } catch (e2) {
          console.error("Could not recover JSON", e2);
        }
      }
    }

    // Map extracted URLs to the deals if possible, or just return the data
    const deals: Deal[] = (parsedResult?.deals || []).map((d: any, index: number) => {
      // URL Matching Strategy:
      // 1. Identify specific store domain if possible
      // 2. Look for grounding chunks that contain that domain AND match the game title partially
      
      const normalizedStoreName = d.store.toLowerCase();
      let targetDomain = '';
      
      for (const [key, domain] of Object.entries(STORE_DOMAINS)) {
        if (normalizedStoreName.includes(key)) {
          targetDomain = domain;
          break;
        }
      }

      let bestUrl = '#';
      
      // 1. Try to find a direct link from Gemini's grounding
      if (targetDomain) {
        const domainMatch = groundingChunks.find(c => 
          c.web?.uri?.toLowerCase().includes(targetDomain)
        );
        if (domainMatch?.web?.uri) {
          bestUrl = domainMatch.web.uri;
        }
      }

      // 2. Fallback: Generate Store Search URL
      // If we don't have a direct link, we generate a search link for the store
      // This ensures the user is never stuck with a dead link
      if (bestUrl === '#' || bestUrl.includes('google.com/url')) {
         let searchUrlGenerator = null;
         for (const [key, generator] of Object.entries(STORE_SEARCH_PATTERNS)) {
           if (normalizedStoreName.includes(key)) {
             searchUrlGenerator = generator;
             break;
           }
         }

         if (searchUrlGenerator) {
            // Use provided gameTitle if available (most accurate for standard search)
            // Otherwise use d.edition which holds the game name in free-hunt mode
            let searchTerm = (gameTitle && gameTitle.trim()) ? gameTitle : d.edition;
            
            // Cleanup common noise words
            if (searchTerm) {
                searchTerm = searchTerm.replace(/\s*-\s*Giveaway/i, '')
                                     .replace(/\s*-\s*Free/i, '')
                                     .replace(/\s*Edition/i, '')
                                     .trim();
                bestUrl = searchUrlGenerator(searchTerm);
            }
         } else {
             // 3. Last Resort: Google Search
             const term = (gameTitle && gameTitle.trim()) ? `${gameTitle} ${d.store}` : `${d.edition} ${d.store}`;
             bestUrl = `https://www.google.com/search?q=${encodeURIComponent(term + ' store page')}`;
         }
      }

      // Handle "Free" string in calculation
      let discPercent = d.discountPercent;
      if (typeof discPercent === 'string') {
        discPercent = parseFloat(discPercent.replace('%', ''));
      }
      
      // Auto-fix discount if price is free
      if ((d.currentPrice === 'Free' || d.currentPrice === '$0.00') && !discPercent) {
        discPercent = 100;
      }

      return {
        id: `deal-${index}-${Date.now()}`,
        store: d.store,
        edition: d.edition, // This will contain the Game Name in general search mode
        currentPrice: d.currentPrice,
        originalPrice: d.originalPrice,
        discountPercent: discPercent || 0,
        url: bestUrl,
        lastChecked: new Date().toLocaleTimeString()
      };
    });

    return {
      deals: deals,
      summary: parsedResult?.summary || "Could not retrieve specific details. Check the links provided."
    };

  } catch (error) {
    console.error("Error checking prices:", error);
    throw error;
  }
};