import { useContext } from "react";
import useSWR from "swr";
import { NFTFetchContext } from '../context/NFTFetchContext';
import { getCurrenciesInUse } from '../fetcher/ExtractResultData';
import { addAuctionInformation, auctionDataToPricing } from '../fetcher/TransformFetchResults';
import { transformBlockchainResponse } from "../fetcher/BlockchainUtils";
import { BlockchainNFTDataType } from "src/fetcher/AuctionInfoTypes";

export type useBlockchainNFTType = {
    currencyLoaded: boolean;
    error?: string;
    data?: BlockchainNFTDataType;
  };

type OptionsType = {
    refreshInterval?: number;
    initialData?: any;
    loadCurrencyInfo?: boolean;
  };

export function useBlockchainNFT(
    contractAddress?: string,
    tokenId?: string,
    options: OptionsType = {}
): useBlockchainNFTType {
    const fetcher = useContext(NFTFetchContext);
    const { loadCurrencyInfo = false, refreshInterval, initialData } = options || {};

    const nftData = useSWR(
        contractAddress && tokenId ? ['loadBlockchainGenericNFT', contractAddress, tokenId] : null,
        (_, contractAddress, tokenId) =>
          fetcher.loadBlockchainNFTDataUntransformed(contractAddress, tokenId),
        { dedupingInterval: 0 }
      );

    const auctionData = useSWR(
        contractAddress && tokenId ? ['loadAuctionForNFT', contractAddress, tokenId] : null,
        async (_, contractAddress, tokenId) =>
          fetcher.loadAuctionInfo(contractAddress, tokenId)
      );
    
      const nftResponseData = nftData.data as any;
      const currencyData = useSWR(
        nftResponseData && loadCurrencyInfo
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

    const data: BlockchainNFTDataType | undefined =
    nftData.data !== undefined
      ? transformBlockchainResponse(nftData.data, auctionData.data, currencyData.data)
      : initialData;

    return {
        currencyLoaded: !!currencyData.data,
        error: nftData.error,
        data,
    };
}