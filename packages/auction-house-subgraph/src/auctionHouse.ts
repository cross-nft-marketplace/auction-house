import {
  createReserveAuction,
  createReserveAuctionBid,
  findOrCreateCurrency,
  findOrCreateUser,
  handleBidReplaced,
  handleFinishedAuction,
  handleReserveAuctionExtended,
  setReserveAuctionFirstBidTime,
} from './helpers'
import {
  AuctionHouse,
  AuctionApprovalUpdated_v2,
  AuctionBid_v2,
  AuctionCanceled_v2,
  AuctionCreated_v2,
  AuctionDurationExtended_v2,
  AuctionEnded_v2,
  AuctionReserveAndBuyNowPriceUpdated_v2,
} from '../types/AuctionHouse/AuctionHouse'
import { Currency, Media, ReserveAuction } from '../types/schema'
import { log } from '@graphprotocol/graph-ts'

export function handleReserveAuctionCreated(event: AuctionCreated_v2): void {
  log.info(`Starting handler for AuctionCreated for auction {}`, [
    event.params.auctionId.toString(),
  ])

  let tokenId = event.params.tokenId.toString()
  let tokenOwner = findOrCreateUser(event.params.tokenOwner.toHexString())
  let curator = findOrCreateUser(event.params.curator.toHexString())

  let media = loadMediaFromReserveAuctionCreatedEvent(event)
  createReserveAuction(
    event.params.auctionId.toString(),
    event.transaction.hash.toHexString(),
    event.params.tokenId,
    event.params.tokenContract.toHexString(),
    media,
    event.params.duration,
    event.params.reservePrice,
    findOrCreateCurrency(event.params.reserveAndBuyNowCurrency.toHexString()),
    event.params.curatorFeePercentage,
    event.params.auctionCurrencies.map<Currency>(addr => findOrCreateCurrency(addr.toHexString())),
    event.block.timestamp,
    event.block.number,
    tokenOwner,
    curator,
    event.params.buyNowPrice
  )

  log.info(`Completed handler for AuctionCreated for auction {}`, [
    event.params.auctionId.toString(),
  ])
}

export function handleReserveAuctionApprovalUpdate(event: AuctionApprovalUpdated_v2): void {
  let id = event.params.auctionId.toString()
  log.info(`Starting handler for AuctionApprovalUpdate on auction {}`, [id])

  let auction = ReserveAuction.load(id)

  auction.approved = event.params.approved
  auction.status = 'Active'
  auction.approvedTimestamp = event.block.timestamp
  auction.approvedBlockNumber = event.block.number
  auction.save()

  log.info(`Completed handler for AuctionApprovalUpdate on auction {}`, [id])
}

export function handleReserveAuctionReservePriceUpdate(
  event: AuctionReserveAndBuyNowPriceUpdated_v2
): void {
  let id = event.params.auctionId.toString()
  log.info(`Starting handler for AuctionApprovalUpdate on auction {}`, [id])

  let auction = ReserveAuction.load(id)
  
  auction.reserveAndBuyNowCurrency = findOrCreateCurrency(event.params.reserveAndBuyNowCurrency.toHexString()).id,
  auction.reservePrice = event.params.reservePrice
  auction.buyNowPrice = event.params.buyNowPrice
  auction.save()

  log.info(`Completed handler for AuctionApprovalUpdate on auction {}`, [id])
}

export function handleReserveAuctionBid(event: AuctionBid_v2): void {
  let auctionId = event.params.auctionId.toString()
  log.info(`Starting handler for AuctionBid on auction {}`, [auctionId])

  let auction = ReserveAuction.load(auctionId)

  if (auction === null) {
    log.error('Missing Reserve Auction with id {} for bid', [auctionId])
    return
  }

  if (event.params.firstBid) {
    log.info('setting auction first bid time', [])
    setReserveAuctionFirstBidTime(auction as ReserveAuction, event.block.timestamp)
  } else {
    log.info('replacing bid', [])
    handleBidReplaced(
      auction as ReserveAuction,
      event.block.timestamp,
      event.block.number
    )
  }

  let id = auctionId
    .concat('-')
    .concat(event.transaction.hash.toHexString())
    .concat('-')
    .concat(event.logIndex.toString())

  createReserveAuctionBid(
    id,
    event.transaction.hash.toHexString(),
    auction as ReserveAuction,
    event.params.value,
    findOrCreateCurrency(event.params.currency.toHexString()),
    event.block.timestamp,
    event.block.number,
    findOrCreateUser(event.params.sender.toHexString()),
    event.params.buyNowRequsted,
    event.params.buyNowActual
  )

  log.info(`Completed handler for AuctionBid on auction {}`, [auctionId])
}

export function handleReserveAuctionDurationExtended(
  event: AuctionDurationExtended_v2
): void {
  let auctionId = event.params.auctionId.toString()
  log.info(`Starting handler for AuctionDurationExtended on auction {}`, [auctionId])

  let auction = ReserveAuction.load(auctionId)

  if (auction === null) {
    log.error('Missing Reserve Auction with id {} for bid', [auctionId])
    return
  }

  handleReserveAuctionExtended(auction as ReserveAuction, event.params.duration)

  log.info(`Completed handler for AuctionDurationExtended on auction {}`, [auctionId])
}

export function handleReserveAuctionEnded(event: AuctionEnded_v2): void {
  let auctionId = event.params.auctionId.toString()
  log.info(`Starting handler for AuctionEnd on auction {}`, [auctionId])

  let auction = ReserveAuction.load(auctionId)

  if (!auction) {
    log.error('Missing Reserve Auction with id {} for bid', [auctionId])
    return
  }

  // First, remove the current bid and set it to the winning bid
  handleBidReplaced(
    auction as ReserveAuction,
    event.block.timestamp,
    event.block.number,
    true
  )

  // Then, finalize the auction
  handleFinishedAuction(
    auction as ReserveAuction,
    event.block.timestamp,
    event.block.number
  )

  log.info(`Completed handler for AuctionEnd on auction {}`, [auctionId])
}

export function handleReserveAuctionCanceled(event: AuctionCanceled_v2): void {
  let auctionId = event.params.auctionId.toString()
  log.info(`Starting handler for AuctionCanceled on auction {}`, [auctionId])

  let auction = ReserveAuction.load(auctionId)

  if (!auction) {
    log.error('Missing Reserve Auction with id {} for bid', [auctionId])
  }

  // First, remove any current bid and set it to refunded
  //impossible by contract 
  if (auction.currentBid) {
    handleBidReplaced(
      auction as ReserveAuction,
      event.block.timestamp,
      event.block.number
    )
  }

  // Then, create an inactive auction based of of the current active auction
  // Then, finalize the auction
  handleFinishedAuction(
    auction as ReserveAuction,
    event.block.timestamp,
    event.block.number,
    true
  )

  log.info(`Completed handler for AuctionCanceled on auction {}`, [auctionId])
}

function loadMediaFromReserveAuctionCreatedEvent(event: AuctionCreated_v2): Media | null {
  let tokenId = event.params.tokenId.toString()
  let auctionHouse = AuctionHouse.bind(event.address)
  let zoraMediaAddress = auctionHouse.zora()

  if (event.params.tokenContract.toHexString() == zoraMediaAddress.toHexString()) {
    return Media.load(tokenId)
  }

  return null
}
