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
import { fetchStockDetails } from '@/services/finnhubService';
import { fetchCryptoDetails } from '@/services/coingeckoService';

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

  // 5. Live Price / Chart Requests with Real Live Data
  if (message.includes('price') || message.includes('chart') || message.includes('live') || message.includes('value') || message.includes('how much is')) {
    // Check for stock tickers
    let tickers: string[] = [];
    let stockName = '';
    
    if (message.includes('apple') || message.includes('aapl')) { tickers = ['AAPL']; stockName = 'Apple'; }
    else if (message.includes('microsoft') || message.includes('msft')) { tickers = ['MSFT']; stockName = 'Microsoft'; }
    else if (message.includes('google') || message.includes('goog')) { tickers = ['GOOGL']; stockName = 'Google'; }
    else if (message.includes('amazon') || message.includes('amzn')) { tickers = ['AMZN']; stockName = 'Amazon'; }
    else if (message.includes('tesla') || message.includes('tsla')) { tickers = ['TSLA']; stockName = 'Tesla'; }
    else if (message.includes('nvidia') || message.includes('nvda')) { tickers = ['NVDA']; stockName = 'NVIDIA'; }
    else if (message.includes('reliance')) { tickers = ['RELIANCE.NS']; stockName = 'Reliance'; }
    else if (message.includes('tcs')) { tickers = ['TCS.NS']; stockName = 'TCS'; }
    else if (message.includes('infy') || message.includes('infosys')) { tickers = ['INFY.NS']; stockName = 'Infosys'; }
    else if (message.includes('meta') || message.includes('facebook')) { tickers = ['META']; stockName = 'Meta'; }
    else if (message.includes('netflix') || message.includes('nflx')) { tickers = ['NFLX']; stockName = 'Netflix'; }
    else if (message.includes('amd')) { tickers = ['AMD']; stockName = 'AMD'; }
    else if (message.includes('intel') || message.includes('intc')) { tickers = ['INTC']; stockName = 'Intel'; }

    if (tickers.length > 0) {
      try {
        const details = await fetchStockDetails(tickers[0]);
        if (details && details.price !== undefined) {
          const price = details.price;
          const change = details.change24h ?? 0;
          const changeSign = change >= 0 ? '+' : '';
          const high = details.dailyHigh !== undefined ? `$${details.dailyHigh.toFixed(2)}` : 'N/A';
          const low = details.dailyLow !== undefined ? `$${details.dailyLow.toFixed(2)}` : 'N/A';
          const mcap = details.marketCap ? `$${(details.marketCap / 1e9).toFixed(2)}B` : 'N/A';
          
          return {
            answer: `The current live price of **${details.name || stockName} (${tickers[0]})** is **$${price.toFixed(2)}** (${changeSign}${change.toFixed(2)}% today).\n\n• **Daily Range:** ${low} - ${high}\n• **Market Cap:** ${mcap}\n• **Exchange:** ${details.exchange || 'N/A'}`,
            action: "fetch_price",
            data: { tickers },
            disclaimer: "This is for informational purposes only. Please consult a registered financial advisor."
          };
        }
      } catch (e) {
        console.error("Failed to fetch live stock price in chat:", e);
      }
      return {
        answer: `Sure! Let me fetch the latest live price and chart for ${tickers[0]} for you.`,
        action: "fetch_price",
        data: { tickers },
        disclaimer: "This is for informational purposes only. Please consult a registered financial advisor."
      };
    }

    // Check for crypto ids
    let cryptoIds: string[] = [];
    let cryptoName = '';
    
    if (message.includes('bitcoin') || message.includes('btc')) { cryptoIds = ['bitcoin']; cryptoName = 'Bitcoin'; }
    else if (message.includes('ethereum') || message.includes('eth')) { cryptoIds = ['ethereum']; cryptoName = 'Ethereum'; }
    else if (message.includes('solana') || message.includes('sol')) { cryptoIds = ['solana']; cryptoName = 'Solana'; }
    else if (message.includes('dogecoin') || message.includes('doge')) { cryptoIds = ['dogecoin']; cryptoName = 'Dogecoin'; }
    else if (message.includes('cardano') || message.includes('ada')) { cryptoIds = ['cardano']; cryptoName = 'Cardano'; }
    else if (message.includes('ripple') || message.includes('xrp')) { cryptoIds = ['ripple']; cryptoName = 'Ripple (XRP)'; }
    else if (message.includes('polkadot') || message.includes('dot')) { cryptoIds = ['polkadot']; cryptoName = 'Polkadot'; }
    else if (message.includes('litecoin') || message.includes('ltc')) { cryptoIds = ['litecoin']; cryptoName = 'Litecoin'; }

    if (cryptoIds.length > 0) {
      try {
        const details = await fetchCryptoDetails(cryptoIds[0]);
        if (details && details.price !== undefined) {
          const price = details.price;
          const change = details.change24h ?? 0;
          const changeSign = change >= 0 ? '+' : '';
          const high = details.dailyHigh !== undefined ? `$${details.dailyHigh.toLocaleString()}` : 'N/A';
          const low = details.dailyLow !== undefined ? `$${details.dailyLow.toLocaleString()}` : 'N/A';
          const mcap = details.marketCap ? `$${(details.marketCap / 1e9).toFixed(2)}B` : 'N/A';
          
          return {
            answer: `The current live price of **${details.name || cryptoName}** is **$${price.toLocaleString()}** (${changeSign}${change.toFixed(2)}% today).\n\n• **24h High:** ${high}\n• **24h Low:** ${low}\n• **Market Cap:** ${mcap}`,
            action: "fetch_crypto_price",
            data: { crypto_ids: cryptoIds },
            disclaimer: "This is for informational purposes only. Please consult a registered financial advisor."
          };
        }
      } catch (e) {
        console.error("Failed to fetch live crypto price in chat:", e);
      }
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

  // 7. Finance Knowledge Base Matching (50+ Detailed answers)
  const financeQA = [
    {
      keys: ['sip', 'systematic investment plan', 'recurring investment'],
      answer: "A Systematic Investment Plan (SIP) is a mutual fund investment method where you invest a fixed amount regularly (monthly or quarterly) rather than a lump sum. It helps instil financial discipline and averages out purchase costs over time (Rupee-Cost Averaging)."
    },
    {
      keys: ['lump sum', 'lumpsum', 'one time investment'],
      answer: "A lump-sum investment is a single, bulk purchase of an asset (like stocks, mutual funds, or gold) all at once, as opposed to making regular contributions over time like in a SIP."
    },
    {
      keys: ['compounding', 'compound interest', 'power of compounding'],
      answer: "Compounding is earning returns on your previous returns plus the principal. By reinvesting your profits, your wealth grows exponentially over time. It is often called the eighth wonder of the world by investors."
    },
    {
      keys: ['nifty 50', 'nifty50', 'what is nifty'],
      answer: "The Nifty 50 is the benchmark index of the National Stock Exchange of India (NSE). It tracks the performance of 50 of the largest, most liquid, and financially robust companies listed in India across various sectors."
    },
    {
      keys: ['sensex', 'what is sensex'],
      answer: "The Sensex (Sensitive Index) is the benchmark index of the Bombay Stock Exchange (BSE). It comprises 30 of the largest and most actively traded stocks in India, representing the health of the Indian economy."
    },
    {
      keys: ['short selling', 'shorting', 'sell short'],
      answer: "Short selling is an investment strategy where an investor borrows shares of a stock and sells them immediately, planning to buy them back later at a lower price to return to the lender. They profit if the stock price drops."
    },
    {
      keys: ['bullish', 'bearish'],
      answer: "Bullish means expecting prices to rise and market sentiments to be positive. Bearish means expecting prices to fall and market sentiments to be negative or fearful."
    },
    {
      keys: ['options trading', 'futures trading', 'derivatives', 'call option', 'put option', 'f&o'],
      answer: "Derivatives are financial contracts whose value depends on an underlying asset (like a stock or index). Futures obligate traders to buy/sell at a set date, while Options give the right but not the obligation. They are highly leveraged and carry significant risks."
    },
    {
      keys: ['day trading', 'intraday', 'scalping'],
      answer: "Intraday or Day Trading involves buying and selling stocks within the same market session. All positions are closed before the day ends to capitalize on short-term price fluctuations, carrying high risk and requiring constant attention."
    },
    {
      keys: ['liquidity', 'liquid asset'],
      answer: "Liquidity refers to how quickly and easily an asset can be converted into cash without heavily affecting its price. Cash and large-cap stocks are highly liquid, whereas physical real estate is highly illiquid."
    },
    {
      keys: ['volatility', 'volatile'],
      answer: "Volatility measures the rate and size of price fluctuations of an asset. A highly volatile asset experiences rapid price swings, representing higher risk but also potential trading opportunities."
    },
    {
      keys: ['bull run', 'market rally', 'crypto rally'],
      answer: "A bull run or rally is an extended period during which asset prices rise consistently. It is driven by investor optimism, positive macroeconomic indicators, and high buying volume."
    },
    {
      keys: ['market crash', 'market correction', 'recession', 'bear run', 'dump'],
      answer: "A correction is a price drop of 10% to 20% from recent peaks. A crash is a sudden, steep drop of 20% or more, often due to crises or panic selling. A recession is a broad economic decline lasting months."
    },
    {
      keys: ['blue chip', 'bluechip stocks'],
      answer: "Blue-chip stocks belong to large, well-established, and financially sound corporations with a history of reliable performance, steady growth, and regular dividend payouts (e.g., Apple, Microsoft, Reliance)."
    },
    {
      keys: ['penny stock', 'penny stocks'],
      answer: "Penny stocks are highly speculative shares of tiny companies trading at very low prices (typically under $5 or ₹50). They have low liquidity, high volatility, and are prone to price manipulation and total capital loss."
    },
    {
      keys: ['credit score', 'fico score', 'cibil'],
      answer: "A credit score (e.g., CIBIL or FICO) is a three-digit number representing your creditworthiness, based on payment history and debt levels. Higher scores (750+) make it easier to get low-interest loans."
    },
    {
      keys: ['emergency fund', 'emergency savings'],
      answer: "An emergency fund is a pool of cash set aside for unexpected crises like medical emergencies or job loss. Keeping 3 to 6 months of living expenses in liquid accounts is recommended."
    },
    {
      keys: ['debt vs equity', 'debt or equity'],
      answer: "Equity represents ownership in a business (higher risk, unlimited return potential). Debt is lending money for fixed interest payouts (lower risk, capped return, like bonds or fixed deposits)."
    },
    {
      keys: ['fixed deposit', 'fd', 'savings account'],
      answer: "A Fixed Deposit (FD) is a secure banking instrument offering guaranteed interest rates for a locked-in duration. It carries virtually zero risk but struggles to beat inflation over the long run."
    },
    {
      keys: ['tax', 'taxes', 'capital gains', 'capital gain'],
      answer: "Capital Gains Tax applies to profits made from selling assets (stocks, real estate, crypto). Short-Term Capital Gains (STCG) apply to assets held briefly, while Long-Term Capital Gains (LTCG) enjoy lower tax rates."
    },
    {
      keys: ['p2p lending', 'peer to peer lending'],
      answer: "P2P lending connects borrowers directly with lenders through online platforms, bypassing traditional banks. Lenders earn higher interest rates than savings accounts but assume the risk of borrower defaults."
    },
    {
      keys: ['hedge', 'hedging'],
      answer: "Hedging is a risk reduction strategy where you take an offsetting position in a related asset (like buying gold or put options) to minimize potential losses in your core portfolio."
    },
    {
      keys: ['fundamental analysis', 'financial statements', 'balance sheet'],
      answer: "Fundamental Analysis is evaluating a company's financial health by studying its revenues, earnings, debts, balance sheets, and competitive advantage to calculate its intrinsic value for long-term investing."
    },
    {
      keys: ['technical analysis', 'chart patterns', 'candlestick'],
      answer: "Technical Analysis uses historical price and volume charts to forecast future price movements. It focuses on trends, chart patterns, and indicators (like RSI or MACD) to time short-term trades."
    },
    {
      keys: ['defi', 'decentralized finance'],
      answer: "Decentralized Finance (DeFi) is a blockchain-based financial system that allows users to trade, borrow, and lend directly with each other via smart contracts, removing traditional banks and intermediaries."
    },
    {
      keys: ['nft', 'nfts', 'non fungible token'],
      answer: "An NFT (Non-Fungible Token) is a unique cryptographic token on a blockchain representing ownership of a specific digital asset, such as artwork, music, collectibles, or virtual real estate."
    },
    {
      keys: ['dca', 'dollar cost averaging', 'sip benefit'],
      answer: "Dollar-Cost Averaging (DCA) is investing a fixed amount regularly. You buy more units when prices are low and fewer when prices are high, lowering your average cost per unit without timing the market."
    },
    {
      keys: ['rebalancing', 'rebalance'],
      answer: "Portfolio rebalancing is realigning your asset weights to your original target allocation. If stocks grow too fast, you sell some and buy bonds/gold to maintain your desired risk profile."
    },
    {
      keys: ['gold', 'silver', 'precious metals'],
      answer: "Gold is a safe-haven asset and inflation hedge. It does not produce cash flows like dividends, but historical trends show it preserves purchasing power and rises during economic uncertainties."
    },
    {
      keys: ['real estate', 'property investment', 'reit'],
      answer: "Real Estate involves buying land or buildings for rental income and appreciation. REITs (Real Estate Investment Trusts) allow you to buy shares in commercial property portfolios, trading like stocks."
    },
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
