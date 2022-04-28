import React from "react";
import Cover from "./components/minter/Cover";
import {Notification} from "./components/ui/Notifications";
import Wallet from "./components/Wallet";
import {useBalance, useMinterContract, useMarketplaceContract} from "./hooks";
import Nfts from "./components/minter/nfts";
import {useContractKit} from "@celo-tools/use-contractkit";
import "./App.css";
import {Container, Nav} from "react-bootstrap";

const App = function AppWrapper() {
  
    const {address, destroy, connect} = useContractKit();
    const {balance, getBalance} = useBalance();

    // initialize the NFT mint contract
    const minterContract = useMinterContract();

     // initialize the NFT marketplace contract
     const marketplaceContract = useMarketplaceContract();

    return (
        <>
            <Notification/>

            {address ? (
                <Container fluid="md">
                    <Nav className="justify-content-end pt-3 pb-5">
                        <Nav.Item>

                            {/*display user wallet*/}
                            <Wallet
                                address={address}
                                amount={balance.CELO}
                                symbol="CELO"
                                destroy={destroy}
                            />
                        </Nav.Item>
                    </Nav>
                    <main>

                        {/*list NFTs*/}
                        <Nfts
                            name="Pokemon"
                            updateBalance={getBalance}
                            minterContract={minterContract}
                            marketplaceContract={marketplaceContract}
                        />
                    </main>
                </Container>
            ) : (
                //  if user wallet is not connected display cover page
                <Cover name="Pokemon" coverImg="http://cdn.shopify.com/s/files/1/0532/0792/4897/products/ultrararepacklot2.png?v=1643400181" connect={connect}/>
            )}
        </>
    );
};

export default App;