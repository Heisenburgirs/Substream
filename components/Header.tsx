"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useSession, signIn, signOut } from "next-auth/react"

import { useUserContext } from "./context/UserContext";
import { useDiscordContext } from "./context/DiscordContext";
import { Whitelist } from "./Whitelist";
import { ethers } from "ethers";
import ABI from '../constants/abi.json'
import { SUBSTREAM_CONTRACT, chains } from "../constants/constants";
import Link from 'next/link';
import { Framework } from "@superfluid-finance/sdk-core";
import { useEthers } from "./context/EthersContext";

export const Header = () => {
  /**
   * Wagmi hook for getting account information
   * @see https://wagmi.sh/docs/hooks/useAccount
   */	
  const { address, isConnected } = useAccount();

	// Mobile Menu
  const [menuOpen, setMenuOpen] = useState(false);

	// Access session
  const { data: session } = useSession()

	// Set user & context
  const { user, setUser, initialized, setInitialized, framework, setFramework, superSigner, setSuperSigner } = useUserContext();
  const { discord, setDiscord, discordOwner, setDiscordOwner } = useDiscordContext();

  // provider and contract instance
  const { provider, signer, contract } = useEthers();
  
  // Check if user is initialized i.e. whitelisted on contract
  useEffect(() => {
    async function checkWhitelistStatus() {
      if (isConnected) {
        const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);

        const contract = new ethers.Contract(SUBSTREAM_CONTRACT, ABI, provider);

        // The isWhitelisted function from the previous answer
        const whitelistedAddress = await contract.isWhitelisted(address);

        if (!whitelistedAddress) {  // Checks if isWhitelisted is false
          setInitialized(false);
        } else {
          setInitialized(true);
        }
      }
    }

    checkWhitelistStatus(); 
  }, [isConnected]);

  // Create framework using SuperfluidSDK
  useEffect(() => {
    async function createFramework() {
        if (isConnected && provider) {
            const sf = await Framework.create({
                chainId: chains, // Mumbai for now 80001
                provider: provider
            });

            const superSigner = sf.createSigner({ signer: signer });

            setFramework(sf);
            setSuperSigner(superSigner);

            console.log(sf);
            console.log(superSigner);
        }
    }

    // Call createFramework immediately upon mounting
    createFramework();

    // Set the interval to call createFramework every 1 minute
    const intervalId = setInterval(createFramework, 60000);

    // Clear the interval when the component is unmounted
    return () => clearInterval(intervalId);

  }, [isConnected, provider]);

  const extractGuildValues = () => {
    // Destructure guilds from session if available
    const { guilds } = session || {};

    if (!guilds || !Array.isArray(guilds)) {
        console.error("Guilds are not available or not an array.");
        return;
    }

    // 1. Array excluding features, icon, and permissions
    const mappedDiscord = guilds.map(guild => {
        const { features, icon, permissions, ...rest } = guild;
        return rest;
    });

    setDiscord(mappedDiscord);

    // 2. Array of guilds where OWNER is true
    const discordOwner = guilds.filter(guild => guild.owner);

    setDiscordOwner(discordOwner);
  }

  // Extract all the required values from session
	useEffect(() => {
		const intervalId = setInterval(() => {
			if (session) {
				setUser({
					name: session?.user?.name || "",
					image: session?.user?.image || "",
					//@ts-ignore
					userid: session?.userId || "",
				});

        extractGuildValues()
			}
		}, 4000); // 10   seconds in milliseconds
	
		// Clear the interval when the component unmounts or when the effect is re-run
		return () => {
			clearInterval(intervalId);
		};
	}, [session, setUser, setDiscord]);

	const test = () => {
    console.log(discord)
    console.log(discordOwner)
  }

  return (
    <div className="w-full py-4 px-8">
      {session && !initialized && <Whitelist address={address} discordServerIds={discordOwner} /> }
      <div className="w-full flex justify-between items-center">
        <Link href="/" className="flex gap-2 text-base items-center font-bold shadow-md px-4 py-2 rounded-15" >
          Substream
        </Link>

        <div className="flex gap-4">
					{/* Discord Login & User Profile */}
          {session ? (
							<div className="relative group sm:hidden md:block">
								{/* Profile trigger */}
								<div className="flex gap-4 items-center shadow-md px-4 py-2 rounded-15 cursor-pointer">
										<div className="flex gap-4 items-center">
												<div className="font-bold">{user?.name ?? "user"}</div>
												{/*<div onClick={test}>test</div>*/}
										</div>
								</div>
								
								{/* Invisible bridge */}
								<div className="absolute left-0 w-full h-[10px] bg-transparent group-hover:block hidden"></div>
						
								{/* Dropdown Menu */}
								<div className="absolute rounded-20 left-0 mt-2 w-48 bg-white divide-y divide-gray-100  shadow-lg group-hover:block hidden">
										<div className="p-2">
												<Link href="/servers" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-15 font-bold">My Servers</Link>
												<button onClick={() => signOut()} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-15 font-bold">
														Log Out
												</button>
										</div>
								</div>
							</div>					
            ) : (
							<div className="flex sm:hidden md:block">
									<button onClick={() => signIn()}  className="shadow-md px-4 py-2 rounded-15 cursor-pointer font-bold">Log In</button>
							</div>
            )
          }
					<div className="sm:hidden md:block">
            <ConnectButton  />
          </div>
        </div>

        <div className="relative group md:hidden">
          {/* The burger icon */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="hamburger p-4 focus:outline-none"
          >
            <div className="h-1 w-6 bg-black mb-1 rounded"></div>
            <div className="h-1 w-6 bg-black mb-1 rounded"></div>
            <div className="h-1 w-6 bg-black rounded"></div>
          </button>

          {/* The sidebar menu */}
          <div
            style={{ transform: menuOpen ? 'translateX(0%)' : 'translateX(-100%)' }}
            className="fixed top-0 left-0 w-full h-full bg-white transform transition-transform duration-300 ease-in-out"
          >
            <div className="w-full h-full flex flex-col justify-between items-center py-8 px-4">
              <div className="flex flex-col gap-8 justify-center items-center text-medium">
                <Link href="/servers" className="block block px-4 py-2 shadow-md rounded-15 font-bold">My Servers</Link>
                {session ?
                (
                <button onClick={() => signOut()} className="block text-left px-4 py-2 shadow-md rounded-15 font-bold">
                    Log Out
                </button>
                )
                :
                (
									<button onClick={() => signIn()}  className="shadow-md px-4 py-2 rounded-15 cursor-pointer font-bold">Log In</button>
                )}
              </div>
              <div className="flex flex-col gap-8">
                <ConnectButton />
                <button onClick={() => setMenuOpen(!menuOpen)} className="w-full text-center text-base block px-4 py-2 text-gray-700 bg-gray-100 rounded-15 font-bold">Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}