import { Fragment, useContext } from "react";

import { useMediaContext } from "../context/useMediaContext";
import { NFTDataContext } from "../context/NFTDataContext";
import { CountdownDisplay } from "../components/CountdownDisplay";
import { PricingString } from "../utils/PricingString";
import { AuctionStateInfo, AuctionType } from "@cross-nft-marketplace/auction-house-nft-hooks";
import { dateFromTimestamp, dateFormat } from "../utils/date";
import type { StyleProps } from "../utils/StyleTypes";

function isInFuture(timestamp: string) {
  const timestampParsed = parseInt(timestamp);
  return timestampParsed > Math.floor(new Date().getTime() / 1000);
}

const dateWithComma = (date: string) => dateFormat(date).replace(' at', ',')

type PricingComponentProps = {
  showPerpetual?: boolean;
} & StyleProps;

export const PricingComponent = ({
  showPerpetual = true,
  className,
}: PricingComponentProps) => {
  const {
    nft: { data },
  } = useContext(NFTDataContext);

  const { getStyles, getString } = useMediaContext();

  const pricing = data?.pricing;

  if (
    pricing &&
    !pricing.reserve &&
    pricing.status === AuctionStateInfo.NO_PRICING
  ) {
    return (
      <div {...getStyles("cardAuctionPricing", className, { type: "unknown" })}>
        <div {...getStyles("textSubdued")}>{getString("RESERVE_PRICE")}</div>
        <div {...getStyles("pricingAmount")}>
          {getString("NO_PRICING_PLACEHOLDER")}
        </div>
        <div {...getStyles("textSubdued")}>{getString("HIGHEST_BID")}</div>
        <div {...getStyles("pricingAmount")}>
          {getString("NO_PRICING_PLACEHOLDER")}
        </div>
      </div>
    );
  }

  if (
    pricing &&
    showPerpetual &&
    (!pricing.reserve || pricing.reserve?.finalizedAtTimestamp) &&
    pricing.auctionType === AuctionType.PERPETUAL
  ) {
    let listPrice = null;

    if (pricing.perpetual.ask?.pricing) {
      const perpetualPricing = pricing.perpetual.ask?.pricing;
      listPrice = (
        <Fragment>
          <span {...getStyles("textSubdued")}>{getString("LIST_PRICE")}</span>
          <PricingString pricing={perpetualPricing} showUSD={false} />
        </Fragment>
      );
    }
    const highestBid = pricing.perpetual.highestBid;
    if (!highestBid && pricing.reserve?.previousBids.length) {
      const highestPreviousBid = pricing.reserve.previousBids[0];
      return (
        <div
          {...getStyles("cardAuctionPricing", className, {
            type: "reserve-pending",
          })}
        >
          <span {...getStyles("textSubdued")}>{getString("SOLD_FOR")}</span>
          <span {...getStyles("pricingAmount")}>
            <PricingString
              pricing={highestPreviousBid.pricing}
              showUSD={false}
            />
          </span>
          {listPrice}
        </div>
      );
    }
    return (
      <div
        {...getStyles("cardAuctionPricing", className, { type: "perpetual" })}
      >
        <span {...getStyles("textSubdued")}>{getString("HIGHEST_BID")}</span>
        <span {...getStyles("pricingAmount")}>
          {highestBid ? (
            <PricingString showUSD={false} pricing={highestBid.pricing} />
          ) : (
            getString("NO_PRICING_PLACEHOLDER")
          )}
        </span>
        {listPrice}
      </div>
    );
  }

  if (pricing && pricing.reserve) {
    if (
      pricing.reserve?.current.reserveMet &&
      !pricing.reserve?.current.likelyHasEnded
    ) {
      const highestBid = pricing.reserve?.current.highestBid;
      const buyNow = pricing.reserve?.buyNowPrice &&
          pricing.reserve?.buyNowPrice?.amount !== "0" &&
          (<div {...getStyles("auctionsBuyNowPrice")}>
              <span {...getStyles("textSubdued")}>{getString("BUY_NOW_PRICE")}</span>
              <span {...getStyles("auctionsBuyNowPriceAmount")}>
                      {highestBid && (
                          <PricingString
                              showUSD={false}
                              pricing={pricing.reserve.buyNowPrice}
                          />
                      )}
                    </span>
          </div>)


      return (
        <div
          {...getStyles("cardAuctionPricing", className, {
            type: "reserve-active",
          })}
        >
          <div {...getStyles("auctionsHighestBidPrice")}>
            <div>
              <span {...getStyles("textSubdued")}>{getString("TOP_BID")}</span>
              <span {...getStyles("pricingAmount")}>
                {highestBid && (
                    <PricingString pricing={highestBid?.pricing} showUSD={false} />
                )}
            </span>
            </div>
            { buyNow }
          </div>
          {pricing.reserve?.expectedEndTimestamp &&
            isInFuture(pricing.reserve.expectedEndTimestamp) && (
              <Fragment>
                <span {...getStyles("textSubdued")}>
                  {getString("ENDS_IN")}
                </span>
                <span {...getStyles("pricingAmount")}>
                  <CountdownDisplay to={pricing.reserve.expectedEndTimestamp} />
                </span>
              </Fragment>
            )}
        </div>
      );
    }

    if (pricing.reserve && pricing.reserve.current.likelyHasEnded) {//todo possible can be Cancelled
      const highestBid =
        pricing.reserve.currentBid || pricing.reserve.previousBids[0];
      return (
        <div
          {...getStyles("cardAuctionPricing", className, {
            type: "reserve-finished",
          })}
        >
          <span {...getStyles("textSubdued")}>
            {getString("AUCTION_SOLD_FOR")}
          </span>
          <span {...getStyles("pricingAmount")}>
            <PricingString showUSD={false} pricing={highestBid.pricing} />
          </span>
          <span {...getStyles("textSubdued")}>
              {getString("SOLD_AT")}
            </span>
          <span>
            <time
                dateTime={dateFromTimestamp(pricing.reserve.approvedTimestamp).toISOString()}
            >
                {dateWithComma(pricing.reserve.approvedTimestamp)}
              </time>
          </span>
        </div>
      );
    }
    if (pricing.reserve?.reservePrice) {
      let buyNowPrice = null;

      if (pricing.reserve?.buyNowPrice
        && pricing.reserve?.buyNowPrice?.amount != "0") {//todo possible do something on hook, possible just set undefined.
        buyNowPrice = (//todo
          <div>
            <span {...getStyles("textSubdued")}>
              {getString("BUY_NOW_PRICE")}
            </span>
            <span>
              <PricingString
                showUSD={false}
                pricing={pricing.reserve.buyNowPrice}
              />
            </span>
          </div>
        );
      }

      if (pricing.reserve?.buyNowPrice
          && pricing.reserve?.buyNowPrice?.amount === "0") {
        buyNowPrice = (
            <div>
              <span {...getStyles("textSubdued")}>
                {getString("BUY_NOW_PRICE")}
              </span>
                <span>
                  {getString("NOT_APPLICABLE")}
              </span>
            </div>
        );
      }

      return (
        <div
          {...getStyles("cardAuctionPricing", className, {
            type: "reserve-pending",
          })}
        >
          <div>
          <span {...getStyles("textSubdued")}>
            {getString("RESERVE_PRICE")}
          </span>
          <span>
            <PricingString
              showUSD={false}
              pricing={pricing.reserve.reservePrice}
              />
            </span>
          </div>
          {buyNowPrice}
        </div>
      );
    }
  }

  return (
    <div {...getStyles("cardAuctionPricing", className, { type: "unknown" })}>
      <div {...getStyles("textSubdued")}>{getString("PRICING_LOADING")}</div>
      <div {...getStyles("pricingAmount")}>{getString("PRICING_LOADING")}</div>
    </div>
  );
};
