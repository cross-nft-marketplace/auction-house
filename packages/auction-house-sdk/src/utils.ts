import invariant from 'tiny-invariant'

/**
 * Returns the proper network name for the specified chainId
 *
 * @param chainId
 */
export function chainIdToNetworkName(chainId: number): string {
  switch (chainId) {
    case 4: {
      return 'rinkeby'
    }
    case 1: {
      return 'mainnet'
    }
  }

  invariant(
    false,
    `chainId ${chainId} not officially supported by the cross-nft-marketplace Auction House`
  )
}
