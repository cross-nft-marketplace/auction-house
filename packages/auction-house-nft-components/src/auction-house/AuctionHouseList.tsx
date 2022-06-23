import { AuctionResultType, NftDataFetchStrategy, useAuctions } from "@cross-nft-marketplace/auction-house-nft-hooks";
import { useMediaContext } from "../context/useMediaContext";
import { NFTPreview } from "../nft-preview/NFTPreview";

type AuctionHouseProps = {
  curatorIds: string[];
  approved?: boolean | null;
  onClick?: (
    evt: React.MouseEvent<HTMLElement>,
    result: AuctionResultType
  ) => void;
  fetchStrategy?: NftDataFetchStrategy
};

export const AuctionHouseList = ({
  curatorIds,
  approved = true,
  onClick,
  fetchStrategy,
}: AuctionHouseProps) => {
  let { data, loading, error } = useAuctions(curatorIds, approved);
  const { getStyles } = useMediaContext();

  if (loading || error) {
    return <span>...</span>;
  }

  //if showing list of nft - we need skip duplicates.
  if (data) {
    data = data.filter((value, index, self) => self.findIndex(token => token.tokenId == value.tokenId && token.tokenContract == value.tokenContract) === index);
  }

  return (
    <div {...getStyles("auctionHouseList")}>
      {data &&
        data.map((auction) => (
          <NFTPreview
            fetchStrategy={fetchStrategy}
            key={auction.id}
            id={auction.tokenId}
            contract={auction.tokenContract}
            onClick={onClick ? (evt) => onClick(evt, auction) : undefined}
          />
        ))}
    </div>
  );
};
