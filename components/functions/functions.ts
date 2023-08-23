import { ethers } from 'ethers';
import { useEthers } from '../context/EthersContext';
import { FormData } from '../../utils/helpers'

// Create or Add payment option(s) for given Discord Server ID
export const CreateOrAddPaymentOptions = async (addedForms: FormData[]): Promise<{ success?: string, error?: string }> => { 
    const { provider, contract } = useEthers();

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
      // console.log(createPaymentOptions)
  
      const result = await createPaymentOptions?.wait(); // Wait for the transaction to be mined
			// console.log(result)

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