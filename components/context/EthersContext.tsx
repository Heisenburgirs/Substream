import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface EthersContextProps {
  provider?: ethers.providers.Web3Provider;
  signer?: ethers.providers.JsonRpcSigner;
  contract?: ethers.Contract;
  gasPrice?: ethers.BigNumber;
  setGasPrice?: React.Dispatch<React.SetStateAction<ethers.BigNumber | undefined>>;
}

const EthersContext = createContext<EthersContextProps>({});

export const useEthers = () => {
  return useContext(EthersContext);
};

type EthersProviderProps = {
  children: ReactNode;
  SUBSTREAM_CONTRACT: string;
  ABI: any[];
}

export const EthersProvider: React.FC<EthersProviderProps> = ({ children, SUBSTREAM_CONTRACT, ABI }) => {
  let provider: ethers.providers.Web3Provider | undefined;
  let signer: ethers.providers.JsonRpcSigner | undefined;
  let contract: ethers.Contract | undefined;
  let gasPrice: Promise<ethers.BigNumber> | undefined;

  const [currentGasPrice, setGasPrice] = useState<ethers.BigNumber | undefined>();

  useEffect(() => {
    const fetchGasPrice = async () => {
      if (provider) {
        const price = await provider.getGasPrice();
        setGasPrice(price);
      }
    };

    fetchGasPrice();
  }, [provider]);

  if (typeof window !== 'undefined' && window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    contract = new ethers.Contract(SUBSTREAM_CONTRACT, ABI, signer);
    gasPrice = provider.getGasPrice();
  }

  return (
    <EthersContext.Provider value={{ provider, signer, contract, gasPrice: currentGasPrice, setGasPrice }}>
      {children}
    </EthersContext.Provider>
  );
};
