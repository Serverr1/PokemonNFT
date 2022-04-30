import { create as ipfsHttpClient } from "ipfs-http-client";
import axios from "axios";
import NFTMarketplaceContractAddress from "../contracts/NFTMarketplace-address.json";
import MyNFTContractAddress from "../contracts/MyNFT-address.json";
import NFTMarketplaceAddress from "../contracts/NFTMarketplace-address.json";
import { BigNumber, ethers } from "ethers";

// initialize IPFS
const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

// mint an NFT
export const createNft = async (
  minterContract,
  marketplaceContract,
  performActions,
  { name, price, description, ipfsImage, ownerAddress, attributes }
) => {
  await performActions(async (kit) => {
    if (!name || !description || !ipfsImage) return;
    const { defaultAccount } = kit;

    // convert NFT metadata to JSON format
    const data = JSON.stringify({
      name,
      description,
      image: ipfsImage,
      owner: defaultAccount,
      attributes,
    });

    try {
      // save NFT metadata to IPFS
      const added = await client.add(data);

      // IPFS url for uploaded metadata
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;

      // mint the NFT and save the IPFS url to the blockchain
      let transaction = await minterContract.methods
        .mint(url)
        .send({ from: defaultAccount });

      let tokenCount = BigNumber.from(
        transaction.events.Transfer.returnValues.tokenId
      );

      const auctionPrice = ethers.utils.parseUnits(String(price), "ether");
      console.log(auctionPrice);

      await minterContract.methods
        .approve(NFTMarketplaceAddress.NFTMarketplace, tokenCount)
        .send({ from: kit.defaultAccount });

      await marketplaceContract.methods
        .makeItem(MyNFTContractAddress.MyNFT, tokenCount, auctionPrice)
        .send({ from: defaultAccount });

      return transaction;
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
  });
};

// function to upload a file to IPFS
export const uploadToIpfs = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const added = await client.add(file, {
      progress: (prog) => console.log(`received: ${prog}`),
    });
    return `https://ipfs.infura.io/ipfs/${added.path}`;
  } catch (error) {
    console.log("Error uploading file: ", error);
  }
};

// fetch all NFTs on the smart contract
export const getNfts = async (minterContract, marketplaceContract) => {
  try {
    const nfts = [];
    const nftsLength = await marketplaceContract.methods.getItemCount().call();

    // contract starts minting from index 1
    for (let i = 1; i <= Number(nftsLength); i++) {
      const nft = new Promise(async (resolve) => {
        const item = await marketplaceContract.methods.getItem(i).call();
        const res = await minterContract.methods.tokenURI(item.tokenId).call();

        const meta = await fetchNftMeta(res);
        const owner = await fetchNftOwner(minterContract, item.tokenId);
        resolve({
          index: i,
          contractOwner: owner,
          itemId: item.tokenId,
          nft: item.nft,
          tokenId: item.tokenId,
          price: item.price,
          seller: item.seller,
          name: meta.data.name,
          image: meta.data.image,
          description: meta.data.description,
          attributes: meta.data.attributes,
        });
      });
      nfts.push(nft);
    }
    return Promise.all(nfts);
  } catch (e) {
    console.log({ e });
  }
};

// get the metedata for an NFT from IPFS
export const fetchNftMeta = async (ipfsUrl) => {
  try {
    if (!ipfsUrl) return null;
    const meta = await axios.get(ipfsUrl);
    return meta;
  } catch (e) {
    console.log({ e });
  }
};

// get the owner address of an NFT
export const fetchNftOwner = async (minterContract, index) => {
  try {
    return await minterContract.methods.ownerOf(index).call();
  } catch (e) {
    console.log({ e });
  }
};

// get the address that deployed the NFT contract
export const fetchNftContractOwner = async (minterContract) => {
  try {
    let owner = await minterContract.methods.owner().call();
    return owner;
  } catch (e) {
    console.log({ e });
  }
};

export const purchaseItem = async (
  minterContract,
  marketplaceContract,
  performActions,
  index,
  tokenId
) => {
  try {
    await performActions(async (kit) => {
      try {
        console.log(marketplaceContract, index);
        const { defaultAccount } = kit;
        const item = await marketplaceContract.methods.getItem(index).call();
        await marketplaceContract.methods
          .purchaseItem(index)
          .send({ from: defaultAccount, value: item.price });
      } catch (error) {
        console.log({ error });
      }
    });
  } catch (error) {
    console.log(error);
  }
};
