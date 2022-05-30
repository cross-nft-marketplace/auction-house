import { NFTDataType } from "./AuctionInfoTypes";

export function getCurrenciesInUse(nftPricing: NFTDataType['pricing']): string[] {
  const hasReserve = nftPricing.reserve;
  if (hasReserve) {
    const reserveCurrencies = nftPricing.reserve?.auctionCurrencies?.map((currency) => currency.id) || [];
    const auctionCurrencyId = nftPricing.reserve?.reserveAndBuyNowCurrency?.id;
    if (auctionCurrencyId) {
      reserveCurrencies.push(auctionCurrencyId);
    }

    return reserveCurrencies;
  }
  const bids = nftPricing.perpetual?.bids?.map((bid) => bid.pricing.currency.id) || [];
  const ask = nftPricing.perpetual.ask?.pricing.currency.id;
  if (ask) {
    return [...bids, ask];
  }
  return bids;
}
