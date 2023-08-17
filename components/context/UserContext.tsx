import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

interface User {
  name: string;
  userid: string;
  image: string;
}

interface UserContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
}

// Provide the default values for the context
const defaultUserContext: UserContextType = {
  user: null,
  setUser: () => {},
};

export const UserProvider = createContext<UserContextType>(defaultUserContext);

export const useUserContext = () => {
  return useContext(UserProvider);
};

interface UserProviderComponentProps {
  children: ReactNode;
}

export const UserProviderComponent = ({ children }: UserProviderComponentProps) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserProvider.Provider
      value={{
        user,
        setUser,
      }}
    >
      {children}
    </UserProvider.Provider>
  );
};