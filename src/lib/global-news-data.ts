
import type { NewsArticle } from '@/types';

export const globalNewsData: NewsArticle[] = [
  // US Stock Market News (Examples)
  {
    id: 'us-stock-001',
    title: 'Dow Jones Hits New High as Tech Stocks Surge',
    source: 'Wall Street Journal',
    publishedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    url: 'https://example.com/news/us-stock-001',
    summary: 'The Dow Jones Industrial Average closed at a record high, driven by strong performance in the technology sector. Companies like Apple and Microsoft led the gains.'
  },
  {
    id: 'us-stock-002',
    title: 'NASDAQ Composite Rallies on Positive Inflation Data',
    source: 'Bloomberg',
    publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    url: 'https://example.com/news/us-stock-002',
    summary: 'The NASDAQ saw a significant rally after new inflation data suggested a potential easing of price pressures, boosting investor confidence in growth stocks.'
  },
  {
    id: 'us-stock-003',
    title: 'S&P 500 Companies Report Strong Q2 Earnings',
    source: 'Reuters',
    publishedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    url: 'https://example.com/news/us-stock-003',
    summary: 'A majority of S&P 500 companies have reported second-quarter earnings that exceeded analyst expectations, particularly in the energy and healthcare sectors.'
  },
  {
    id: 'us-stock-004',
    title: 'Federal Reserve Chair Signals Steady Interest Rates',
    source: 'Financial Times',
    publishedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    url: 'https://example.com/news/us-stock-004',
    summary: 'In a recent address, the Federal Reserve Chair indicated that interest rates are likely to remain steady for the near future, calming market jitters.'
  },
  {
    id: 'us-stock-005',
    title: 'Retail Sales Data Exceeds Expectations, Boosting Consumer Stocks',
    source: 'MarketWatch',
    publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    url: 'https://example.com/news/us-stock-005',
    summary: 'Recent retail sales figures were stronger than anticipated, leading to a positive sentiment around consumer discretionary stocks like Amazon and Target.'
  },
  {
    id: 'us-stock-006',
    title: 'Impact of Global Supply Chain Issues on US Manufacturing Stocks',
    source: 'Industry Week',
    publishedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    url: 'https://example.com/news/us-stock-006',
    summary: 'US manufacturing stocks are navigating ongoing global supply chain disruptions, with varied impacts across different sub-sectors.'
  },
  {
    id: 'us-stock-007',
    title: 'Emerging Trends in the US Renewable Energy Stock Sector',
    source: 'CleanTechnica',
    publishedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    url: 'https://example.com/news/us-stock-007',
    summary: 'The US renewable energy sector is seeing increased investment and innovation, with solar and wind power stocks showing long-term potential.'
  },
  {
    id: 'us-stock-008',
    title: 'Analysis: The Future of Work and its Effect on Commercial Real Estate Stocks',
    source: 'National Real Estate Investor',
    publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    url: 'https://example.com/news/us-stock-008',
    summary: 'The shift towards remote and hybrid work models continues to influence the performance of commercial real estate investment trusts (REITs) and related stocks.'
  },
  {
    id: 'us-stock-009',
    title: 'US Banks Prepare for New Capital Requirement Rules',
    source: 'American Banker',
    publishedAt: new Date(Date.now() - 3600000 * 9).toISOString(),
    url: 'https://example.com/news/us-stock-009',
    summary: 'Major US financial institutions are adjusting their strategies in anticipation of new capital requirement regulations, potentially affecting bank stock valuations.'
  },
  {
    id: 'us-stock-010',
    title: 'Semiconductor Stocks: Navigating Demand and Geopolitical Factors',
    source: 'Semiconductor Engineering',
    publishedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    url: 'https://example.com/news/us-stock-010',
    summary: 'The semiconductor industry faces a complex environment of high demand, ongoing innovation in AI chips, and geopolitical tensions impacting supply chains.'
  },

  // Cryptocurrency News (Examples)
  {
    id: 'crypto-001',
    title: 'Bitcoin Hovers Around $65,000 Amidst Market Consolidation',
    source: 'CoinDesk',
    publishedAt: new Date(Date.now() - 3600000 * 1.2).toISOString(),
    url: 'https://example.com/news/crypto-001',
    summary: 'Bitcoin\'s price is currently consolidating around the $65,000 mark as traders await further market catalysts. Ethereum follows a similar pattern.'
  },
  {
    id: 'crypto-002',
    title: 'Ethereum Layer 2 Solutions See Record Transaction Volumes',
    source: 'The Block',
    publishedAt: new Date(Date.now() - 3600000 * 2.2).toISOString(),
    url: 'https://example.com/news/crypto-002',
    summary: 'Layer 2 scaling solutions for Ethereum, such as Arbitrum and Optimism, are experiencing unprecedented transaction volumes as users seek lower fees.'
  },
  {
    id: 'crypto-003',
    title: 'Regulatory Discussions Heat Up: US Agencies Focus on Crypto',
    source: 'CoinTelegraph',
    publishedAt: new Date(Date.now() - 3600000 * 3.2).toISOString(),
    url: 'https://example.com/news/crypto-003',
    summary: 'US regulatory bodies, including the SEC and CFTC, are intensifying discussions on establishing a clearer framework for cryptocurrency oversight.'
  },
  {
    id: 'crypto-004',
    title: 'DeFi Sector Rebounds: Total Value Locked (TVL) Increases',
    source: 'DeFi Pulse',
    publishedAt: new Date(Date.now() - 3600000 * 4.2).toISOString(),
    url: 'https://example.com/news/crypto-004',
    summary: 'The Decentralized Finance (DeFi) sector has shown signs of a rebound, with the total value locked in DeFi protocols increasing over the past month.'
  },
  {
    id: 'crypto-005',
    title: 'NFT Market Trends: Focus Shifts to Utility and Gaming Integration',
    source: 'NFT Evening',
    publishedAt: new Date(Date.now() - 3600000 * 5.2).toISOString(),
    url: 'https://example.com/news/crypto-005',
    summary: 'The NFT market is evolving, with a growing emphasis on utility-based NFTs and integration within the gaming industry, moving beyond collectibles.'
  },
  {
    id: 'crypto-006',
    title: 'Solana Ecosystem Fund Announces New Grants for Developers',
    source: 'Solana News',
    publishedAt: new Date(Date.now() - 3600000 * 6.2).toISOString(),
    url: 'https://example.com/news/crypto-006',
    summary: 'The Solana Foundation has announced a new round of grants aimed at fostering development and innovation within its growing ecosystem.'
  },
  {
    id: 'crypto-007',
    title: 'The Rise of Real-World Asset (RWA) Tokenization on Blockchain',
    source: 'CryptoSlate',
    publishedAt: new Date(Date.now() - 3600000 * 7.2).toISOString(),
    url: 'https://example.com/news/crypto-007',
    summary: 'Tokenizing real-world assets like real estate and bonds on blockchain platforms is gaining traction, promising increased liquidity and accessibility.'
  },
  {
    id: 'crypto-008',
    title: 'US Lawmakers Debate Stablecoin Regulation Bill',
    source: 'Politico Crypto',
    publishedAt: new Date(Date.now() - 3600000 * 8.2).toISOString(),
    url: 'https://example.com/news/crypto-008',
    summary: 'A bipartisan group of US lawmakers is currently debating a new bill aimed at providing a comprehensive regulatory framework for stablecoins.'
  },
  {
    id: 'crypto-009',
    title: 'Institutional Adoption of Bitcoin ETFs Continues to Grow',
    source: 'Bloomberg Crypto',
    publishedAt: new Date(Date.now() - 3600000 * 9.2).toISOString(),
    url: 'https://example.com/news/crypto-009',
    summary: 'Spot Bitcoin ETFs in the US are seeing sustained inflows, indicating growing institutional adoption of cryptocurrency investment vehicles.'
  },
  {
    id: 'crypto-010',
    title: 'Web3 Gaming: Next Frontier for Blockchain Technology?',
    source: 'Decrypt',
    publishedAt: new Date(Date.now() - 3600000 * 10.2).toISOString(),
    url: 'https://example.com/news/crypto-010',
    summary: 'Web3 gaming, which incorporates NFTs and crypto tokens, is being touted as a major growth area for blockchain technology, attracting significant venture capital.'
  },
  {
    id: 'crypto-011',
    title: 'Cardano Development Update: New Features for Voltaire Era',
    source: 'Cardano Feed',
    publishedAt: new Date(Date.now() - 3600000 * 11.2).toISOString(),
    url: 'https://example.com/news/crypto-011',
    summary: 'The Cardano development team has released updates on upcoming features for its Voltaire era, focusing on governance and community participation.'
  }
];
