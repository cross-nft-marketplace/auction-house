import type { NFTDataType } from "@cross-nft-marketplace/auction-house-nft-hooks";

export const defaultGetContentData = (nft: NFTDataType, metadata: any) => {
  return {
    contentURI:
      nft && "zoraNFT" in nft && nft.zoraNFT
        ? nft.zoraNFT.contentURI
        : undefined,
    metadata,
  };
};

export type GetContentDataType = {
  getContentData?: (
    nft: NFTDataType,
    metadata: any
  ) => { contentURI?: string; metadata: any };
};