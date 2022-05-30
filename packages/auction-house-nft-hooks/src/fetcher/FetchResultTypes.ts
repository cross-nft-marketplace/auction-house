import { TokenShortFragment } from '../graph-queries/uniswap-types';
import {
  ReserveAuctionPartialFragment,
} from '../graph-queries/zora-graph-types';
import {
  CurrentReserveBid,
  PastReserveBid,
} from './AuctionInfoTypes';

export type MediaContentType =
  | { uri: string; type: 'uri'; mimeType: string }
  | { text: string; type: 'text'; mimeType: string };

export type FetchGroupTypes = 'id' | 'creator' | 'owner';

export type ZoraFetchQueryType = 'creator' | 'owner' | 'creator' | 'collection';

type MetadataIsh = {
  mimeType: string;
  name: string;
  description: string;

  // Only used for non-zora NFTs
  animation_url?: string;
  image?: string;
};

export type MetadataResultType = {
  metadata: MetadataIsh;
};

export type AuctionResultType = ReserveAuctionPartialFragment;
export type AuctionsResult = AuctionResultType[];


export enum KNOWN_CONTRACTS {
  ZORA = 'zora',
};

type ETHAddress = string;

export type NFTResultType = {
  tokenId: string,
  contract: {
    address: string;
    knownContract?: KNOWN_CONTRACTS;
    name?: string;
    symbol?: string;
    image?: string;
  },
  owner: ETHAddress;
  creator?: ETHAddress;
  metadataURI: string;
};

export type GenericNFTResponseType = {
  metadata: MetadataIsh
}

export type ZoraMedia = {
  metadataHash: string;
  contentURI: string;
  contentHash?: string;
  creatorSharePercentage: number;
  creatorBidShare: string;
  createdAtTimestamp: string;
};

export type ReserveAuctionBidsWithCurrency = Omit<
  ReserveAuctionPartialFragment,
  'previousBids' | 'currentBid' | 'reservePrice' | 'buyNowPrice'
> & {
  previousBids: PastReserveBid[];
  currentBid?: CurrentReserveBid;
};

export type ChainCurrencyType = {
  ethToUsd: string;
  token: TokenShortFragment;
};
