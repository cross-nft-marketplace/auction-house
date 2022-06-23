import { DEFAULT_FETCH_STRATEGY, NftDataFetchStrategy } from '../hooks/useNFT';
import { ZORA_MEDIA_CONTRACT_BY_NETWORK } from '../constants/addresses';
import { NFTDataType } from './AuctionInfoTypes';
import { FetchGroupTypes } from './FetchResultTypes';
import { MediaFetchAgent } from './MediaFetchAgent';
import { MetadataIsh } from './MetadataTypes';
import { openseaDataToMetadata } from './OpenseaUtils';
import { addAuctionInformation } from './TransformFetchResults';
import { transformNFTIndexerResponse } from './ZoraIndexerTransformers';
import { transformBlockchainResponse } from './BlockchainUtils';

/**
 * This removes undefined values to sanitize
 * data objects to work with nextJS server-side
 * page props.
 *
 * @param json Object to sanitize for JSON fields
 * @returns JSON-safe object
 */
export function prepareJson<T>(json: T): T {
  return JSON.parse(JSON.stringify(json));
}

type fetchNFTDataType = {
  tokenId: string;
  contractAddress?: string;
  fetchAgent: MediaFetchAgent;
  prepareDataJSON?: boolean;
  fetchStrategy?: NftDataFetchStrategy
};

//https://stackoverflow.com/a/37235274
function oneSuccess(promises: Promise<any>[]) {
  return Promise.all(promises.map(p => {
    // If a request fails, count that as a resolution so it will keep
    // waiting for other possible successes. If a request succeeds,
    // treat it as a rejection so Promise.all immediately bails out.
    return p.then(
      val => Promise.reject(val),
      err => Promise.resolve(err)
    );
  })).then(
    // If '.all' resolved, we've just got an array of errors.
    errors => Promise.reject(errors),
    // If '.all' rejected, we've got the result we wanted.
    val => Promise.resolve(val)
  );
}

/**
 * Async function to fetch auction information and metadata for any
 * NFT or zNFT. Mirrors behavior of useNFT hook but for server-side rendering.
 * Fetches all metadata and auction information server-side. Will be re-validated client-side.
 * Can pass return value directly into `initialData` for useNFT hook.
 *
 * @param tokenId: Token ID to fetch
 * @param contractAddress: Contract address to fetch token from
 * @param fetchAgent: MediaFetchAgent instance
 * @param prepareDataJSON: Sanitizes undefined fields to allow data to work with next.js
 * @returns object with nft and metadata fields, any issues throw an RequestError
 */
export const fetchNFTData: (args: fetchNFTDataType) => Promise<{
  nft: NFTDataType;
  metadata: MetadataIsh;
}> = async ({
  tokenId,
  contractAddress,
  fetchAgent,
  prepareDataJSON = true,
  fetchStrategy = DEFAULT_FETCH_STRATEGY,
}: fetchNFTDataType) => {
  let promises: Promise<any>[] = [];

  if (contractAddress == null) {
    contractAddress = ZORA_MEDIA_CONTRACT_BY_NETWORK[fetchAgent.networkId];
  }

  //todo also validate data in response.
  const auctionData = await fetchAgent.loadAuctionInfo(contractAddress, tokenId);

  let hasOpensea = (fetchStrategy & NftDataFetchStrategy.Opensea) != 0;
  let hasZora = (fetchStrategy & NftDataFetchStrategy.ZoraIndexer) != 0;
  let hasBlockchain = (fetchStrategy & NftDataFetchStrategy.Blockchain) != 0;

  if (hasOpensea) {
    promises.push(fetchAgent.loadNFTData(contractAddress, tokenId, auctionData).then(nft => {
      const metadata = openseaDataToMetadata(nft);
      const response = {
        nft,
        metadata,
      };
      return response;
    }))
  }

  if (hasZora) {
    promises.push(fetchAgent.loadZoraNFTIndexerNFTUntransformed(contractAddress, tokenId).then(untransformedNft => { 
      let nft = transformNFTIndexerResponse(untransformedNft, auctionData);
      const response = {
        nft,
        metadata: nft.zoraIndexerResponse.metadata?.json,
      };
      return response;
     }));
  }

  if (hasBlockchain) {
    let promise = new Promise((resolve, reject) => {
      (async () => {
        try {
          let nftUntransformed = await fetchAgent.loadBlockchainNFTDataUntransformed(contractAddress!, tokenId);
          let nft = transformBlockchainResponse(nftUntransformed, auctionData);
          let metadata = await fetchAgent.fetchIPFSMetadata(nft.nft.metadataURI);
          const response = {
            nft,
            metadata,
          };
          resolve(response);
        } catch (error) {
          reject(error);
        }
      })();
    });
    promises.push(promise);
  }

  const response = await oneSuccess(promises);
 
  if (prepareDataJSON) {
    return prepareJson(response);
  }
  return response;
};

type fetchZNFTGroupDataType = {
  ids: string[];
  type: FetchGroupTypes;
  fetchAgent: MediaFetchAgent;
  prepareDataJSON?: boolean;
};

/**
 * Server-side initial data hook for zNFTGroup data hook
 *
 * @param ids list of ids (addresses for creator or owner, znft id for NFT)
 * @param type type of 'id' or 'creator' or 'owner' to determine what type of data to fetch
 * @returns NFTDataType
 */
export const fetchZNFTGroupData = async ({
  ids,
  type,
  fetchAgent,
  prepareDataJSON = true,
}: fetchZNFTGroupDataType) => {
  const nftGroup = await fetchAgent.fetchZNFTGroupData(ids, type);
  const response = nftGroup.map((media) => ({
    ...media,
    pricing: addAuctionInformation(media.pricing),
  }));
  if (prepareDataJSON) {
    return prepareJson(response);
  }
  return response;
};
