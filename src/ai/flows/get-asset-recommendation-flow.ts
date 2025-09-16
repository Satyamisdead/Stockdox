
'use server';
/**
 * @fileOverview A Genkit flow for generating a personalized trading recommendation.
 *
 * This flow calculates a Personal Utility Score (PUS) based on a user's risk profile,
 * their specific goals for an asset, and live market signals.
 *
 * - getAssetRecommendation - A function that handles the recommendation process.
 * - GetAssetRecommendationInput - The input type for the function.
 * - GetAssetRecommendationOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// 1. Define Input & Output Schemas based on the plan

const UserProfileSchema = z.object({
  riskMode: z.enum(['cautious', 'balanced', 'aggressive']).default('balanced'),
  defaultHorizon: z.enum(['intraday', 'swing', 'position']).default('swing'),
  maxDailyLossPct: z.number().optional(),
});

const UserGoalSchema = z.object({
  symbol: z.string(),
  targets: z.array(z.number()).optional().describe('User-defined price targets for selling.'),
  buyZones: z.array(z.object({ type: z.string(), price: z.number() })).optional().describe('User-defined price zones for buying.'),
  trailingStopPct: z.number().optional(),
  hardStopPct: z.number().optional(),
  horizon: z.enum(['intraday', 'swing', 'position']).optional(),
  riskModeOverride: z.enum(['cautious', 'balanced', 'aggressive']).optional(),
});

// A simplified live signal for the model to use.
const LiveSignalSchema = z.object({
    modelEdge: z.number().min(-1).max(1).describe('The raw signal strength from the core model (-1 for strong sell, 1 for strong buy).'),
    liquidityScore: z.number().min(0).max(1).describe('A score representing market liquidity (0 for illiquid, 1 for highly liquid).'),
    currentPrice: z.number(),
});


export const GetAssetRecommendationInputSchema = z.object({
  userProfile: UserProfileSchema,
  userGoal: UserGoalSchema,
  liveSignal: LiveSignalSchema,
});
export type GetAssetRecommendationInput = z.infer<typeof GetAssetRecommendationInputSchema>;


const RecommendationRationaleSchema = z.object({
    pus: z.number().describe('The final Personal Utility Score.'),
    decision: z.enum(['Buy', 'Hold', 'Sell']),
    confidence: z.number().min(0).max(100).describe('The confidence level of the decision, from 0 to 100.'),
    reasons: z.array(z.string()).describe('A list of 3 key reasons supporting the decision.'),
    invalidationCondition: z.string().describe('A clear condition that would invalidate this recommendation.'),
});
export type GetAssetRecommendationOutput = z.infer<typeof RecommendationRationaleSchema>;


// The main exported function that calls the Genkit flow
export async function getAssetRecommendation(input: GetAssetRecommendationInput): Promise<GetAssetRecommendationOutput> {
  return getAssetRecommendationFlow(input);
}


// 2. Define the PUS Calculation Logic within the Flow

const getAssetRecommendationFlow = ai.defineFlow(
  {
    name: 'getAssetRecommendationFlow',
    inputSchema: GetAssetRecommendationInputSchema,
    outputSchema: RecommendationRationaleSchema,
  },
  async (input) => {
    // Determine the effective risk and horizon
    const riskMode = input.userGoal.riskModeOverride || input.userProfile.riskMode;
    const horizon = input.userGoal.horizon || input.userProfile.defaultHorizon;

    // PUS Component Weights based on risk mode
    const weights = {
        cautious:   { modelEdge: 0.25, goalAlignment: 0.35, riskFit: 0.25, liquidity: 0.10, timingFit: 0.05 },
        balanced:   { modelEdge: 0.35, goalAlignment: 0.30, riskFit: 0.20, liquidity: 0.10, timingFit: 0.05 },
        aggressive: { modelEdge: 0.45, goalAlignment: 0.25, riskFit: 0.15, liquidity: 0.10, timingFit: 0.05 },
    };
    const w = weights[riskMode];

    // --- PUS Component Calculations ---

    // a. ModelEdge: Directly from live signal
    const modelEdge = input.liveSignal.modelEdge;

    // b. GoalAlignment: How close is the current price to user's targets/stops?
    let goalAlignment = 0; // Neutral default
    if (input.userGoal.targets && input.userGoal.targets.length > 0) {
        const closestTarget = Math.min(...input.userGoal.targets);
        // Score is higher as price approaches target
        goalAlignment = Math.max(0, 1 - Math.abs(closestTarget - input.liveSignal.currentPrice) / (closestTarget * 0.1));
    }
    if (input.userGoal.buyZones && input.userGoal.buyZones.length > 0) {
        const closestBuyZone = Math.max(...input.userGoal.buyZones.map(z => z.price));
         // Score is higher as price approaches buy zone from above
        if (input.liveSignal.currentPrice > closestBuyZone) {
            goalAlignment = Math.max(goalAlignment, 1 - (input.liveSignal.currentPrice - closestBuyZone) / (closestBuyZone * 0.1));
        }
    }
    goalAlignment = Math.max(-1, Math.min(1, goalAlignment));

    // c. RiskFit: Simple filter for now. Aggressive allows higher risk, Cautious lower.
    // This is a simplified proxy. A real version would use volatility, beta etc.
    const riskFit = modelEdge; // For now, let's assume high edge = high risk

    // d. Liquidity: Directly from live signal
    const liquidity = input.liveSignal.liquidityScore;

    // e. TimingFit: Placeholder. Real implementation would need signal timeframe.
    const timingFit = 0.5; // Neutral

    // --- Final PUS Calculation ---
    const pus =
        w.modelEdge * modelEdge +
        w.goalAlignment * goalAlignment +
        w.riskFit * riskFit +
        w.liquidity * liquidity +
        w.timingFit * timingFit;

    const finalPus = Math.max(0, Math.min(1, (pus + 1) / 2)); // Normalize to 0-1 scale

    // --- Decision Logic ---
    let decision: 'Buy' | 'Hold' | 'Sell';
    if (finalPus > 0.6) {
        decision = 'Buy';
    } else if (finalPus < 0.4) {
        decision = 'Sell';
    } else {
        decision = 'Hold';
    }
    
    // Confidence is a function of PUS deviation from the neutral 0.5
    const confidence = Math.round((Math.abs(finalPus - 0.5) * 2) * 90 + 10); // Scale 10-100%

    // 3. Generate Rationale using a Genkit Prompt
    const rationalePrompt = ai.definePrompt({
        name: 'recommendationRationalePrompt',
        input: { schema: z.object({
            symbol: z.string(),
            decision: z.string(),
            pus: z.number(),
            confidence: z.number(),
            riskMode: z.string(),
            currentPrice: z.number(),
            modelEdge: z.number(),
            goalAlignment: z.number(),
        })},
        output: { schema: z.object({
            reasons: z.array(z.string()),
            invalidationCondition: z.string(),
        })},
        prompt: `You are a financial analyst AI. Generate a concise, 3-point rationale and an invalidation condition for a trading decision.
        The decision is for {{symbol}}.
        
        Decision Details:
        - Action: {{decision}}
        - Confidence: {{confidence}}%
        - Personal Utility Score (PUS): {{pus}}
        - User Risk Profile: {{riskMode}}
        - Current Price: {{currentPrice}}

        Key Factors (scale from -1 to 1):
        - Core Model Signal (modelEdge): {{modelEdge}} (1 is strong buy, -1 is strong sell)
        - Goal Alignment Score: {{goalAlignment}} (1 is perfectly aligned, -1 is misaligned)
        
        Instructions:
        1.  Create a list of exactly 3 short, distinct reasons for the decision. Base them on the provided data.
        2.  Phrase reasons professionally (e.g., "Core model shows bullish sentiment", "Price approaching user-defined target").
        3.  Create a single, clear invalidation condition (e.g., "Invalidated if price breaks below 115.2k on high volume").
        `,
    });
    
    const { output: rationaleOutput } = await rationalePrompt({
        symbol: input.userGoal.symbol,
        decision,
        pus: finalPus,
        confidence,
        riskMode,
        currentPrice: input.liveSignal.currentPrice,
        modelEdge,
        goalAlignment
    });

    return {
      pus: finalPus,
      decision,
      confidence,
      reasons: rationaleOutput?.reasons ?? ["Analysis based on quantitative factors.", "User profile and goals considered.", "Market conditions evaluated."],
      invalidationCondition: rationaleOutput?.invalidationCondition ?? `Consult chart for reversal patterns.`,
    };
  }
);
