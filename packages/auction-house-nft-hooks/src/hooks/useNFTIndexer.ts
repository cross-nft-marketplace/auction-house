import { useContext } from 'react';

import { NFTFetchContext } from '../context/NFTFetchContext';
import { IndexerDataType, NFTDataType } from '../fetcher/AuctionInfoTypes';
import useSWR from 'swr';
import { transformNFTIndexerResponse } from '../fetcher/ZoraIndexerTransformers';
import { onErrorRetry } from '../fetcher/ErrorUtils';
import { getCurrenciesInUse } from '../fetcher/ExtractResultData';
import { addAuctionInformation, auctionDataToPricing } from '../fetcher/TransformFetchResults';

export type useNFTType = {
  currencyLoaded: boolean;
  error?: string;
  data?: NFTDataType;
};

type OptionsType = {
  refreshInterval?: number;
  initialData?: any;
  loadCurrencyInfo?: boolean;
};

/**
 * Fetches on-chain NFT data and pricing for the given NFT id and contract address
 *
 * @param contractAddress address of the contract, if null and tokenID is passed in, a ZNFT is assumed
 * @param tokenId id of NFT to fetch blockchain information for
 * @param options SWR flags and an option to load currency info
 * @returns useNFTType hook results include loading, error, and chainNFT data.
 */
export function useZoraNFTIndexer(
  contractAddress?: string,
  tokenId?: string,
  options: OptionsType = {}
): useNFTType {
  const fetcher = useContext(NFTFetchContext);
  const { refreshInterval, initialData, loadCurrencyInfo = true } = options || {};

  const nftData = useSWR(
    contractAddress && tokenId ? ['loadIndexerNFT', contractAddress, tokenId] : null,
    (_, contractAddress, tokenId) =>
      fetcher.loadZoraNFTIndexerNFTUntransformed(contractAddress, tokenId),
    { dedupingInterval: 0, onErrorRetry }
  );

  const auctionData = useSWR(
    contractAddress && tokenId ? ['loadAuctionForNFT', contractAddress, tokenId] : null,
    (_, contractAddress, tokenId) => fetcher.loadAuctionInfo(contractAddress, tokenId),
    { refreshInterval, onErrorRetry }
  );

  const currencyData = useSWR(
    nftData && nftData.data && loadCurrencyInfo
      ? ['loadCurrencies',
        ...getCurrenciesInUse(addAuctionInformation(
          {
            reserve: auctionDataToPricing(auctionData.data),
          }
        ))]
      : null,
    (_, ...currencies) => fetcher.loadCurrencies(currencies),
    {
      refreshInterval,
      dedupingInterval: 0,
    }
  );

  const data: IndexerDataType | undefined =
    nftData.data !== undefined
      ? transformNFTIndexerResponse(nftData.data, auctionData.data, currencyData.data)
      : initialData;

  return {
    currencyLoaded: !!currencyData.data,
    error: nftData.error?.toString(),
    data,
  };
}