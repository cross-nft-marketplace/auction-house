import { Fragment, useContext } from "react";

import { PricingString } from "../utils/PricingString";
import { AddressView } from "../components/AddressView";
import { NFTDataContext } from "../context/NFTDataContext";
import { useMediaContext } from "../context/useMediaContext";
import { InfoContainer } from "./InfoContainer";
import type { StyleProps } from "../utils/StyleTypes";
import { dateFromTimestamp, dateFormat } from "../utils/date";
import { VIEW_ETHERSCAN_URL_BASE_BY_NETWORK } from "../constants/media-urls";
import type { PastReserveBid } from "@cross-nft-marketplace/auction-house-nft-hooks/dist/fetcher/AuctionInfoTypes";

type BidHistoryProps = {
  showPerpetual?: boolean;
} & StyleProps;

export const BidHistory = ({
  showPerpetual = true,
  className,
}: BidHistoryProps) => {
  const { nft } = useContext(NFTDataContext);
  const { getString, getStyles, style, networkId} = useMediaContext();

  const getPastBids = () => {
    const { data } = nft;
    if (!data || !data.nft) {
      return <Fragment />;
    }

    const currentBid = data.pricing.reserve?.currentBid
      ? [data.pricing.reserve?.currentBid]
      : [];
    const eventsList = [
      ...(showPerpetual ? data.pricing.perpetual.bids : []),
      ...(data.pricing.reserve?.previousBids || []),
      ...currentBid,
    ].map((bid) => ({
      activityDescription: getString((bid as PastReserveBid)?.buyNowActual ? "BID_HISTORY_PURCHASED_FOR" : "BID_HISTORY_BID"),
      actor: bid.bidder.id,
      pricing: <PricingString pricing={bid.pricing} showUSD={false} />,
      createdAt: bid.createdAtTimestamp,
      // hint for type inference
      transactionHash: bid.transactionHash as string | null,
      key: `${bid.id}-bid`
    }));

    if (
      data.pricing.reserve?.createdAtTimestamp &&
      // Only show approved auction listings
      data.pricing.reserve?.approvedTimestamp
    ) {
      eventsList.push({
        activityDescription: getString("BID_HISTORY_LISTED"),
        pricing: <Fragment />,
        actor: data.pricing.reserve.tokenOwner.id,
        // TODO(iain): Update to the timestamp when approved
        createdAt: data.pricing.reserve.approvedTimestamp,
        transactionHash: data.pricing.reserve.transactionHash,
        key: `${data.pricing.reserve.tokenOwner.id}-${data.pricing.reserve.approvedTimestamp}-listed`
      });
    }

    if (
      data.pricing &&
      data.pricing.reserve &&
      data.pricing.reserve.current.likelyHasEnded &&
      (data.pricing.reserve.status === "Active" ||
        data.pricing.reserve.status === "Finished")
    ) {
      const highestBid =
        data.pricing.reserve.currentBid || data.pricing.reserve.previousBids[0];
      
      //todo possible dont show "won the auction" for buyNow.
      //todo remove 1 sec hack.
      const wonDt = data.pricing.reserve.finalizedAtTimestamp
        ? Math.min(Number(data.pricing.reserve.finalizedAtTimestamp) + 1, Number(data.pricing.reserve.expectedEndTimestamp))//for buyNow finalizedAtTimestamp is less.
        : data.pricing.reserve.expectedEndTimestamp;
      
        eventsList.push({
        activityDescription: getString("BID_HISTORY_WON_AUCTION"),
        pricing: <Fragment />,
        actor: highestBid.bidder.id,
        createdAt: wonDt,
        transactionHash: data.pricing.reserve.currentBid?.transactionHash || null,
        key: `${highestBid.bidder.id}-${wonDt}-won`
      });
    }

    if (
      "zoraNFT" in data &&
      data.zoraNFT &&
      data.zoraNFT.createdAtTimestamp &&
      !("zoraIndexerResponse" in data)
    ) {
      eventsList.push({
        activityDescription: getString("BID_HISTORY_MINTED"),
        pricing: <Fragment />,
        actor: data.nft.creator || "",
        createdAt: data.zoraNFT.createdAtTimestamp,
        transactionHash: null,
        key: `${data.nft.creator || ""}-${data.zoraNFT.createdAtTimestamp}-minted`
      });
    }

    if ("zoraIndexerResponse" in data && data.zoraIndexerResponse.minter) {
      const unixDate =
        new Date(
          data.zoraIndexerResponse.mintTransferEvent?.blockTimestamp + "Z"
        ).getTime() / 1000;

      eventsList.push({
        key: `${data.zoraIndexerResponse.minter}-${unixDate}-minted`,
        activityDescription: getString("BID_HISTORY_MINTED"),
        pricing: <Fragment />,
        actor: data.zoraIndexerResponse.minter,
        createdAt: unixDate.toString(),
        transactionHash:
          data.zoraIndexerResponse.mintTransferEvent?.transactionHash || null,
      });
    }

    if ("openseaInfo" in data && data.openseaInfo.creator) {
      eventsList.push({
        activityDescription: getString("BID_HISTORY_MINTED"),
        pricing: <Fragment />,
        actor: data.openseaInfo.creator.address,
        createdAt: null,
        transactionHash: null,
        key: `${data.openseaInfo.creator.address}-${null}-minted`
      });
    }

    return eventsList
      .sort((bidA, bidB) => (bidA.createdAt > bidB.createdAt ? -1 : 1))
      .map((bidItem) => (
        <li
          {...getStyles("fullPageHistoryItem")}
          key={bidItem.key}
        >
          <div {...getStyles("fullPageHistoryItemDescription")}>
            <div {...getStyles("fullPageHistoryItemDescriptionCopy")}>
              <AddressView address={bidItem.actor} />
              &nbsp;
              <span {...getStyles("pricingAmount")}>
                {bidItem.activityDescription} {bidItem.pricing}
              </span>
            </div>
            {bidItem.transactionHash && style.theme.showTxnLinks && (
              <a
                {...getStyles("fullPageHistoryTxnLink")}
                href={`${VIEW_ETHERSCAN_URL_BASE_BY_NETWORK[networkId]}tx/${bidItem.transactionHash}`}
                target="_blank"
                rel="noreferrer"
              >
                {getString("BID_HISTORY_VIEW_TRANSACTION")}
              </a>
            )}
          </div>
          {bidItem.createdAt && (
            <div {...getStyles("fullPageHistoryItemMeta")}>
              <time
                dateTime={dateFromTimestamp(bidItem.createdAt).toISOString()}
                {...getStyles("fullPageHistoryItemDatestamp")}
              >
                {dateFormat(bidItem.createdAt)}
              </time>
            </div>
          )}
        </li>
      ));
  };

  return (
    <InfoContainer titleString="NFT_HISTORY" className={className}>
      <ol {...getStyles("fullPageHistoryList")}>{getPastBids()}</ol>
    </InfoContainer>
  );
};
