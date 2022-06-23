import { ReserveAuctionPartialFragment } from '../graph-queries/zora-graph-types';
import { BlockchainNFTDataType, CurrencyLookupType } from './AuctionInfoTypes';
import { addAuctionInformation, auctionDataToPricing } from './TransformFetchResults';

export interface BlockchainResponse {
  token_id: string,
  address: string;
  contract_name: string;
  contract_symbol: string
  owner: string;
  uri: string;
}

export const transformBlockchainResponse = (
  data: BlockchainResponse,
  auctionData?: ReserveAuctionPartialFragment,
  currencyData?: CurrencyLookupType
): BlockchainNFTDataType => {
  return {
    nft: {
      tokenId: data.token_id,
      contract: {
        address: data.address,
        name: data.contract_name,
        image: undefined,
        symbol: data.contract_symbol,
      },
      owner: data.owner,
      creator: undefined,
      metadataURI: data.uri,
    },
    pricing: addAuctionInformation(
      {
        reserve: auctionDataToPricing(auctionData),
      },
      currencyData
    ),
  };
};