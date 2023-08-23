import { createContext, useContext, ReactNode } from 'react';
import { IPFS } from 'ipfs-core-types';

interface IPFSContextProps {
    client: IPFS | null;
}

const IPFSContext = createContext<IPFSContextProps>({ client: null });

export const useIPFS = () => {
    const context = useContext(IPFSContext);
    if (context === undefined) {
        throw new Error('useIPFS must be used within a IPFSProvider');
    }
    return context;
};

interface IPFSProviderProps {
    children: ReactNode;
    client: IPFS;
}

export const IPFSProvider: React.FC<IPFSProviderProps> = ({ children, client }) => {
    return <IPFSContext.Provider value={{ client }}>{children}</IPFSContext.Provider>;
};
