import { ethers } from 'ethers'
import { SuperTokenInfo } from '@superfluid-finance/tokenlist';

export type FormData = {
  incomingToken: string;
  flowRate: string;
  discordServerId: string;
  finalRecipient: string;
  uri: string;
};

type SetStateAction<S> = S | ((prevState: S) => S);
type Dispatch<A> = (value: A) => void;

// Convert BigInt to String
export const hexToDecimalString = (hexValue: string): string => {
  return BigInt(hexValue).toString(10);
}

// Calculates flow per second based on tokens/monthly
export const calculateFlowPerSecond = (addedForms: any) => {
  // Convert the user-provided monthly flow rate (in Ether) to Wei.
  const monthlyAmountInWei = ethers.utils.parseEther(addedForms[0].flowRate.toString());

  // Calculate the per-second flow rate based on the monthly amount.
  const perSecondFlowRate = monthlyAmountInWei.div(ethers.BigNumber.from("2592000")); // 3600 * 24 * 30 = 2592000

  // Log the per-second flow rate.
  console.log(perSecondFlowRate.toString());
};

// Checks if input is valid Ethereum address
export const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Retrieves accepted tokens on given chain
export const filterTokens = (
  tokenList: SuperTokenInfo[], 
  acceptedTokens: string[], 
  acceptedChain: number
): SuperTokenInfo[] => {
  return tokenList.filter(token => 
    token.extensions?.superTokenInfo && 
    acceptedTokens.includes(token.symbol) && 
    token.chainId === acceptedChain
  );
};

// Returns address based on token symbol
export const getTokenSymbolByAddress = (address: string, tokenList: SuperTokenInfo[]): string => {
  const token = tokenList.find(t => t.address === address);
  return token ? token.symbol : address;  // Return address if token not found
};

// Formats address e.g. 0x0000...00000
export const formatAddress = (address: string) => {
  if (address.length < 8) return address;  // Check to ensure address has enough characters.
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
};

// Formats IPFS URI e.g. returns CID as Qxwca....00000
export const formatURI = (uri: string) => {
  const lastPart = uri.split('/').pop() || "";
  
  if (lastPart.length <= 8) return lastPart;
  
  return `${lastPart.slice(0, 5)}...${lastPart.slice(-5)}`;
};

// Formats IPFS URi e.g. returns CID that comes after /
export const formatURICID = (uri: string) => {
  const lastPart = uri.split('/').pop() || "";
  
  return lastPart;
};

// Clears fields
export const clearFields = (
  fields: (keyof FormData)[],
  functionToExecute: (field: keyof FormData, value: string) => void
) => {
  fields.forEach(field => functionToExecute(field, ''));
};

// Adds form to the Array
export const validateForm = <T extends {}>(formData: T): (keyof T)[] => {
  return Object.keys(formData)
    .filter(key => !formData[key as keyof T])
    .map(key => key as keyof T);
};

export const addToListAndReset = <T>(list: T[], item: T, initialItemState: T): T[] => {
  return [...list, item];
};

// Handles form input field change
export const createHandleFormChange = <T>(
  setForm: Dispatch<SetStateAction<T>>,
  setInvalidFields: Dispatch<SetStateAction<(keyof T)[]>>
) => {
  return (field: keyof T, value: any) => {
    setForm(prevState => ({
      ...prevState,
      [field]: value
    }));
    setInvalidFields(prevInvalidFields => prevInvalidFields.filter(item => item !== field));
  };
};

// Removes items from list
export const removeFromList = <T>(list: T[], index: number): T[] => {
  const updatedList = [...list];
  updatedList.splice(index, 1);
  return updatedList;
};