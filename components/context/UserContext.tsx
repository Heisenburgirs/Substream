import { devNull } from 'os';
import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

interface User {
  name: string;
  userid: string;
  image: string;
}

interface UserContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  initialized: boolean;
  setInitialized: Dispatch<SetStateAction<boolean>>;
  framework: any;
  setFramework: Dispatch<SetStateAction<any>>;
  superSigner: any;
  setSuperSigner: any;
}

// Provide the default values for the context
const defaultUserContext: UserContextType = {
  user: null,
  setUser: () => {},
  initialized: true,
  setInitialized: () => {},
  framework: null,
  setFramework: () => {},
  superSigner: null,
  setSuperSigner: () => {}
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
  const [initialized, setInitialized] = useState<boolean>(true);
  const [framework, setFramework] = useState<any>(null);
  const [superSigner, setSuperSigner] = useState<any>(null);

  return (
    <UserProvider.Provider
      value={{
        user,
        setUser,
        initialized,
        setInitialized,
        framework,
        setFramework,
        superSigner,
        setSuperSigner
      }}
    >
      {children}
    </UserProvider.Provider>
  );
};
