import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Confetti from "react-confetti";
import "tailwindcss/tailwind.css";

const contractAddress = "0x3cf7d69f4b53cf97410df79810ef1f0b5b388889";
const contractABI = [
  { inputs: [], name: "enter", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [], name: "pickWinner", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "getParticipants", outputs: [{ internalType: "address[]", name: "", type: "address[]" }], stateMutability: "view", type: "function" },
];

const Lottery = () => {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [balance, setBalance] = useState("0");
  const [account, setAccount] = useState("");
  const [winner, setWinner] = useState(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEntering, setIsEntering] = useState(false);
  const [isPickingWinner, setIsPickingWinner] = useState(false);

  useEffect(() => {
    connectWallet();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0]);
        connectWallet();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", connectWallet);
      }
    };
  }, []);

  useEffect(() => {
    if (contract) {
      fetchData();
    }
  }, [contract]);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const lotteryContract = new ethers.Contract(contractAddress, contractABI, web3Signer);

      setProvider(web3Provider);
      setContract(lotteryContract);

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const participantsList = await contract.getParticipants();
      const contractBalance = await provider.getBalance(contractAddress);

      setParticipants(participantsList);
      setBalance(ethers.formatUnits(contractBalance, "ether"));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const enterLottery = async () => {
    if (!contract) return;
    setIsEntering(true);
    try {
      const tx = await contract.enter({ value: ethers.parseUnits("1000", "wei") });
      await tx.wait();
      alert("Successfully entered the lottery!");
      fetchData();
    } catch (error) {
      console.error("Error entering lottery:", error);
    }
    setIsEntering(false);
  };

  const pickWinner = async () => {
    if (!contract) return;
    setIsPickingWinner(true);
    try {
      const tx = await contract.pickWinner();
      await tx.wait();
      alert("Winner has been picked!");

      const latestParticipants = await contract.getParticipants();
      if (latestParticipants.length > 0) {
        setWinner(latestParticipants[latestParticipants.length - 1]);
        setIsCelebrating(true);
        setTimeout(() => setIsCelebrating(false), 5000);
      }
      fetchData();
    } catch (error) {
      console.error("Error picking winner:", error);
      alert("You might not be the contract owner.");
    }
    setIsPickingWinner(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500">
      {isCelebrating && <Confetti />}

      <div className="max-w-lg w-full bg-white/20 backdrop-blur-lg p-8 rounded-2xl shadow-2xl text-white text-center border border-white/30 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 rounded-2xl blur-xl"></div>

        <h1 className="text-5xl font-extrabold mb-6 animate-bounce drop-shadow-lg">🎟️ Lottery DApp</h1>

        {loading ? (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-400"></div>
          </div>
        ) : (
          <>
            <div className="bg-white/10 p-4 rounded-lg mb-6 shadow-md border border-white/20">
              <p className="text-lg font-semibold tracking-wide">
                💰 Contract Balance: <span className="text-yellow-300">{balance} ETH</span>
              </p>
            </div>

            <div className="bg-white/10 p-4 rounded-lg mb-6 shadow-md border border-white/20">
              <p className="text-sm font-medium">🔗 Wallet: {account || "Not connected"}</p>
            </div>

            <button
              className={`w-full ${isEntering ? "bg-gray-500" : "bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"} text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl`}
              onClick={enterLottery}
              disabled={isEntering}
            >
              {isEntering ? "Entering..." : "Enter Lottery (1000 wei)"}
            </button>

            <h2 className="text-2xl font-semibold mt-8 mb-4">👥 Participants:</h2>
            <div className="mt-2 bg-white/10 p-4 rounded-lg min-h-[100px] max-h-[200px] overflow-y-auto shadow-inner border border-white/20">
              {participants.length > 0 ? (
                participants.map((p, i) => (
                  <p key={i} className="text-sm bg-white/20 p-2 rounded-lg mb-2 hover:bg-white/30 transition-colors shadow-sm">{p}</p>
                ))
              ) : (
                <p className="text-gray-300">No participants yet.</p>
              )}
            </div>

            <button
              className={`w-full ${isPickingWinner ? "bg-gray-500" : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"} text-white font-bold py-3 px-6 mt-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl`}
              onClick={pickWinner}
              disabled={isPickingWinner}
            >
              {isPickingWinner ? "Picking Winner..." : "Pick Winner (Owner Only)"}
            </button>

            {winner && (
              <div className="mt-6 p-4 bg-green-500/90 text-white text-lg font-bold rounded-lg shadow-md animate-pulse border border-white/30">
                🎉 Winner: {winner} 🎉
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Lottery;
