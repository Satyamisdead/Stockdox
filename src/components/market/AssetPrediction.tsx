
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Loader2, AlertTriangle, TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import { getAssetPrediction, type GetAssetPredictionInput, type GetAssetPredictionOutput } from '@/ai/flows/get-asset-prediction-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Asset } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ScrollArea } from '../ui/scroll-area';

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
    const [showCard, setShowCard] = useState(false);
    const [loadingText, setLoadingText] = useState(loadingTexts[0]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLoading && !prediction) {
            let i = 0;
            interval = setInterval(() => {
                i = (i + 1) % loadingTexts.length;
                setLoadingText(loadingTexts[i]);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isLoading, prediction]);

    const handleGetPrediction = async () => {
        setIsLoading(true);
        setError(null);
        setPrediction(null);
        setShowCard(true);
        
        try {
            const input: GetAssetPredictionInput = {
                assetName: asset.name,
                assetSymbol: asset.symbol,
                assetType: asset.type,
            };
            const result = await getAssetPrediction(input);
            
            // Simulate additional processing time for dramatic effect
            setTimeout(() => {
                setPrediction(result);
                setIsLoading(false);
            }, 1500);

        } catch (e) {
            console.error("Failed to get AI prediction:", e);
            setError("An unexpected error occurred while generating the prediction. Please try again.");
            setIsLoading(false);
        }
    };
    
    const handleClose = () => {
        setShowCard(false);
        setPrediction(null);
        setError(null);
        setIsLoading(false);
    }

    return (
        <div className="mt-8">
            {!showCard && (
                 <div className="flex justify-center">
                    <Button onClick={handleGetPrediction} disabled={isLoading}>
                        <Bot className="mr-2 h-4 w-4" />
                        Get Stockdox AI Prediction
                    </Button>
                </div>
            )}
            
            {showCard && (
                <div className="relative">
                    {isLoading && !prediction && (
                        <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
                            <div className="absolute top-0 h-[2px] w-full bg-primary/50 animate-scan-line" />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center w-full">
                               <p className="text-sm font-medium text-primary animate-pulse">{loadingText}</p>
                            </div>
                        </div>
                    )}
                    <Card className="bg-card/80 backdrop-blur-sm shadow-2xl border border-border/50 relative">
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={handleClose}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close prediction</span>
                        </Button>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="h-6 w-6 text-primary" />
                                Stockdox AI Prediction
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="min-h-[150px] flex items-center justify-center">
                           {isLoading && !prediction && !error && (
                                <div className="flex items-center justify-center space-x-2 animate-pulse">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span className="font-medium text-muted-foreground">{loadingText}</span>
                                </div>
                            )}
                            
                            {prediction && !isLoading && (
                                <div className="space-y-3 text-center">
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
                                    <Button onClick={handleGetPrediction} variant="outline" size="sm" className="mt-2">
                                        <Loader2 className="mr-2 h-4 w-4" />
                                        Re-analyze
                                    </Button>
                                </div>
                            )}

                            {error && !isLoading && (
                                <div className="text-center text-red-500 flex flex-col justify-center items-center">
                                    <AlertTriangle className="mx-auto mb-2 h-6 w-6" />
                                    <p className="text-sm font-medium">{error}</p>
                                    <Button onClick={handleGetPrediction} variant="destructive" size="sm" className="mt-3">
                                        Try Again
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
