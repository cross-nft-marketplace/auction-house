import { Networks } from "@cross-nft-marketplace/auction-house-nft-hooks";

export const MEDIA_URL_BASE_BY_NETWORK = {
  [Networks.MAINNET]: "https://zora.co/",
  [Networks.RINKEBY]: null,
};

export const VIEW_ETHERSCAN_URL_BASE_BY_NETWORK = {
  [Networks.MAINNET]: "https://etherscan.io/",
  [Networks.RINKEBY]: "https://rinkeby.etherscan.io/",
};

export const ZORA_SITE_URL_BASE = "https://zora.co";
