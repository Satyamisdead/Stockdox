
'use server';

import type { NewsArticle } from '@/types';

const MARKETAUX_API_BASE_URL = 'https://api.marketaux.com/v1/news/all';
const API_REQUEST_TIMEOUT = 15000; // 15 seconds

interface MarketAuxArticle {
    uuid: string;
    title: string;
    description: string;
    snippet: string;
    url: string;
    image_url: string;
    language: string;
    published_at: string;
    source: string;
}

interface MarketAuxResponse {
    meta: {
        found: number;
        returned: number;
        limit: number;
        page: number;
    };
    data: MarketAuxArticle[];
}


async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { 
        signal: controller.signal,
        next: { revalidate: 172800 } // Cache for 2 days (48 hours)
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if ((error as Error).name === 'AbortError') {
      console.warn(`Request to ${url} timed out after ${timeout}ms.`);
    } else {
      console.error(`Exception during fetch to ${url}:`, error);
    }
    throw error; // Re-throw to be handled by the caller
  }
}

export async function fetchLatestNews(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEXT_PUBLIC_MARKETAUX_API_KEY;

  if (!apiKey) {
    console.error("MarketAux API key is missing. Please set NEXT_PUBLIC_MARKETAUX_API_KEY in your .env.local file.");
    throw new Error("API key for news service is not configured.");
  }
  
  const today = new Date();
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);
  const publishedAfter = twoDaysAgo.toISOString().split('T')[0];

  const url = `${MARKETAUX_API_BASE_URL}?countries=us&filter_entities=true&limit=8&published_after=${publishedAfter}&api_token=${apiKey}`;

  try {
    const response = await fetchWithTimeout(url, API_REQUEST_TIMEOUT);

    if (!response.ok) {
      const errorBody = await response.json();
      console.error(`Error fetching news from MarketAux: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch news. Status: ${response.status}`);
    }

    const data: MarketAuxResponse = await response.json();

    return data.data.map((article: MarketAuxArticle) => ({
      id: article.uuid,
      title: article.title,
      source: article.source,
      publishedAt: article.published_at,
      url: article.url,
      summary: article.snippet,
      imageUrl: article.image_url,
    }));
  } catch (error) {
    console.error("An error occurred in fetchLatestNews:", error);
    throw error; // Re-throw to be handled by the calling component
  }
}
