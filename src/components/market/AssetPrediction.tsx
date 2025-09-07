
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Loader2, AlertTriangle, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { getAssetPrediction, type GetAssetPredictionInput, type GetAssetPredictionOutput } from '@/ai/flows/get-asset-prediction-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Asset } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AssetPredictionProps {
    asset: Asset;
}

const loadingTexts = [
    "Scanning market data...",
    "Analyzing historical trends...",
    "Reviewing company records...",
    "Correlating news sentiment...",
    "Compiling analysis...",
    "Finalizing prediction..."
];

const FULL_DISCLAIMER = `StockDox provides AI-generated insights, including indications such as “buy,” “sell,” or “hold” for stocks and cryptocurrencies. These outputs are for informational and educational purposes only and do not constitute financial, investment, trading, or legal advice. StockDox, its owners, partners, and affiliates make no guarantees as to the accuracy, reliability, or completeness of any predictions or data provided.

You are solely responsible for your own investment decisions. By using StockDox, you acknowledge and agree that all trading and investment activity involves risk, and StockDox shall not be held liable for any financial losses, damages, or consequences arising directly or indirectly from your reliance on our services.

Always conduct your own research and, if necessary, consult with a licensed financial advisor before making investment decisions.`;

const PredictionIcon = ({ prediction, className }: { prediction: GetAssetPredictionOutput['prediction'], className?: string }) => {
    switch (prediction) {
        case 'Buy': return <TrendingUp className={cn("h-5 w-5 text-green-500", className)} />;
        case 'Sell': return <TrendingDown className={cn("h-5 w-5 text-red-500", className)} />;
        default: return null;
    }
}

export default function AssetPrediction({ asset }: AssetPredictionProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [prediction, setPrediction] = useState<GetAssetPredictionOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingText, setLoadingText] = useState(loadingTexts[0]);
    const { toast } = useToast();

    const REFRESH_INTERVAL_SECONDS = 15;
    const [countdown, setCountdown] = useState(REFRESH_INTERVAL_SECONDS);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);


    const handleGetPrediction = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const input: GetAssetPredictionInput = {
                assetName: asset.name,
                assetSymbol: asset.symbol,
                assetType: asset.type,
                timestamp: new Date().toISOString(),
            };
            const result = await getAssetPrediction(input);
            setPrediction(result);
            const now = new Date();
            setLastUpdated(now);
            
            toast({
                title: (
                    <div className="flex items-center gap-2 font-bold">
                        <PredictionIcon prediction={result.prediction} className="h-6 w-6"/>
                        <span>AI Prediction for {asset.symbol.toUpperCase()}: {result.prediction}</span>
                    </div>
                ),
                description: `Analysis as of ${format(now, "h:mm:ss a")}. This is an AI-generated insight. Always do your own research.`,
                duration: 6000,
                variant: result.prediction === 'Sell' ? 'destructive' : 'default',
            });

        } catch (e) {
            console.error("Failed to get AI prediction:", e);
            setError("An unexpected error occurred while generating the prediction. Please try again.");
        } finally {
            setIsLoading(false);
            setCountdown(REFRESH_INTERVAL_SECONDS);
        }
    }, [asset.name, asset.symbol, asset.type, toast]);
    
    // Initial fetch
    useEffect(() => {
        handleGetPrediction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [asset.id]);

    // Countdown timer effect
    useEffect(() => {
        if (isLoading || error) return;

        if (countdown <= 0) {
            handleGetPrediction();
            return;
        }

        const timerId = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [countdown, isLoading, error, handleGetPrediction]);

    // Loading text animation effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLoading) {
            let i = 0;
            interval = setInterval(() => {
                i = (i + 1) % loadingTexts.length;
                setLoadingText(loadingTexts[i]);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    return (
        <div className="relative mt-8">
             <Card className="bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 relative overflow-hidden">
                 {isLoading && (
                    <div className="absolute inset-0 bg-card/50 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4">
                        <div className="flex items-center justify-center space-x-2 text-foreground mb-4">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="font-medium">{loadingText}</span>
                        </div>
                    </div>
                )}
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-6 w-6 text-primary" />
                        Stockdox AI Prediction
                    </CardTitle>
                </CardHeader>
                <CardContent className="min-h-[150px] flex items-center justify-center">
                    {!isLoading && prediction && (
                        <div className="space-y-3 text-center w-full">
                            <div className="flex items-center justify-center gap-2">
                                <PredictionIcon prediction={prediction.prediction} />
                                <h3 className="text-xl font-bold font-headline text-primary">AI Prediction: {prediction.prediction}</h3>
                            </div>
                            <Alert variant="destructive" className="text-left mt-3">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle className="font-semibold text-destructive">Disclaimer</AlertTitle>
                                <AlertDescription className="text-xs text-destructive/80 line-clamp-3">
                                    {FULL_DISCLAIMER}
                                </AlertDescription>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="link" size="sm" className="text-primary hover:text-primary/80 h-auto p-0 mt-1 text-xs font-bold">Read More</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Disclaimer</AlertDialogTitle>
                                            <AlertDialogDescription asChild>
                                                <ScrollArea className="h-60 pr-4">
                                                    <p className="whitespace-pre-line text-sm">
                                                        {FULL_DISCLAIMER}
                                                    </p>
                                                </ScrollArea>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Close</AlertDialogCancel>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </Alert>
                        </div>
                    )}

                    {!isLoading && error && (
                        <div className="text-center text-red-500 flex flex-col justify-center items-center">
                            <AlertTriangle className="mx-auto mb-2 h-6 w-6" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-between items-center bg-muted/50 py-2 px-4 border-t">
                    {lastUpdated && !isLoading ? (
                        <p className="text-xs text-muted-foreground">
                            Last updated: {format(lastUpdated, "h:mm:ss a")}
                        </p>
                    ) : (
                        <div className="h-4 w-32 bg-muted-foreground/20 rounded-md animate-pulse" />
                    )}
                    <Button onClick={() => handleGetPrediction()} variant="ghost" size="sm" disabled={isLoading} className="gap-2">
                         <RefreshCw className={cn("h-4 w-4", isLoading ? "animate-spin" : "")} />
                         {isLoading ? "Analyzing..." : `Refresh in ${countdown}s`}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
