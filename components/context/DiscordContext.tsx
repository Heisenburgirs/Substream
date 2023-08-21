import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

interface Discord {
  id: string;
  name: string;
  owner: boolean;
}

interface UserContextType {
  discord: Discord[] | null;  // Update type to array
  setDiscord: Dispatch<SetStateAction<Discord[] | null>>;
  discordOwner: Discord[] | null;  // Update type to array
  setDiscordOwner: Dispatch<SetStateAction<Discord[] | null>>;
}

// Provide the default values for the context
const defaultUserContext: UserContextType = {
  discord: null,
  setDiscord: () => {},
  discordOwner: null,
  setDiscordOwner: () => {},
};

export const UserProvider = createContext<UserContextType>(defaultUserContext);

export const useDiscordContext = () => {
  return useContext(UserProvider);
};

interface DiscordProviderComponentProps {
  children: ReactNode;
}

export const DiscordProviderComponent = ({ children }: DiscordProviderComponentProps) => {
  const [discord, setDiscord] = useState<Discord[] | null>(null);
  const [discordOwner, setDiscordOwner] = useState<Discord[] | null>(null);
  

  return (
    <UserProvider.Provider
      value={{
        discord,
        setDiscord,
        discordOwner,
        setDiscordOwner,
      }}
    >
      {children}
    </UserProvider.Provider>
  );
};
