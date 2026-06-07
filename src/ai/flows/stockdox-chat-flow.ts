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

  // 5. Live Price / Chart Requests with Real Live Data & Friendly App Redirection Fallback
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
        answer: `To view the real-time live price, interactive chart, and key metrics of **${stockName} (${tickers[0]})**, please check the **Stockdox main app dashboard**! We built the Stockdox app specifically to help you monitor and track live asset prices in real-time. As a Chatting AI, I can help explain ${stockName}'s business, financial ratios, or general stock market concepts.`,
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
        answer: `To view the real-time live price, 24-hour chart, and historical trends of **${cryptoName}**, please check the **Stockdox main app dashboard**! We built the Stockdox app specifically to help you monitor and track live crypto assets in real-time. As a Chatting AI, I can help explain ${cryptoName}'s tokenomics, blockchain architecture, or general crypto market concepts.`,
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

  // 7. Finance Knowledge Base Matching (75+ Comprehensive topics)
  const financeQA = [
    // --- Ratios & Stock Metrics ---
    {
      keys: ['pe ratio', 'p/e ratio', 'price to earnings'],
      answer: "The Price-to-Earnings (P/E) ratio compares a company's stock price to its earnings per share (EPS). Formula: Stock Price / EPS. A high P/E indicates high growth expectations or overvaluation, while a low P/E suggests undervaluation or problems. It helps value similar stocks."
    },
    {
      keys: ['pb ratio', 'p/b ratio', 'price to book'],
      answer: "The Price-to-Book (P/B) ratio compares a company's stock price to its book value per share. Formula: Stock Price / Book Value. It shows how much investors are paying for the net assets of a company. Frequently used to evaluate banks and asset-heavy businesses."
    },
    {
      keys: ['dividend yield', 'what is dividend yield'],
      answer: "Dividend yield is the financial ratio showing how much a company pays out in dividends each year relative to its stock price. Formula: Annual Dividend Per Share / Stock Price. A high dividend yield is favored by income-seeking investors."
    },
    {
      keys: ['debt to equity', 'debt-to-equity', 'd/e ratio'],
      answer: "The Debt-to-Equity (D/E) ratio measures a company's financial leverage by dividing its total liabilities by its shareholder equity. It shows how much of a company's operations are funded by debt vs. owned capital. High D/E represents higher financial risk."
    },
    {
      keys: ['roe', 'return on equity'],
      answer: "Return on Equity (ROE) measures financial performance calculated by dividing net income by shareholders' equity. It indicates how efficiently a company uses its investors' capital to generate profits. Generally, an ROE of 15% or higher is considered strong."
    },
    {
      keys: ['roce', 'return on capital employed'],
      answer: "Return on Capital Employed (ROCE) is a financial ratio that measures a company's profitability and capital efficiency. Formula: EBIT / Capital Employed. It is particularly useful for comparing capital-intensive companies with high debt, as it includes debt in the denominator."
    },
    {
      keys: ['eps', 'earnings per share'],
      answer: "Earnings Per Share (EPS) is a key metric indicating a company's profitability. Formula: Net Profit / Outstanding Shares. It represents the portion of a company's profit allocated to each individual share, and is the foundation for calculating the P/E ratio."
    },
    {
      keys: ['peg ratio', 'price to earnings to growth'],
      answer: "The PEG ratio (Price/Earnings-to-Growth) is the P/E ratio divided by the growth rate of its earnings. A PEG ratio of 1 indicates fair valuation, below 1 suggests undervaluation, and above 1 suggests overvaluation, factoring in future growth."
    },
    {
      keys: ['ebitda', 'earnings before interest'],
      answer: "EBITDA stands for Earnings Before Interest, Taxes, Depreciation, and Amortization. It serves as a measure of a company's core operational profitability, excluding capital structure, tax jurisdictions, and non-cash write-downs."
    },
    
    // --- Stock Actions & Terms ---
    {
      keys: ['ipo', 'initial public offering'],
      answer: "An Initial Public Offering (IPO) is the process where a private company lists its shares on a public stock exchange for the first time. It allows the founders to raise capital from public investors to fund expansion or enable early investors to exit."
    },
    {
      keys: ['fpo', 'follow on public'],
      answer: "A Follow-on Public Offer (FPO) is the issuance of shares to investors by a company that is already listed on a stock exchange. FPOs are typically used to raise additional capital, reduce debt, or satisfy regulatory requirements."
    },
    {
      keys: ['ofs', 'offer for sale'],
      answer: "An Offer for Sale (OFS) is a simplified mechanism where promoters/major shareholders of a listed company sell their shares to public investors on the exchange. It is commonly used to reduce promoter holding to comply with listing norms."
    },
    {
      keys: ['buyback', 'share repurchase'],
      answer: "A share buyback occurs when a company purchases its own outstanding shares from the open market or directly from shareholders. This reduces the total share count, boosts EPS, and signals management's confidence in the company's value."
    },
    {
      keys: ['stock split', 'split stock'],
      answer: "A stock split increases the number of outstanding shares while reducing the share price proportionally, keeping the market cap unchanged. For example, in a 2-for-1 split, a $100 share becomes two $50 shares. It is done to improve liquidity and affordability."
    },
    {
      keys: ['bonus shares', 'bonus issue'],
      answer: "Bonus shares are additional free shares given to existing shareholders based on their current holding (e.g., 1 bonus share for every 2 shares owned). The share price drops proportionally, keeping market cap the same, funded from company reserves."
    },
    {
      keys: ['insider trading'],
      answer: "Insider trading is the illegal practice of buying or selling a public company's securities based on material, non-public information. Doing so violates fiduciary duty and ruins market integrity, leading to severe penalties and jail."
    },
    {
      keys: ['circuit breaker', 'upper circuit', 'lower circuit'],
      answer: "Circuit breakers are regulatory mechanisms that temporarily halt trading in a stock or index when its price movements breach set percentage limits (e.g., 10%, 15%, or 20%). They help prevent panic selling or unchecked speculative manipulation."
    },
    
    // --- Cryptocurrencies & Web3 ---
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
      keys: ['defi', 'decentralized finance'],
      answer: "Decentralized Finance (DeFi) is a blockchain-based financial system that allows users to trade, borrow, and lend directly with each other via smart contracts, removing traditional banks and intermediaries."
    },
    {
      keys: ['nft', 'nfts', 'non fungible token'],
      answer: "An NFT (Non-Fungible Token) is a unique cryptographic token on a blockchain representing ownership of a specific digital asset, such as artwork, music, collectibles, or virtual real estate."
    },
    {
      keys: ['stablecoin', 'usdt', 'usdc'],
      answer: "A stablecoin is a cryptocurrency whose value is pegged to another asset, typically a fiat currency like the US dollar. Popular stablecoins include USDT and USDC. They provide price stability inside the volatile crypto ecosystem."
    },
    {
      keys: ['altcoin', 'altcoins'],
      answer: "An altcoin (alternative coin) is any cryptocurrency other than Bitcoin. Major examples include Ethereum (ETH), Solana (SOL), and Cardano (ADA). They range from utility tokens to meme coins."
    },
    {
      keys: ['mining', 'proof of work', 'pow'],
      answer: "Crypto mining is the process where computers solve complex mathematical puzzles to validate transactions and secure a blockchain network (Proof of Work). Miners are rewarded with newly minted coins (e.g., Bitcoin)."
    },
    {
      keys: ['staking', 'proof of stake', 'pos'],
      answer: "Staking is the process of locking up cryptocurrencies to support a blockchain network's operations (Proof of Stake) and validate transactions. In return, stakers earn yield/interest, similar to earning interest in a savings account."
    },
    {
      keys: ['gas fee', 'gas fees', 'network fee'],
      answer: "Gas fees are payments made by users to compensate for the computing energy required to process and validate transactions on a blockchain network, most notably Ethereum. Fees fluctuate based on network traffic."
    },
    {
      keys: ['wallet', 'cold wallet', 'hot wallet', 'ledger'],
      answer: "A crypto wallet stores private keys. Hot wallets (e.g., Metamask) are connected to the internet, making them convenient but vulnerable to hacks. Cold wallets (e.g., Ledger hardware) are offline and highly secure from remote hacking."
    },
    {
      keys: ['halving', 'bitcoin halving'],
      answer: "Bitcoin halving is a pre-programmed event that occurs every 210,000 blocks (roughly 4 years) where the reward given to miners is cut in half. This reduces the supply rate of new Bitcoins, creating deflationary pressure."
    },
    
    // --- Portfolio & Investing Strategies ---
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
      keys: ['dca', 'dollar cost averaging', 'sip benefit'],
      answer: "Dollar-Cost Averaging (DCA) is investing a fixed amount regularly. You buy more units when prices are low and fewer when prices are high, lowering your average cost per unit without timing the market."
    },
    {
      keys: ['portfolio', 'asset allocation', 'diversification', 'diversify'],
      answer: "A portfolio is your collection of financial assets (stocks, bonds, crypto, cash). Building a strong portfolio involves 'asset allocation' (dividing assets based on your goals and risk tolerance) and 'diversification' (spreading investments to reduce risk)."
    },
    {
      keys: ['rebalancing', 'rebalance'],
      answer: "Portfolio rebalancing is the process of realigning your asset weights to your original target allocation. If stocks grow too fast, you sell some and buy bonds/gold to maintain your desired risk profile."
    },
    {
      keys: ['value investing'],
      answer: "Value investing is a strategy pioneered by Benjamin Graham and Warren Buffett, where investors buy stocks that appear underpriced or undervalued based on fundamental analysis, holding them for long-term growth."
    },
    {
      keys: ['growth investing'],
      answer: "Growth investing focuses on buying stocks of fast-growing companies that are expected to grow sales and earnings faster than the overall market. These companies usually reinvest earnings instead of paying dividends."
    },
    {
      keys: ['dividend investing'],
      answer: "Dividend investing is a strategy focused on buying shares of stable, cash-rich companies that regularly pay out dividends. This provides a steady stream of passive income and tends to be lower risk."
    },
    {
      keys: ['index fund', 'active fund'],
      answer: "An index fund passively tracks a market index (like S&P 500 or Nifty 50), offering low management fees. An active fund is managed by professionals trying to beat the index, resulting in higher fees but not guaranteeing better returns."
    },

    // --- Macroeconomics & Central Banking ---
    {
      keys: ['inflation', 'purchasing power'],
      answer: "Inflation is the rate at which general prices for goods and services rise, which reduces your purchasing power over time. Investing in inflation-beating assets like equities, mutual funds, or real estate helps protect your wealth."
    },
    {
      keys: ['deflation', 'falling prices'],
      answer: "Deflation is a general decline in prices for goods and services, usually associated with a contraction in the supply of money and credit or decreasing consumer spending. It can lead to recessions."
    },
    {
      keys: ['stagflation'],
      answer: "Stagflation is an economic crisis characterized by slow economic growth, high unemployment, and high inflation simultaneously. It is difficult for central banks to manage since correcting inflation worsens unemployment."
    },
    {
      keys: ['interest rate', 'interest rates', 'fed rate', 'rbi rate'],
      answer: "Interest rates are the cost of borrowing money. Central banks raise rates to control high inflation and lower them to stimulate growth. Higher interest rates increase borrowing costs, which can temporarily cool down stock valuations."
    },
    {
      keys: ['recession', 'economic recession'],
      answer: "A recession is a significant decline in economic activity spread across the economy, lasting more than a few months, traditionally defined as two consecutive quarters of negative GDP growth."
    },
    {
      keys: ['gdp', 'gross domestic product'],
      answer: "GDP (Gross Domestic Product) is the total monetary value of all finished goods and services produced within a country's borders during a specific time period. It acts as a scorecard of a country's economic health."
    },
    {
      keys: ['fiscal policy', 'government spending'],
      answer: "Fiscal policy refers to the use of government spending and tax policies to influence economic conditions, especially macroeconomic conditions like inflation, employment, and economic growth."
    },
    {
      keys: ['quantitative easing', 'qe', 'money printing'],
      answer: "Quantitative Easing (QE) is a monetary policy where a central bank purchases long-term government bonds or other securities from the open market to inject liquidity, lower rates, and stimulate economic activity."
    },

    // --- Personal Finance & Savings ---
    {
      keys: ['emergency fund', 'emergency savings'],
      answer: "An emergency fund is a pool of cash set aside for unexpected crises like medical emergencies or job loss. Keeping 3 to 6 months of living expenses in liquid accounts is recommended."
    },
    {
      keys: ['budgeting', '50 30 20'],
      answer: "Budgeting is creating a plan to spend your money. The popular 50/30/20 rule suggests allocating 50% of income to Needs (rent, bills), 30% to Wants (dining, hobbies), and 20% to Savings and debt repayments."
    },
    {
      keys: ['credit score', 'fico score', 'cibil'],
      answer: "A credit score (e.g., CIBIL or FICO) is a three-digit number representing your creditworthiness, based on payment history and debt levels. Higher scores (750+) make it easier to get low-interest loans."
    },
    {
      keys: ['fixed deposit', 'fd', 'recurring deposit', 'rd'],
      answer: "A Fixed Deposit (FD) is a secure banking instrument offering guaranteed interest rates for a locked-in duration. It carries virtually zero risk but struggles to beat inflation over the long run."
    },
    {
      keys: ['ppf', 'public provident fund'],
      answer: "Public Provident Fund (PPF) is a popular long-term savings-cum-tax-saving scheme backed by the Government of India. It has a lock-in period of 15 years, offering guaranteed risk-free interest and tax exemptions."
    },
    {
      keys: ['elss', 'equity linked savings'],
      answer: "ELSS (Equity Linked Savings Scheme) is a type of mutual fund that invests majorly in equities. It offers tax deductions under Section 80C in India, with a lock-in period of 3 years (the lowest among tax-saving options)."
    },
    {
      keys: ['nps', 'national pension scheme'],
      answer: "The National Pension System (NPS) is a voluntary, long-term retirement savings scheme designed to enable systematic savings. It is regulated by PFRDA and offers tax benefits, investing in a mix of equity, corporate bonds, and government debt."
    },
    {
      keys: ['insurance', 'term insurance', 'health insurance'],
      answer: "Insurance is a risk management tool. Term Insurance provides a payout to your family in case of your untimely death (pure protection). Health Insurance covers your hospitalization bills. It is crucial to have both."
    },
    {
      keys: ['tax', 'taxes', 'capital gains', 'capital gain'],
      answer: "Capital Gains Tax applies to profits made from selling assets (stocks, real estate, crypto). Short-Term Capital Gains (STCG) apply to assets held briefly, while Long-Term Capital Gains (LTCG) enjoy lower tax rates."
    },
    {
      keys: ['p2p lending', 'peer to peer lending'],
      answer: "P2P lending connects borrowers directly with lenders through online platforms, bypassing traditional banks. Lenders earn higher interest rates than savings accounts but assume the risk of borrower defaults."
    },

    // --- Trading & Derivatives ---
    {
      keys: ['options trading', 'futures trading', 'derivatives', 'call option', 'put option', 'f&o'],
      answer: "Derivatives are financial contracts whose value depends on an underlying asset (like a stock or index). Futures obligate traders to buy/sell at a set date, while Options give the right but not the obligation. They are highly leveraged and carry significant risks."
    },
    {
      keys: ['day trading', 'intraday', 'scalping'],
      answer: "Intraday or Day Trading involves buying and selling stocks within the same market session. All positions are closed before the day ends to capitalize on short-term price fluctuations, carrying high risk and requiring constant attention."
    },
    {
      keys: ['short selling', 'shorting', 'sell short'],
      answer: "Short selling is an investment strategy where an investor borrows shares of a stock and sells them immediately, planning to buy them back later at a lower price to return to the lender. They profit if the stock price drops."
    },
    {
      keys: ['risk management', 'stop loss', 'limit risk', 'risk profile'],
      answer: "Risk management in investing includes: 1) Diversifying your assets to avoid concentration risk, 2) Setting Stop-Loss orders to protect capital, and 3) Maintaining a long-term horizon to ride out short-term market fluctuations."
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
      keys: ['rsi', 'relative strength index'],
      answer: "The Relative Strength Index (RSI) is a momentum indicator that measures the speed and change of price movements on a scale from 0 to 100. Traditionally, RSI above 70 indicates an overbought condition, while below 30 indicates an oversold condition."
    },
    {
      keys: ['macd', 'moving average convergence divergence'],
      answer: "MACD is a trend-following momentum indicator that shows the relationship between two moving averages of a stock's price. It consists of the MACD line, signal line, and histogram, helping identify buy/sell signals."
    },
    {
      keys: ['moving average', 'sma', 'ema'],
      answer: "A Moving Average smooths price data to identify trends. Simple Moving Average (SMA) calculates average price over set days. Exponential Moving Average (EMA) gives more weight to recent prices, reacting faster to changes."
    },
    {
      keys: ['arbitrage', 'arbitrage trading'],
      answer: "Arbitrage is buying an asset in one market and simultaneously selling it in another at a higher price, capitalizing on temporary price discrepancies between the markets to secure risk-free profit."
    },

    // --- Core Markets & Assets ---
    {
      keys: ['nifty 50', 'nifty50', 'what is nifty'],
      answer: "The Nifty 50 is the benchmark index of the National Stock Exchange of India (NSE). It tracks the performance of 50 of the largest, most liquid, and financially robust companies listed in India across various sectors."
    },
    {
      keys: ['sensex', 'what is sensex'],
      answer: "The Sensex (Sensitive Index) is the benchmark index of the Bombay Stock Exchange (BSE). It comprises 30 of the largest and most actively traded stocks in India, representing the health of the Indian economy."
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
      keys: ['gold', 'silver', 'precious metals'],
      answer: "Gold is a safe-haven asset and inflation hedge. It does not produce cash flows like dividends, but historical trends show it preserves purchasing power and rises during economic uncertainties."
    },
    {
      keys: ['real estate', 'property investment', 'reit'],
      answer: "Real Estate involves buying land or buildings for rental income and appreciation. REITs (Real Estate Investment Trusts) allow you to buy shares in commercial property portfolios, trading like stocks."
    },
    {
      keys: ['mutual fund', 'mutual funds'],
      answer: "A mutual fund pools money from many investors to purchase a diversified portfolio of stocks, bonds, or other securities. It is managed by professional fund managers, offering individual investors easy diversification and professional oversight."
    },
    {
      keys: ['etf', 'exchange traded fund', 'etfs'],
      answer: "An Exchange-Traded Fund (ETF) is an investment fund traded on stock exchanges, much like individual stocks. ETFs typically track an index (like the S&P 500) and hold a basket of assets, offering diversification with low fees."
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
