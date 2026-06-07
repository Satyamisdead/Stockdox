'use server';
/**
 * @fileOverview A conversational AI flow for Stockdox, embodying the "Stockdox AI" persona.
 *
 * - stockdoxChat - A function that handles chat interactions.
 * - StockdoxChatInput - The input type for the stockdoxChat function.
 * - StockdoxChatOutput - The return type for the stockdoxChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const StockdoxChatInputSchema = z.object({
  message: z.string().describe('The user message to the chatbot.'),
});
export type StockdoxChatInput = z.infer<typeof StockdoxChatInputSchema>;

const StockdoxChatOutputSchema = z.object({
  answer: z.string().describe("The clear human-readable answer."),
  action: z.string().optional(),
  data: z.any().optional(),
  source: z.array(z.string()).optional(),
  disclaimer: z.string().optional(),
});
export type StockdoxChatOutput = z.infer<typeof StockdoxChatOutputSchema>;

// We keep the Genkit schema/prompt definitions for Dev UI registering and compatibility,
// but we do not execute it at runtime to prevent API key and connection errors on Vercel.
export const stockdoxChatPrompt = ai.definePrompt({
  name: 'stockdoxChatPrompt',
  input: {schema: StockdoxChatInputSchema},
  output: {
    format: 'json',
    schema: StockdoxChatOutputSchema,
  },
  prompt: `You are Stockdox AI.`,
});

export const stockdoxChatFlow = ai.defineFlow(
  {
    name: 'stockdoxChatFlow',
    inputSchema: StockdoxChatInputSchema,
    outputSchema: StockdoxChatOutputSchema,
  },
  async (input) => {
    // Fallback logic if called directly through genkit flow
    return stockdoxChat(input);
  }
);

/**
 * Main handler for chatbot messages.
 * Runs 100% locally with high-quality predefined financial answers,
 * greetings handling, and abuse filters. This ensures 100% uptime and instant replies on Vercel.
 */
export async function stockdoxChat(input: StockdoxChatInput): Promise<StockdoxChatOutput> {
  const rawMessage = input.message || '';
  const message = rawMessage.trim().toLowerCase();

  // 1. Abuse / Swearing Detection (Gali)
  const abuseWords = [
    'bkl', 'mc', 'bc', 'chutiya', 'chutya', 'chutiye', 'madarchod', 'maderchod', 'behenchod', 'behanchod', 
    'harami', 'gandu', 'bsdk', 'saala', 'sala', 'kamina', 'randi', 'loda', 'lauda', 'luda', 'laund', 
    'bhosdike', 'bhosdika', 'gaand', 'chut', 'tatte', 'fuck', 'shit', 'asshole', 'bitch', 'bastard', 
    'cunt', 'dick', 'pussy', 'idiot', 'stupid', 'dumb', 'suck'
  ];

  const hasAbuse = abuseWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(message);
  });

  if (hasAbuse) {
    return {
      answer: "Please keep the conversation respectful and professional. I am here to help you with stock market, crypto, and financial queries. How can I assist you today?",
      action: "none",
      disclaimer: "This is for informational purposes only. Please consult a registered financial advisor."
    };
  }

  // 2. Greetings Detection
  const greetings = [
    'hi', 'hello', 'hey', 'hii', 'hy', 'hola', 'yo', 'namaste', 'greetings', 'hlo', 'helo', 'wassup', 'hi hello'
  ];

  // Clean punctuation from greeting matching
  const cleanMessage = message.replace(/[\\?.,!/]/g, '').trim();
  const isGreeting = greetings.some(greet => {
    return cleanMessage === greet || cleanMessage.startsWith(greet + ' ') || cleanMessage.endsWith(' ' + greet);
  });

  if (isGreeting) {
    return {
      answer: "Hello! I'm Stockdox AI. How can I assist you with your financial journey today? You can ask me about stocks, cryptocurrencies, investing concepts, portfolio management, or even take a quick finance quiz!",
      action: "none",
      disclaimer: "This is for informational purposes only. Please consult a registered financial advisor."
    };
  }

  // 3. Conversational / Thanks
  if (message.includes('thank you') || message.includes('thanks') || message.includes('ty') || message.includes('awesome') || message.includes('great') || message.includes('perfect')) {
    return {
      answer: "You're very welcome! I'm glad I could help. Let me know if you have any other questions about stocks, crypto, or investing.",
      action: "none",
      disclaimer: "This is for informational purposes only. Please consult a registered financial advisor."
    };
  }

  if (message.includes('who are you') || message.includes('your name') || message.includes('introduce yourself') || message.includes('who is stockdox') || message.includes('what is stockdox')) {
    return {
      answer: "I am Stockdox AI, a smart financial assistant designed to help you analyze stocks, cryptocurrencies, explore market trends, and learn investing concepts. How can I help you today?",
      action: "none",
      disclaimer: "This is for informational purposes only. Please consult a registered financial advisor."
    };
  }

  // 4. Quiz request
  if (message.includes('quiz') || message.includes('test me') || message.includes('mcq') || message.includes('play quiz')) {
    return {
      answer: "Let's test your financial knowledge! Here is a quick 3-question quiz. Reply with your answers!",
      action: "quiz",
      data: {
        questions: [
          {
            id: 1,
            question: "What does P/E ratio stand for?",
            options: ["Price to Earnings", "Profit to Expense", "Price to Equity", "Public to Enterprise"],
            answer: "Price to Earnings"
          },
          {
            id: 2,
            question: "Which asset class is historically considered the safest but offers the lowest return?",
            options: ["Stocks", "Cryptocurrency", "Government Bonds", "Real Estate"],
            answer: "Government Bonds"
          },
          {
            id: 3,
            question: "What is the term for a market that is rising and showing optimism?",
            options: ["Bear Market", "Bull Market", "Sideways Market", "Correction"],
            answer: "Bull Market"
          }
        ],
        explain_after: true
      },
      disclaimer: "This is for informational purposes only. Please consult a registered financial advisor."
    };
  }

  // 5. Live Price / Chart Requests
  if (message.includes('price') || message.includes('chart') || message.includes('live') || message.includes('value')) {
    // Check for stock tickers
    let tickers: string[] = [];
    if (message.includes('apple') || message.includes('aapl')) tickers = ['AAPL'];
    else if (message.includes('microsoft') || message.includes('msft')) tickers = ['MSFT'];
    else if (message.includes('google') || message.includes('goog')) tickers = ['GOOGL'];
    else if (message.includes('amazon') || message.includes('amzn')) tickers = ['AMZN'];
    else if (message.includes('tesla') || message.includes('tsla')) tickers = ['TSLA'];
    else if (message.includes('nvidia') || message.includes('nvda')) tickers = ['NVDA'];
    else if (message.includes('reliance')) tickers = ['RELIANCE.NS'];
    else if (message.includes('tcs')) tickers = ['TCS.NS'];
    else if (message.includes('infy') || message.includes('infosys')) tickers = ['INFY.NS'];

    if (tickers.length > 0) {
      return {
        answer: `Sure! Let me fetch the latest live price and chart for ${tickers[0]} for you.`,
        action: "fetch_price",
        data: { tickers },
        disclaimer: "This is for informational purposes only. Please consult a registered financial advisor."
      };
    }

    // Check for crypto ids
    let cryptoIds: string[] = [];
    if (message.includes('bitcoin') || message.includes('btc')) cryptoIds = ['bitcoin'];
    else if (message.includes('ethereum') || message.includes('eth')) cryptoIds = ['ethereum'];
    else if (message.includes('solana') || message.includes('sol')) cryptoIds = ['solana'];
    else if (message.includes('dogecoin') || message.includes('doge')) cryptoIds = ['dogecoin'];
    else if (message.includes('cardano') || message.includes('ada')) cryptoIds = ['cardano'];

    if (cryptoIds.length > 0) {
      return {
        answer: `Fetching the latest live price and market data for ${cryptoIds[0].toUpperCase()} for you.`,
        action: "fetch_crypto_price",
        data: { crypto_ids: cryptoIds },
        disclaimer: "This is for informational purposes only. Please consult a registered financial advisor."
      };
    }
  }

  // 6. News / Market Summary requests
  if (message.includes('news') || message.includes('headline')) {
    return {
      answer: "Fetching the latest financial news and headlines for you.",
      action: "fetch_news",
      disclaimer: "This is for informational purposes only. Please consult a registered financial advisor."
    };
  }
  if (message.includes('gainer') || message.includes('loser') || message.includes('market summary') || message.includes('market today') || message.includes('market status')) {
    return {
      answer: "Let's check the top gainers and losers in the market today.",
      action: "fetch_market_summary",
      disclaimer: "This is for informational purposes only. Please consult a registered financial advisor."
    };
  }

  // 7. Finance Knowledge Base Matching
  const financeQA = [
    {
      keys: ['pe ratio', 'p/e ratio', 'price to earnings'],
      answer: "The Price-to-Earnings (P/E) ratio compares a company's stock price to its earnings per share (EPS). It helps determine if a stock is overvalued (high P/E) or undervalued (low P/E) relative to its peers."
    },
    {
      keys: ['dividend', 'dividends'],
      answer: "A dividend is a portion of a company's earnings distributed to its shareholders, usually as cash or additional shares. Many investors buy dividend-paying stocks to build a reliable source of passive income."
    },
    {
      keys: ['market cap', 'market capitalization', 'large cap', 'mid cap', 'small cap'],
      answer: "Market Capitalization (Market Cap) represents the total dollar value of a company's outstanding shares. It is calculated as: Shares Outstanding × Current Stock Price. It classifies companies into Large-cap ($10B+), Mid-cap ($2B-$10B), and Small-cap (under $2B)."
    },
    {
      keys: ['ipo', 'initial public offering'],
      answer: "An Initial Public Offering (IPO) is when a private company sells its shares to the public for the first time on a stock exchange. This allows the company to raise capital to fund growth, and gives public investors a chance to buy in early."
    },
    {
      keys: ['mutual fund', 'mutual funds'],
      answer: "A mutual fund pools money from many investors to purchase a diversified portfolio of stocks, bonds, or other securities. It is managed by professional fund managers, offering individual investors easy diversification and professional oversight."
    },
    {
      keys: ['etf', 'exchange traded fund', 'etfs'],
      answer: "An Exchange-Traded Fund (ETF) is an investment fund traded on stock exchanges, much like individual stocks. ETFs typically track an index (like the S&P 500) and hold a basket of assets, offering diversification with low fees."
    },
    {
      keys: ['how to invest', 'where to invest', 'investing basics', 'start investing', 'investment plan', 'invest'],
      answer: "To start investing: 1) Define your financial goals and time horizon, 2) Understand your risk tolerance, 3) Open a brokerage account, and 4) Start with low-cost diversified index funds or ETFs. Consistency (like monthly investing) is the key to wealth creation."
    },
    {
      keys: ['portfolio', 'asset allocation', 'diversification', 'diversify'],
      answer: "A portfolio is your collection of financial assets (stocks, bonds, crypto, cash). Building a strong portfolio involves 'asset allocation' (dividing assets based on your goals and risk tolerance) and 'diversification' (spreading investments to reduce risk)."
    },
    {
      keys: ['risk management', 'stop loss', 'limit risk', 'risk profile'],
      answer: "Risk management in investing includes: 1) Diversifying your assets to avoid concentration risk, 2) Setting Stop-Loss orders to protect capital, and 3) Maintaining a long-term horizon to ride out short-term market fluctuations."
    },
    {
      keys: ['inflation', 'purchasing power'],
      answer: "Inflation is the rate at which general prices for goods and services rise, which reduces your purchasing power over time. Investing in inflation-beating assets like equities, mutual funds, or real estate helps protect your wealth."
    },
    {
      keys: ['interest rate', 'interest rates', 'fed rate', 'rbi rate'],
      answer: "Interest rates are the cost of borrowing money. Central banks raise rates to control high inflation and lower them to stimulate growth. Higher interest rates increase borrowing costs, which can temporarily cool down stock valuations."
    },
    {
      keys: ['bear market', 'bull market', 'market trend'],
      answer: "A Bull Market is a market condition characterized by rising stock prices and strong investor confidence. A Bear Market is the opposite, marked by falling prices (typically a decline of 20% or more from recent peaks) and widespread pessimism."
    },
    {
      keys: ['bitcoin', 'btc'],
      answer: "Bitcoin (BTC) is the first decentralized digital cryptocurrency, launched in 2009 by Satoshi Nakamoto. It runs on a global peer-to-peer network utilizing blockchain technology to record transactions securely without intermediaries."
    },
    {
      keys: ['ethereum', 'eth', 'smart contract'],
      answer: "Ethereum (ETH) is a decentralized blockchain network famous for introducing smart contracts—self-executing agreements with terms written directly in code. It serves as the foundation for decentralized finance (DeFi) and dApps."
    },
    {
      keys: ['crypto', 'cryptocurrency', 'cryptocurrencies'],
      answer: "A cryptocurrency is a digital or virtual currency secured by cryptography, making it highly secure and resistant to counterfeiting. They operate on decentralized ledger networks called blockchains."
    },
    {
      keys: ['blockchain', 'decentralized ledger'],
      answer: "A blockchain is a secure, decentralized digital ledger that records transactions across a network of computers. Because transactions are grouped in chronological blocks and linked cryptographically, the data cannot be altered retroactively."
    },
    {
      keys: ['nifty', 'sensex', 'index', 'sp 500', 'nasdaq'],
      answer: "A stock index tracks the performance of a specific group of stocks representing a market or sector. For example, Nifty 50 tracks the top 50 Indian companies, Sensex tracks the top 30, and the S&P 500 tracks the top 500 US companies."
    },
    {
      keys: ['bond', 'bonds', 'fixed income', 'treasury'],
      answer: "A bond is a fixed-income instrument representing a loan made by an investor to a borrower (typically corporate or governmental). Bonds pay periodic interest (coupon) and return the principal amount at maturity."
    },
    {
      keys: ['trading', 'investing', 'trader', 'investor'],
      answer: "Investing focuses on building wealth gradually over a long period by buying and holding assets. Trading involves buying and selling assets frequently (intraday or swing) to profit from short-term price movements. Trading carries significantly higher risk."
    },
    {
      keys: ['stock market', 'share market', 'stock', 'share', 'equity', 'equities'],
      answer: "The stock market is a platform where shares of public companies are traded. Buying stocks means owning a small piece of a company, letting you participate in its growth and earnings."
    }
  ];

  for (const item of financeQA) {
    const matched = item.keys.some(key => message.includes(key));
    if (matched) {
      return {
        answer: item.answer,
        action: "none",
        disclaimer: "This is for informational purposes only. Please consult a registered financial advisor."
      };
    }
  }

  // 8. General Fallback
  return {
    answer: "I am Stockdox AI, your dedicated financial assistant. I can explain stock market concepts, cryptocurrency details, portfolio strategies, and live price checks. Please ask me any finance-related question!",
    action: "none",
    disclaimer: "This is for informational purposes only. Please consult a registered financial advisor."
  };
}
