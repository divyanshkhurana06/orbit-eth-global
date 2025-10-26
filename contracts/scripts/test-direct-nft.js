const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 TESTING DIRECT NFT MINTING...");
    console.log("");
    
    // Get the NFT contract address
    const GameEscrow = await ethers.getContractFactory("GameEscrow");
    const gameEscrow = GameEscrow.attach("0x85761DB340EF99E060B6c5db6218dFDD503780c3");
    const winnerNFTAddress = await gameEscrow.winnerNFT();
    
    // Get the NFT contract
    const WinnerNFT = await ethers.getContractFactory("OrbitWinnerNFT");
    const winnerNFT = WinnerNFT.attach(winnerNFTAddress);
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    console.log("Winner NFT Contract:", winnerNFTAddress);
    
    // Check current state
    const totalSupply = await winnerNFT.totalSupply();
    console.log("Current NFTs minted:", totalSupply.toString());
    
    // Test minting an NFT directly (as owner)
    console.log("");
    console.log("🎮 MINTING TEST NFT...");
    
    try {
        // Mint NFT directly (only owner can do this)
        const mintTx = await winnerNFT.mintWinnerNFT(
            deployer.address, // winner
            "0x1234567890123456789012345678901234567890", // fake opponent
            "Table Tennis", // game mode
            ethers.parseEther("0.001"), // wager amount
            "orbit-winner-test-123" // screenshot hash
        );
        await mintTx.wait();
        console.log("✅ NFT minted successfully!");
        
        // Check if NFT was minted
        const newTotalSupply = await winnerNFT.totalSupply();
        console.log("New NFTs minted:", newTotalSupply.toString());
        
        if (newTotalSupply > totalSupply) {
            console.log("");
            console.log("🎉 SUCCESS! NFT MINTED!");
            console.log("Winner:", deployer.address);
            console.log("NFT Token ID:", (newTotalSupply - 1n).toString());
            
            // Get NFT metadata
            const tokenId = newTotalSupply - 1n;
            const tokenURI = await winnerNFT.tokenURI(tokenId);
            console.log("NFT Metadata URI:", tokenURI);
            
            // Get winner data
            const winnerData = await winnerNFT.getWinnerData(tokenId);
            console.log("Winner Data:");
            console.log("- Winner:", winnerData.winner);
            console.log("- Opponent:", winnerData.opponent);
            console.log("- Game Mode:", winnerData.gameMode);
            console.log("- Wager Amount:", ethers.formatEther(winnerData.wagerAmount), "ETH");
            console.log("- Timestamp:", new Date(Number(winnerData.timestamp) * 1000).toISOString());
            console.log("- Screenshot:", winnerData.gameScreenshot);
            
            console.log("");
            console.log("🏆 NFT IS NOW IN YOUR WALLET!");
            console.log("Check your wallet for the new NFT!");
        } else {
            console.log("❌ No NFT was minted");
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
