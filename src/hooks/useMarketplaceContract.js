import { useContract } from "./useContract";
import NFTMarketplaceAbi from "../contracts/NFTMarketplace.json";
import MyNFTContractAddress from "../contracts/NFTMarketplace-address.json";

export const useMarketplaceContract = () =>
  useContract(NFTMarketplaceAbi.abi, MyNFTContractAddress.NFTMarketplace);
