"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { BlockscoutNFT } from "@/types/blockscout";

interface Props {
  address: string;
}

function resolveImage(nft: BlockscoutNFT): string | null {
  // Try direct image_url first, then metadata image
  let url = nft.image_url ?? nft.metadata?.image ?? null;
  if (!url) return null;

  // Convert IPFS URLs
  if (url.startsWith("ipfs://")) {
    url = "https://ipfs.io/ipfs/" + url.slice(7);
  }
  return url;
}

function NFTCard({ nft }: { nft: BlockscoutNFT }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = resolveImage(nft);
  const displayName = nft.metadata?.name ?? `#${nft.id}`;
  const collectionName = nft.token.name ?? "Unknown Collection";
  const initial = collectionName.charAt(0).toUpperCase();

  return (
    <div className="rounded-xl border bg-card overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200 group">
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {imageUrl && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <span className="text-3xl font-bold opacity-30">{initial}</span>
            <span className="text-xs opacity-50">🖼</span>
          </div>
        )}
      </div>
      <div className="p-2.5 space-y-0.5">
        <p className="text-xs font-medium truncate" title={displayName}>
          {displayName}
        </p>
        <p className="text-xs text-muted-foreground truncate" title={collectionName}>
          {collectionName}
        </p>
        {nft.value && Number(nft.value) > 1 && (
          <p className="text-xs text-primary">×{nft.value}</p>
        )}
      </div>
    </div>
  );
}

export function NFTGallery({ address }: Props) {
  const [nfts, setNfts] = useState<BlockscoutNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/wallet/${address}/nft`)
      .then((r) => r.json())
      .then((data) => {
        setNfts(data.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [address]);

  // Don't show anything while loading or if wallet has no NFTs
  if (loading) return null;
  if (nfts.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🖼</span>
          <span className="font-semibold text-sm">NFTs</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {nfts.length}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* NFT Grid */}
      {open && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {nfts.map((nft) => (
              <NFTCard key={`${nft.token.address}-${nft.id}`} nft={nft} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
