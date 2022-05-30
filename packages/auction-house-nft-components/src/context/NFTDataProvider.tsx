import {
  DataTransformers,
  useNFT,
  useNFTType,
  useNFTMetadataType,
  useNFTMetadata,
} from "@cross-nft-marketplace/auction-house-nft-hooks";

import { NFTDataContext } from "./NFTDataContext";
import type {
  OpenseaNFTDataType,
  ZNFTDataType,
} from "@cross-nft-marketplace/auction-house-nft-hooks/dist/fetcher/AuctionInfoTypes";

export type NFTDataProviderProps = {
  id: string;
  contract?: string;
  useZoraIndexer?: boolean;
  refreshInterval?: number;
  children: React.ReactNode;
  initialData?:
    | {
        nft?: useNFTType["data"];
        metadata?: useNFTMetadataType["metadata"];
      }
    | any;
};

let isZNFT = (p: any): p is ZNFTDataType => p && !!p.zoraNFT;
let isOpensea = (p: any): p is OpenseaNFTDataType => p && !!p.openseaInfo;

export const NFTDataProvider = ({
  id,
  children,
  contract,
  refreshInterval,
  initialData,
  useZoraIndexer = false,
}: NFTDataProviderProps) => {
  const { nft: nftInitial } = initialData || {};
  if (nftInitial?.tokenData && !useZoraIndexer) {
    throw new Error(
      "useZoraIndexer={true} prop on NFTFull/NFTDataProvider/NFTPreview required when using indexer-style initialData"
    );
  }

  const nft = useNFT(contract, id, {
    loadCurrencyInfo: true,
    initialData: nftInitial,
    refreshInterval: refreshInterval,
    useZoraIndexer
  });

  const fetchedMetadata = useNFTMetadata(
    isZNFT(nft.data) ? nft.data?.nft.metadataURI : undefined,
    initialData?.metadata
  );

  const openseaMetadata = isOpensea(nft.data)
    ? {
        loading: !!nft.data,
        metadata: nft.data
          ? DataTransformers.openseaDataToMetadata(nft.data)
          : undefined,
      }
    : undefined;

  let zoraIndexerMetadata =
    nft &&
    nft.data &&
    "zoraIndexerResponse" in nft.data &&//todo remove this check
    (nft as any).data?.zoraIndexerResponse?.metadata?.json;

  const metadata = zoraIndexerMetadata
    ? {
        metadata: zoraIndexerMetadata,
        loading: !!zoraIndexerMetadata,
        error: nft.error ? new Error(nft.error) : undefined,
      }
    : openseaMetadata || fetchedMetadata;

  return (
    <NFTDataContext.Provider value={{ nft, metadata }}>
      {children}
    </NFTDataContext.Provider>
  );
};
