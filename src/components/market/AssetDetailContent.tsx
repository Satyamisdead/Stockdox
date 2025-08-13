
"use client";

import { useRouter } from "next/navigation";
import type { Asset } from "@/types";
import AssetChart from "@/components/market/AssetChart";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bitcoin, Briefcase, DollarSign } from "lucide-react";
import AssetLiveDataProvider from "./AssetLiveDataProvider";


interface AssetDetailContentProps {
  initialAsset: Asset;
}

export default function AssetDetailContent({ initialAsset }: AssetDetailContentProps) {
  const router = useRouter();

  const FallbackIcon = initialAsset.type === 'stock' ? Briefcase : initialAsset.type === 'crypto' ? Bitcoin : DollarSign;
  let IconComponent;
  if (initialAsset.icon && typeof initialAsset.icon !== 'string') {
    IconComponent = initialAsset.icon;
  } else {
    IconComponent = FallbackIcon;
  }

  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.push('/')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <AssetChart 
            symbol={initialAsset.symbol} 
            assetType={initialAsset.type} 
            exchange={initialAsset.exchange} 
            name={initialAsset.name} 
          />
        </div>
        <div className="space-y-4">
            <AssetLiveDataProvider initialAsset={initialAsset} />
        </div>
      </section>
    </div>
  );
}
