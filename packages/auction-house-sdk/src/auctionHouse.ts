import { BigNumber, BigNumberish, ethers, Signer } from 'ethers'
import { Provider, TransactionReceipt } from '@ethersproject/providers'
import { AuctionHouse__factory } from '@cross-nft-marketplace/auction-house/dist/typechain'
import rinkebyAddresses from '@cross-nft-marketplace/auction-house/dist/addresses/4.json'
import mainnetAddresses from '@cross-nft-marketplace/auction-house/dist/addresses/1.json'
import { chainIdToNetworkName } from './utils'
import { AuctionHouse as AuctionHouseContract } from '@cross-nft-marketplace/auction-house'

const auctionHouseAddresses: { [key: string]: string } = {
  rinkeby: rinkebyAddresses.auctionHouse,
  mainnet: mainnetAddresses.auctionHouse,
}

export interface Auction {
  approved: boolean
  amount: BigNumber
  duration: BigNumber
  firstBidTime: BigNumber
  reserveAndBuyNowCurrency: string
  reservePrice: BigNumber
  buyNowPrice: BigNumber
  curatorFeePercentage: number
  tokenOwner: string
  bidder: string
  curator: string
  currency: string
}

export class AuctionHouse {
  public readonly chainId: number
  public readonly readOnly: boolean
  public readonly signerOrProvider: Signer | Provider
  public readonly auctionHouse: AuctionHouseContract

  constructor(signerOrProvider: Signer | Provider, chainId: number) {
    this.chainId = chainId
    this.readOnly = !Signer.isSigner(signerOrProvider)
    this.signerOrProvider = signerOrProvider
    const network = chainIdToNetworkName(chainId)
    const address = auctionHouseAddresses[network]
    this.auctionHouse = AuctionHouse__factory.connect(address, signerOrProvider)
  }

  public async fetchAuction(auctionId: BigNumberish): Promise<Auction> {
    return this.auctionHouse.auctions_v2(auctionId)
  }

  public async fetchAuctionFromTransactionReceipt(
    receipt: TransactionReceipt
  ): Promise<Auction | null> {
    for (const log of receipt.logs) {
      const description = this.auctionHouse.interface.parseLog(log)

      if (description.args.auctionId && log.address === this.auctionHouse.address) {
        return this.fetchAuction(description.args.auctionId)
      }
    }

    return null
  }

  public async createAuction(
    tokenId: BigNumberish,
    duration: BigNumberish,
    reserveAndBuyNowCurrency: string,
    reservePrice: BigNumberish,
    buyNowPrice: BigNumberish,
    curator: string,
    curatorFeePercentages: number,
    auctionCurrencies: string[],
    tokenAddress: string
  ) {
    return this.auctionHouse.createAuction_v2(
      tokenId,
      tokenAddress,
      duration,
      reserveAndBuyNowCurrency,
      reservePrice,
      buyNowPrice,
      curator,
      curatorFeePercentages,
      auctionCurrencies
    )
  }

  public async setAuctionApproval(auctionId: BigNumberish, approved: boolean) {
    return this.auctionHouse.setAuctionApproval_v2(auctionId, approved)
  }

  public async setAuctionReserveAndBuyNowPrice(
    auctionId: BigNumberish,
    currency: string,
    reservePrice: BigNumberish,
    buyNowPrice: BigNumberish
  ) {
    return this.auctionHouse.setAuctionReserveAndBuyNowPrice_v2(
      auctionId,
      currency,
      reservePrice,
      buyNowPrice
    )
  }

  /**
   *
   * @param auctionId
   * @param currency
   * @param amount
   * @param buyNow
   * @param slippage Basis points 0..10000
   * @returns
   */
  public async createBid(
    auctionId: BigNumberish,
    currency: string,
    amount: BigNumberish,
    buyNow: boolean,
    slippage: number
  ) {
    if (currency === ethers.constants.AddressZero) {
      const BASIS_POINT_PRECISION = 10_000
      return this.auctionHouse.createBid_v2(auctionId, buyNow, currency, amount, slippage, {
        value: BigNumber.from(amount)
          .mul(BASIS_POINT_PRECISION + slippage)
          .div(BASIS_POINT_PRECISION),
      })
    } else {
      return this.auctionHouse.createBid_v2(auctionId, buyNow, currency, amount, slippage)
    }
  }

  public async endAuction(auctionId: BigNumberish) {
    return this.auctionHouse.endAuction_v2(auctionId)
  }

  public async cancelAuction(auctionId: BigNumberish) {
    return this.auctionHouse.cancelAuction_v2(auctionId)
  }

  public async convertToControlCurrency(
    currency: string,
    amount: BigNumberish
  ): Promise<BigNumber> {
    return this.auctionHouse.convertToControlCurrency_v2(currency, amount)
  }
}
