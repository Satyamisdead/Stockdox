
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Loader2, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getAssetPrediction, type GetAssetPredictionInput, type GetAssetPredictionOutput } from '@/ai/flows/get-asset-prediction-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Asset } from '@/types';
import { cn } from '@/lib/utils';

interface AssetPredictionProps {
    asset: Asset;
}

const PredictionIcon = ({ prediction }: { prediction: GetAssetPredictionOutput['prediction'] }) => {
    switch (prediction) {
        case 'Buy': return <TrendingUp className="h-5 w-5 text-green-500" />;
        case 'Sell': return <TrendingDown className="h-5 w-5 text-red-500" />;
        case 'Hold': return <Minus className="h-5 w-5 text-muted-foreground" />;
        default: return null;
    }
}

export default function AssetPrediction({ asset }: AssetPredictionProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [prediction, setPrediction] = useState<GetAssetPredictionOutput | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGetPrediction = async () => {
        setIsLoading(true);
        setError(null);
        setPrediction(null);
        
        try {
            const input: GetAssetPredictionInput = {
                assetName: asset.name,
                assetSymbol: asset.symbol,
                assetType: asset.type,
            };
            const result = await getAssetPrediction(input);
            setPrediction(result);
        } catch (e) {
            console.error("Failed to get AI prediction:", e);
            setError("An unexpected error occurred while generating the prediction. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
            <div className="bg-card/80 backdrop-blur-sm p-4 rounded-lg shadow-2xl border border-border/50">
                {!prediction && !isLoading && (
                     <Button onClick={handleGetPrediction} disabled={isLoading} className="w-full">
                        <Bot className="mr-2 h-4 w-4" />
                        Get STOCKDOX AI Prediction
                    </Button>
                )}

                {isLoading && (
                    <div className="flex items-center justify-center space-x-2 animate-pulse">
                         <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="font-medium text-muted-foreground">Analyzing market patterns...</span>
                    </div>
                )}
                
                {prediction && !isLoading && (
                    <div className="space-y-3 text-center">
                       <div className="flex items-center justify-center gap-2">
                            <PredictionIcon prediction={prediction.prediction} />
                            <h3 className="text-xl font-bold font-headline text-primary">AI Prediction: {prediction.prediction}</h3>
                       </div>
                        <p className="text-sm text-foreground">{prediction.justification}</p>
                        <Alert variant="destructive" className="text-left mt-3">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="font-semibold text-destructive">Disclaimer</AlertTitle>
                            <AlertDescription className="text-xs text-destructive/80">
                               {prediction.disclaimer}
                            </AlertDescription>
                        </Alert>
                         <Button onClick={handleGetPrediction} variant="outline" size="sm" className="mt-2">
                            <Loader2 className="mr-2 h-4 w-4" />
                            Re-analyze
                        </Button>
                    </div>
                )}

                {error && !isLoading && (
                    <div className="text-center text-red-500">
                        <AlertTriangle className="mx-auto mb-2 h-6 w-6" />
                        <p className="text-sm font-medium">{error}</p>
                         <Button onClick={handleGetPrediction} variant="destructive" size="sm" className="mt-3">
                            Try Again
                        </Button>
                    </div>
                )}

            </div>
             {/* Scanning Animation Overlay */}
            {isLoading && (
                <div className="absolute inset-0 bottom-full overflow-hidden pointer-events-none">
                    <div className="absolute top-0 h-[2px] w-full bg-primary/50 animate-scan-line" />
                </div>
            )}
        </div>
    );
}

// Add keyframes for animation in a global scope if needed, or here if using a CSS-in-JS solution.
// For tailwind.config.ts animation extension:
// keyframes: { 'scan-line': { '0%': { top: '0%' }, '100%': { top: '100%' } } }
// animation: { 'scan-line': 'scan-line 2s ease-in-out infinite' }
// For simplicity, we can use inline styles for the animation definition in a real project's CSS file,
// but here we just set up the class, assuming it will be defined.
// The animation itself will be defined in tailwind.config.ts
