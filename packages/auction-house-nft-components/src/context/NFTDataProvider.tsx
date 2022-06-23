import {
  DataTransformers,
  useNFT,
  useNFTType,
  useNFTMetadataType,
  useNFTMetadata,
} from "@cross-nft-marketplace/auction-house-nft-hooks";

import { NFTDataContext } from "./NFTDataContext";
import type {
  OpenseaNFTDataType
} from "@cross-nft-marketplace/auction-house-nft-hooks/dist/fetcher/AuctionInfoTypes";
import type { NftDataFetchStrategy } from "@cross-nft-marketplace/auction-house-nft-hooks";
import type { IndexerDataType } from "@zoralabs/nft-hooks/dist/fetcher/AuctionInfoTypes";

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
  fetchStrategy?: NftDataFetchStrategy
};

let isOpensea = (p: any): p is OpenseaNFTDataType => p && !!p.openseaInfo;
let isZoraIndexer = (p: any): p is IndexerDataType => p && !!p.zoraIndexerResponse;

export const NFTDataProvider = ({
  id,
  children,
  contract,
  refreshInterval,
  initialData,
  useZoraIndexer = false,
  fetchStrategy
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
    useZoraIndexer,
    fetchStrategy
  });
  
  const openseaMetadata = isOpensea(nft.data)
  ? {
    loading: !!nft.data,
    metadata: nft.data
    ? DataTransformers.openseaDataToMetadata(nft.data)
    : undefined,
  }
  : undefined;
  
  const zoraIndexerMetadata = isZoraIndexer(nft.data) && nft.data.zoraIndexerResponse.metadata?.json;
  
  const needLoadMetadata = !zoraIndexerMetadata && !openseaMetadata && nft.data?.nft.metadataURI;
  
  const fetchedMetadata = useNFTMetadata(
    needLoadMetadata ? nft.data?.nft.metadataURI : undefined,
    initialData?.metadata
  );

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
