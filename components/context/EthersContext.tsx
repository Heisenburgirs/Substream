import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface EthersContextProps {
  provider?: ethers.providers.Web3Provider;
  signer?: ethers.providers.JsonRpcSigner;
  contract?: ethers.Contract;
  gasPrice?: ethers.BigNumber;
  setGasPrice?: React.Dispatch<React.SetStateAction<ethers.BigNumber | undefined>>;
  isBlockchainOperationInProgress?: boolean;
  setIsBlockchainOperationInProgress?: React.Dispatch<React.SetStateAction<boolean>>;
}

const EthersContext = createContext<EthersContextProps>({});

export const useEthers = () => {
  const context = useContext(EthersContext);
  if (context === undefined) {
      throw new Error('useEthers must be used within a EthersProvider');
  }
  return context;
};

type EthersProviderProps = {
  children: ReactNode;
  SUBSTREAM_CONTRACT: string;
  ABI: any[];
}

export const EthersProvider: React.FC<EthersProviderProps> = ({ children, SUBSTREAM_CONTRACT, ABI }) => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | undefined>();
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner | undefined>();
  const [contract, setContract] = useState<ethers.Contract | undefined>();
  const [currentGasPrice, setGasPrice] = useState<ethers.BigNumber | undefined>();
  const [isBlockchainOperationInProgress, setIsBlockchainOperationInProgress] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const web3Signer = web3Provider.getSigner();
      const web3Contract = new ethers.Contract(SUBSTREAM_CONTRACT, ABI, web3Signer);

      setProvider(web3Provider);
      setSigner(web3Signer);
      setContract(web3Contract);
    }
  }, [SUBSTREAM_CONTRACT, ABI]);

  useEffect(() => {
    const fetchGasPrice = async () => {
      if (provider) {
        const price = await provider.getGasPrice();
        setGasPrice(price);
      }
    };

    fetchGasPrice();
  }, [provider]);

  return (
    <EthersContext.Provider value={{ provider, signer, contract, gasPrice: currentGasPrice, setGasPrice, isBlockchainOperationInProgress, setIsBlockchainOperationInProgress }}>
      {children}
    </EthersContext.Provider>
  );
};
