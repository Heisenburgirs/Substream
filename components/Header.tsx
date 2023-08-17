"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useSession, signIn, signOut } from "next-auth/react"

import { useUserContext } from "./context/UserContext";
import { useDiscordContext } from "./context/DiscordContext";

// Session user info interface
interface Session {
  user?: {
    name: string;
    image: string;
  };
  userId?: string;
	guilds?: {
		id: string;
		name: string;
	}
}

// Discord object interface
interface Discord {
  id: string;
  serverName: string;
}

export const Header = () => {
  /**
   * Wagmi hook for getting account information
   * @see https://wagmi.sh/docs/hooks/useAccount
   */	
  const { isConnected } = useAccount();

	// Mobile Menu
  const [menuOpen, setMenuOpen] = useState(false);

	// Check if user is authenticated
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	// Access session
  const { data: session } = useSession()

	// Set user & context
  const { user, setUser } = useUserContext();
  const { discord, setDiscord } = useDiscordContext();

	useEffect(() => {
		if (session) {

			setUser({
				name: session?.user?.name || "",
				image: session?.user?.image || "",
				//@ts-ignore
				userid: session?.userId || "",
			});

			//@ts-ignore
			const mappedDiscord = session?.guilds.map((guild: any) => ({
        id: guild.id,
        serverName: guild.name,
      }));

      setDiscord(mappedDiscord);
		}
	}, [setUser, setDiscord]);


	const test = () => {
		console.log("session", session)
	}

  return (
    <div className="w-full px-8 py-4">
      <div className="w-full flex justify-between items-center">
        <div className="flex gap-2 text-base items-center font-bold shadow-md px-4 py-2 rounded-15" >
          <div>Substream</div>
        </div>

        <div className="flex gap-4">
					{/* Discord Login & User Profile */}
          {session ? (
							<div className="relative group">
								{/* Profile trigger */}
								<div className="flex gap-4 items-center shadow-md px-4 py-2 rounded-15 cursor-pointer">
										<div className="flex gap-4 items-center">
												{/*<img src={user?.picture} alt="profile" className="w-[20px] rounded-15" />*/}
												<div className="font-bold">{user?.name}</div>
												{/*<div onClick={test}>test</div>*/}
										</div>
								</div>
								
								{/* Invisible bridge */}
								<div className="absolute left-0 w-full h-[10px] bg-transparent group-hover:block hidden"></div>
						
								{/* Dropdown Menu */}
								<div className="absolute rounded-20 left-0 mt-2 w-48 bg-white border border-gray-200 divide-y divide-gray-100  shadow-lg group-hover:block hidden">
										<div className="p-2">
												<a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-15 font-bold">Manage </a>
												<a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-15 font-bold">Create </a>
												<button onClick={() => signOut()} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-15 font-bold">
														Log Out
												</button>
										</div>
								</div>
							</div>					
            ) : (
							<div>
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
              <a href="#" className="w-full text-center text-base block px-4 py-2 text-gray-700 bg-gray-100 rounded-15 font-bold">Activity</a>
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
function userDiscordContext(): { discord: any; setDiscord: any; } {
	throw new Error("Function not implemented.");
}

