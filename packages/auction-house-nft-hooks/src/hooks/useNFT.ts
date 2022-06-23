import { useContext } from 'react';

import { NFTFetchContext } from '../context/NFTFetchContext';
import { NFTDataType } from '../fetcher/AuctionInfoTypes';
import { useOpenseaNFT } from './useOpenseaNFT';
import { ZORA_MEDIA_CONTRACT_BY_NETWORK } from '../constants/addresses';
import { useZoraNFTIndexer } from './useNFTIndexer';
import { useBlockchainNFT } from './useBlockchainNFT';

export type useNFTType = {
  currencyLoaded: boolean;
  error?: string;
  data?: NFTDataType;
};

type OptionsType = {
  refreshInterval?: number;
  initialData?: any;
  loadCurrencyInfo?: boolean;
  useZoraIndexer?: boolean;//todo remove field.
  fetchStrategy?: NftDataFetchStrategy, 
};

export enum NftDataFetchStrategy {
  ZoraIndexer = 1 << 0,
  Opensea = 1 << 1,
  Blockchain = 1 << 2,

  AllIndexers = ZoraIndexer | Opensea,
  All = AllIndexers | Blockchain,
}

export const DEFAULT_FETCH_STRATEGY = NftDataFetchStrategy.Opensea;

/**
 * Fetches on-chain NFT data and pricing for the given zNFT id
 *
 * @param contractAddress address of the contract, if null and tokenID is passed in, a ZNFT is assumed
 * @param tokenId id of NFT to fetch blockchain information for
 * @param options SWR flags and an option to load currency info
 * @returns useNFTType hook results include loading, error, and chainNFT data.
 */
export function useNFT(
  contractAddress?: string,
  tokenId?: string,
  options: OptionsType = {}
): useNFTType {

  if (options.fetchStrategy == null) {
    options.fetchStrategy = DEFAULT_FETCH_STRATEGY;
  }

  if (options.useZoraIndexer) {
    options.fetchStrategy = options.fetchStrategy | NftDataFetchStrategy.ZoraIndexer;
  }

  const fetcher = useContext(NFTFetchContext);

  const resolvedContractAddress = !contractAddress
    ? ZORA_MEDIA_CONTRACT_BY_NETWORK[fetcher.networkId]
    : contractAddress;

  let hasOpensea = (options.fetchStrategy & NftDataFetchStrategy.Opensea) != 0;
  let hasZora = (options.fetchStrategy & NftDataFetchStrategy.ZoraIndexer) != 0;
  let hasBlockchain = (options.fetchStrategy & NftDataFetchStrategy.Blockchain) != 0;

  const openseaNFT = useOpenseaNFT(
    hasOpensea ? resolvedContractAddress : undefined,
    hasOpensea ? tokenId : undefined,
    options
  );

  const betaIndexerNFT = useZoraNFTIndexer(
    hasZora ? resolvedContractAddress : undefined,
    hasZora ? tokenId : undefined,
    options
  );

  const blockchainNFT = useBlockchainNFT(
    hasBlockchain ? resolvedContractAddress : undefined,
    hasBlockchain ? tokenId : undefined,
    options
  );

  let data: any;
  if (hasOpensea && openseaNFT.data && openseaNFT.data != options.initialData) {
    data = openseaNFT;
  } else if (hasZora && betaIndexerNFT.data && betaIndexerNFT.data != options.initialData) {
    data = betaIndexerNFT;
  } else if (hasBlockchain && blockchainNFT.data && blockchainNFT.data != options.initialData) {
    data = blockchainNFT;
  } else {
    data = openseaNFT;//take any (initial data).
  }

  return {
    currencyLoaded: !!data.currencyLoaded,
    error: data.error,
    data: data.data,
  };
}
