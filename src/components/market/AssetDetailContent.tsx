
"use client";

import { useRouter } from "next/navigation";
import type { Asset } from "@/types";
import AssetChart from "@/components/market/AssetChart";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AssetLiveDataProvider from "./AssetLiveDataProvider";
import AssetPrediction from "./AssetPrediction";


interface AssetDetailContentProps {
  initialAsset: Asset;
}

export default function AssetDetailContent({ initialAsset }: AssetDetailContentProps) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.push('/')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="relative">
             <AssetChart 
              symbol={initialAsset.symbol} 
              assetType={initialAsset.type} 
              exchange={initialAsset.exchange} 
              name={initialAsset.name} 
            />
          </div>
          <AssetPrediction asset={initialAsset} />
        </div>
        <div className="space-y-4">
            <AssetLiveDataProvider initialAsset={initialAsset} />
        </div>
      </section>
    </div>
  );
}
