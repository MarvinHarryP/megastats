import { WhaleFeed } from "./WhaleFeed";
import { fetchWhaleTxs } from "@/lib/whale-fetcher";

export const dynamic = "force-dynamic";

export default async function WhalesPage() {
  const initialTxs = await fetchWhaleTxs(1000);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <WhaleFeed initialTxs={initialTxs} />
    </div>
  );
}
