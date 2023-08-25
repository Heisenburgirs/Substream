import { ethers } from 'ethers';
import { useEthers } from '../context/EthersContext';
import { FormData, UpdateFormData } from '../../utils/helpers'

export const handleInitializing = async (address: string, discordServerIds: string[]): Promise<any> => {
  try {
    const ethereumProvider = (window as any).ethereum;
    if (!ethereumProvider) {
      console.error("Ethereum provider not detected");
      return;
    }

    const provider = new ethers.providers.Web3Provider(ethereumProvider);
    const signer = provider.getSigner();

    const message = "Please sign this message to confirm your identity and server ownership.";
    const signature = await signer.signMessage(message);

    const extractedServerIds = discordServerIds;
    //console.log(extractedServerIds);

    // Send request to API to whitelist user
    const response = await fetch("/api/whitelist/whitelist", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ address, extractedServerIds })
    });

    const responseData = await response.json();

    if (!response.ok) {
        console.log("error", responseData.error)
        throw new Error(responseData.error);
    }
    return responseData;
  } catch (error) {
    // Handle errors
    throw error;
  }
};

export const handleInitializingUpdate = async (address: string, discordServerIds: string[]): Promise<any> => {
  try {
    const ethereumProvider = (window as any).ethereum;
    if (!ethereumProvider) {
      console.error("Ethereum provider not detected");
      return;
    }

    const provider = new ethers.providers.Web3Provider(ethereumProvider);
    const signer = provider.getSigner();

    const message = "Please sign this message to confirm your identity and server ownership.";
    const signature = await signer.signMessage(message);

    const extractedServerIds = discordServerIds;
    //console.log(extractedServerIds);

    // Send request to API to whitelist user
    const response = await fetch("/api/whitelist/whitelistUpdate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ address, extractedServerIds })
    });

    const responseData = await response.json();

    if (!response.ok) {
        console.log("error", responseData.error)
        throw new Error(responseData.error);
    }
    return responseData;
  } catch (error) {
    // Handle errors
    throw error;
  }
};

// Create or Add payment option(s) for given Discord Server ID
export const CreateOrAddPaymentOptions = async (
  addedForms: FormData[],
  provider: ethers.providers.Web3Provider | undefined,
  contract: ethers.Contract | undefined,
  setAwaitVisible: (visible: boolean) => void
): Promise<{ success?: string, error?: string }> => {

	try {
		if (!addedForms || addedForms.length === 0) {
			return { error: 'No forms have been added.' };
		}

		const gasPrice = await provider?.getGasPrice();
		// console.log(gasPrice)

		addedForms.sort((a, b) => parseInt(a.flowRate) - parseInt(b.flowRate));
		// console.log(addedForms)

		const incomingFlowTokens = addedForms.map(form => form.incomingToken);
		const requiredFlowRates = addedForms.map(form => parseInt(form.flowRate));
		const discordServerIds = addedForms.map(form => form.discordServerId);
		const finalRecipients = addedForms.map(form => form.finalRecipient);
		const uris = addedForms.map(form => form.uri);

		const createPaymentOptions = await contract?.createOrAddPaymentOptions(
			incomingFlowTokens,
			requiredFlowRates,
			discordServerIds[0],
			finalRecipients[0],
			uris, 
			{ gasPrice }
		);
		console.log(createPaymentOptions)

		setAwaitVisible(true);

		const result = await createPaymentOptions?.wait(); // Wait for the transaction to be mined
		console.log(result)

		if (result && result.status === 1) {
			return { success: "Transaction successfully mined!" };
		} else {
			return { error: 'Transaction failed.' };
		}
	} catch (error) {
		console.error("Error waiting for transaction:", error);
		return ({ error: `Error waiting for transaction: ${error}` });
	}
}

export const updatePaymentOptions = async (
  updatedForms: UpdateFormData[],
  provider: ethers.providers.Web3Provider | undefined,
  contract: ethers.Contract | undefined,
  setAwaitVisible: (visible: boolean) => void
): Promise<{ success?: string, error?: string }> => {
  try {
    if (!updatedForms || updatedForms.length === 0) {
      return { error: 'No forms have been updated.' };
    }

    const gasPrice = await provider?.getGasPrice();

    updatedForms.sort((a, b) => parseInt(a.requiredFlowRate) - parseInt(b.requiredFlowRate));
		//console.log("UPDATED FORMS", updatedForms)

    const discordServerId = updatedForms.map(data => data.discordServerId);
    const index = updatedForms.map(data => data.index);
    const incomingFlowTokens = updatedForms.map(data => data.incomingToken);
    const requiredFlowRates = updatedForms.map(data => parseInt(data.requiredFlowRate));
    const finalRecipients = updatedForms.map(data => data.finalRecipient);
    const uris = updatedForms.map(data => data.uri);

		//console.log("INCOMING", incomingFlowTokens)
		//console.log("MAPPING", updatedForms.map(data => data.incomingToken))

    const updateResponse = await contract?.updatePaymentOptions(
      discordServerId[0],
      index,
      incomingFlowTokens,
      finalRecipients[0],
      requiredFlowRates,
      uris, 
      { gasPrice }
    );

		//console.log("UPDATED FORMS", updatedForms)
    setAwaitVisible(true);

    const result = await updateResponse?.wait(); 

    if (result && result.status === 1) {
      return { success: "Transaction successfully mined!" };
    } else {
      return { error: 'Transaction failed.' };
    }
  } catch (error) {
    console.error("Error waiting for transaction:", error);
    return { error: `Error waiting for transaction: ${error}` };
  }
}

export const deletePaymentOptions = async (
  discordServerId: string,
  indexes: number[],
  contract: ethers.Contract | undefined,
  provider: ethers.providers.Web3Provider | undefined,
  setAwaitVisible: (visible: boolean) => void
): Promise<{ success?: string, error?: string }> => {
  
  try {
    if (!indexes || indexes.length === 0) {
      return { error: 'No payment options selected for deletion.' };
    }

    const gasPrice = await provider?.getGasPrice();

    const deleteOptionsTx = await contract?.removePaymentOptions(
      discordServerId,
      indexes,
      { gasPrice }
    );
    
    setAwaitVisible(true);

    const result = await deleteOptionsTx?.wait();

    if (result && result.status === 1) {
      return { success: "Payment options successfully removed!" };
    } else {
      return { error: 'Removal failed.' };
    }
  } catch (error) {
    console.error("Error removing payment options:", error);
    return ({ error: `Error removing payment options: ${error}` });
  }
}
