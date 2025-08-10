
"use client";

import { useEffect, useState }from "react";
import { useParams, notFound } from "next/navigation"; 
import type { Asset } from "@/types";
import { getAssetById } from "@/lib/placeholder-data";
import Loading from "@/app/loading"; 
import AssetDetailContent from "@/components/market/AssetDetailContent";

export default function AssetDetailPage() {
  const params = useParams();
  const assetId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [asset, setAsset] = useState<Asset | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!assetId) {
      setIsLoading(false);
      notFound();
      return;
    }
    
    // Fetch initial static data. This is very fast.
    const initialAsset = getAssetById(assetId);
    if (!initialAsset) {
        setIsLoading(false);
        notFound();
        return;
    }
    setAsset(initialAsset);
    setIsLoading(false);

  }, [assetId]);

  if (isLoading) {
    return <Loading />;
  }
  
  if (!asset) { 
    notFound();
    return null;
  }

  // Pass the initial, non-live asset data to the client component
  // which will then be responsible for fetching and updating live data.
  return <AssetDetailContent initialAsset={asset} />;
}
