import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

interface Discord {
  id: string;
  serverName: string;
}

interface UserContextType {
  discord: Discord | null;
  setDiscord: Dispatch<SetStateAction<Discord | null>>;
}

// Provide the default values for the context
const defaultUserContext: UserContextType = {
  discord: null,
  setDiscord: () => {},
};

export const UserProvider = createContext<UserContextType>(defaultUserContext);

export const useDiscordContext = () => {
  return useContext(UserProvider);
};

interface DiscordProviderComponentProps {
  children: ReactNode;
}

export const DiscordProviderComponent = ({ children }: DiscordProviderComponentProps) => {
  const [discord, setDiscord] = useState<Discord | null>(null);

  return (
    <UserProvider.Provider
      value={{
        discord,
        setDiscord,
      }}
    >
      {children}
    </UserProvider.Provider>
  );
};
