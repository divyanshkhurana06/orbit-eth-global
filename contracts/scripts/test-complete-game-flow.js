const { ethers } = require("hardhat");

async function main() {
    console.log("🎮 TESTING COMPLETE GAME FLOW WITH NFT MINTING...");
    console.log("");
    
    // Get contracts
    const GameEscrow = await ethers.getContractFactory("GameEscrow");
    const gameEscrow = GameEscrow.attach("0x85761DB340EF99E060B6c5db6218dFDD503780c3");
    
    const WinnerNFT = await ethers.getContractFactory("OrbitWinnerNFT");
    const winnerNFTAddress = await gameEscrow.winnerNFT();
    const winnerNFT = WinnerNFT.attach(winnerNFTAddress);
    
    // Get deployer account (contract owner/authorized referee)
    const [deployer] = await ethers.getSigners();
    console.log("Contract Owner/Referee:", deployer.address);
    
    // Check current state
    const totalSupply = await winnerNFT.totalSupply();
    console.log("Current NFTs minted:", totalSupply.toString());
    
    // Create a test game
    console.log("");
    console.log("🎮 CREATING TEST GAME...");
    
    try {
        // Create game
        const createTx = await gameEscrow.createGame(
            ethers.parseEther("0.001"), // 0.001 ETH wager
            "0x0000000000000000000000000000000000000000", // ETH token
            0, // Pushup Battle
            { value: ethers.parseEther("0.001") }
        );
        await createTx.wait();
        console.log("✅ Test game created");
        
        // Get the game ID
        const gameIdCounter = await gameEscrow.gameIdCounter();
        const gameId = gameIdCounter - 1n;
        console.log("Game ID:", gameId.toString());
        
        // Join the game as player 2 (same address for demo)
        const joinTx = await gameEscrow.joinGame(gameId, { value: ethers.parseEther("0.001") });
        await joinTx.wait();
        console.log("✅ Player 2 joined");
        
        // Complete the game as authorized referee
        const gameDataHash = ethers.keccak256(ethers.toUtf8Bytes(`test-game-${gameId}`));
        const completeTx = await gameEscrow.completeGame(gameId, deployer.address, gameDataHash);
        await completeTx.wait();
        console.log("✅ Game completed by referee");
        
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
            console.log("🏆 NFT SYSTEM WORKING PERFECTLY!");
            console.log("Check your wallet for the new NFT!");
            console.log("Contract Address:", winnerNFTAddress);
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
