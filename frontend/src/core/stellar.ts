/* eslint-disable */
import {
  rpc,
  Address,
  scValToNative,
  nativeToScVal,
  TransactionBuilder,
  Networks as StellarNetworks,
  Operation,
  Transaction,
  Account,
  Keypair,
} from '@stellar/stellar-sdk';

const networkPassphrase = StellarNetworks.TESTNET;
const rpcUrl = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org:443';
export const fvtContractAddress = process.env.NEXT_PUBLIC_FVT_CONTRACT_ADDRESS || '';
export const vestingFlowContractAddress = process.env.NEXT_PUBLIC_VESTING_FLOW_CONTRACT_ADDRESS || '';

export const server = new rpc.Server(rpcUrl);

let initialized = false;
let kitModule: any = null;

async function getWalletKitModule() {
  if (typeof window === 'undefined') return null;
  if (!kitModule) {
    try {
      const kit = await import('@creit.tech/stellar-wallets-kit');
      const utils = await import('@creit.tech/stellar-wallets-kit/modules/utils');
      const types = await import('@creit.tech/stellar-wallets-kit/types');
      kitModule = {
        StellarWalletsKit: kit.StellarWalletsKit,
        defaultModules: utils.defaultModules,
        Networks: types.Networks,
      };
    } catch (err) {
      console.error('Failed to dynamically load stellar-wallets-kit:', err);
    }
  }
  return kitModule;
}

export async function initKit() {
  if (typeof window === 'undefined') return;
  if (!initialized) {
    const mod = await getWalletKitModule();
    if (mod) {
      mod.StellarWalletsKit.init({
        modules: mod.defaultModules(),
        network: mod.Networks.TESTNET,
      });
      initialized = true;
    }
  }
}

export async function connectWallet(): Promise<string> {
  await initKit();
  const mod = await getWalletKitModule();
  if (!mod) throw new Error('Wallet kit not available on server');
  try {
    const { address } = await mod.StellarWalletsKit.authModal();
    return address;
  } catch (error) {
    console.error('Wallet connection rejected or closed:', error);
    throw error;
  }
}

export async function getConnectedAddress(): Promise<string> {
  await initKit();
  const mod = await getWalletKitModule();
  if (!mod) return '';
  try {
    const { address } = await mod.StellarWalletsKit.getAddress();
    return address;
  } catch {
    return '';
  }
}

export async function disconnectWallet(): Promise<void> {
  await initKit();
  const mod = await getWalletKitModule();
  if (!mod) return;
  try {
    await mod.StellarWalletsKit.disconnect();
  } catch (error) {
    console.error('Disconnect error:', error);
  }
}

export async function getTokenBalance(userAddress: string): Promise<number> {
  if (!userAddress || !fvtContractAddress) return 0;
  try {
    const operation = Operation.invokeContractFunction({
      contract: fvtContractAddress,
      function: 'balance',
      args: [new Address(userAddress).toScVal()],
    });

    const tx = new TransactionBuilder(
      new Account(userAddress, '0'),
      { networkPassphrase, fee: '100' }
    )
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      const balanceVal = scValToNative(sim.result.retval);
      return Number(balanceVal) / 10000000;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return 0;
  }
}

export interface VestingFlowInfo {
  id: number;
  depositor: string;
  beneficiary: string;
  principal: number;
  commencement: number;
  vestingPeriod: number;
  claimedAmount: number;
  asset: string;
}

export async function getVestingFlowDetails(flowId: number): Promise<VestingFlowInfo | null> {
  if (!vestingFlowContractAddress) return null;
  try {
    const dummyAccount = 'GAVAX3CT3G2XGKNXLMAP6R6IGRVQJHP6CBVOKNJVEWXONO2ZPQYPBXCM';
    const operation = Operation.invokeContractFunction({
      contract: vestingFlowContractAddress,
      function: 'get_vesting_details',
      args: [nativeToScVal(BigInt(flowId), { type: 'u64' })],
    });

    const tx = new TransactionBuilder(
      new Account(dummyAccount, '0'),
      { networkPassphrase, fee: '100' }
    )
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      const nativeObj = scValToNative(sim.result.retval);
      return {
        id: flowId,
        depositor: nativeObj.depositor,
        beneficiary: nativeObj.beneficiary,
        principal: Number(nativeObj.principal) / 10000000,
        commencement: Number(nativeObj.commencement),
        vestingPeriod: Number(nativeObj.vesting_period),
        claimedAmount: Number(nativeObj.claimed_amount) / 10000000,
        asset: nativeObj.asset,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching flow details for id ${flowId}:`, error);
    return null;
  }
}

export async function getUnlockedBalance(flowId: number): Promise<number> {
  if (!vestingFlowContractAddress) return 0;
  try {
    const dummyAccount = 'GAVAX3CT3G2XGKNXLMAP6R6IGRVQJHP6CBVOKNJVEWXONO2ZPQYPBXCM';
    const operation = Operation.invokeContractFunction({
      contract: vestingFlowContractAddress,
      function: 'unlocked_balance',
      args: [nativeToScVal(BigInt(flowId), { type: 'u64' })],
    });

    const tx = new TransactionBuilder(
      new Account(dummyAccount, '0'),
      { networkPassphrase, fee: '100' }
    )
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      return Number(scValToNative(sim.result.retval)) / 10000000;
    }
    return 0;
  } catch (error) {
    console.error(`Error fetching unlocked balance for id ${flowId}:`, error);
    return 0;
  }
}

export async function fetchUserFlows(userAddress: string): Promise<number[]> {
  if (!userAddress || !vestingFlowContractAddress) return [];
  try {
    const operation = Operation.invokeContractFunction({
      contract: vestingFlowContractAddress,
      function: 'fetch_user_flows',
      args: [new Address(userAddress).toScVal()],
    });

    const tx = new TransactionBuilder(
      new Account(userAddress, '0'),
      { networkPassphrase, fee: '100' }
    )
      .addOperation(operation)
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      const list = scValToNative(sim.result.retval);
      if (Array.isArray(list)) {
        return list.map(item => Number(item));
      }
    }
    return [];
  } catch (error) {
    console.error('Error fetching user flows:', error);
    return [];
  }
}

async function prepareAndSubmitTx(
  userAddress: string,
  operation: any
): Promise<string> {
  await initKit();
  const mod = await getWalletKitModule();
  if (!mod) throw new Error('Wallet kit not available');

  const sourceAccount = await server.getAccount(userAddress);
  let tx = new TransactionBuilder(sourceAccount, {
    networkPassphrase,
    fee: '100',
  })
    .addOperation(operation)
    .setTimeout(60)
    .build();

  tx = await server.prepareTransaction(tx);

  const { signedTxXdr } = await mod.StellarWalletsKit.signTransaction(tx.toXDR(), {
    networkPassphrase,
    address: userAddress,
  });

  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase) as Transaction;
  const submitResult = await server.sendTransaction(signedTx);

  if (submitResult.status === 'ERROR') {
    throw new Error((submitResult as any).errorResultXdr || (submitResult as any).errorResult?.result?.switch?.name || 'Transaction rejected by network');
  }

  let status: any = submitResult.status;
  const txHash = submitResult.hash;

  while (status === 'PENDING') {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const txStatus = await server.getTransaction(txHash);
    status = txStatus.status;
    if (status === 'SUCCESS') {
      return txHash;
    }
    if (status === 'FAILED') {
      throw new Error('Transaction execution failed on chain');
    }
  }

  return txHash;
}

export async function initiateVesting(
  depositor: string,
  beneficiary: string,
  principal: number,
  vestingPeriod: number
): Promise<string> {
  const operation = Operation.invokeContractFunction({
    contract: vestingFlowContractAddress,
    function: 'initiate_vesting',
    args: [
      new Address(depositor).toScVal(),
      new Address(beneficiary).toScVal(),
      new Address(fvtContractAddress).toScVal(),
      nativeToScVal(BigInt(Math.floor(principal * 10000000)), { type: 'i128' }),
      nativeToScVal(BigInt(vestingPeriod), { type: 'u64' }),
    ],
  });

  return prepareAndSubmitTx(depositor, operation);
}

export async function claimUnlockedFlow(
  beneficiary: string,
  flowId: number
): Promise<string> {
  const operation = Operation.invokeContractFunction({
    contract: vestingFlowContractAddress,
    function: 'claim_unlocked',
    args: [nativeToScVal(BigInt(flowId), { type: 'u64' })],
  });

  return prepareAndSubmitTx(beneficiary, operation);
}

export async function revokeVestingFlow(
  depositor: string,
  flowId: number
): Promise<string> {
  const operation = Operation.invokeContractFunction({
    contract: vestingFlowContractAddress,
    function: 'revoke_vesting',
    args: [nativeToScVal(BigInt(flowId), { type: 'u64' })],
  });

  return prepareAndSubmitTx(depositor, operation);
}

export async function addTokenToWallet(): Promise<void> {
  if (typeof window === 'undefined') return;
  const { addToken, getNetwork } = await import('@stellar/freighter-api');
  
  // Pre-validate that Freighter wallet network is set to Testnet
  const networkDetails = await getNetwork();
  if (networkDetails.network !== 'TESTNET') {
    throw new Error('Freighter network is not set to TESTNET. Please set your Freighter wallet network to Testnet first.');
  }

  await addToken({
    contractId: fvtContractAddress,
    networkPassphrase: networkPassphrase,
  });
}

export async function mintTokens(recipient: string, amount: number): Promise<string> {
  const adminSecret = process.env.NEXT_PUBLIC_DEPLOYER_SECRET || 'SACHTEYLV64OD2RPCVQ2VIKKGMFVJ7S5UY45TV23DZKXYPG5CCGYPOP4';
  const adminKeypair = Keypair.fromSecret(adminSecret);
  const adminAddress = adminKeypair.publicKey();

  const operation = Operation.invokeContractFunction({
    contract: fvtContractAddress,
    function: 'mint',
    args: [
      new Address(recipient).toScVal(),
      nativeToScVal(BigInt(Math.floor(amount * 10000000)), { type: 'i128' }),
    ],
  });

  const sourceAccount = await server.getAccount(adminAddress);
  let tx = new TransactionBuilder(sourceAccount, {
    networkPassphrase,
    fee: '500',
  })
    .addOperation(operation)
    .setTimeout(60)
    .build();

  tx = await server.prepareTransaction(tx);
  tx.sign(adminKeypair);

  const submitResult = await server.sendTransaction(tx);
  if (submitResult.status === 'ERROR') {
    throw new Error((submitResult as any).errorResultXdr || 'Mint transaction failed');
  }

  let status: any = submitResult.status;
  const txHash = submitResult.hash;

  while (status === 'PENDING') {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const txStatus = await server.getTransaction(txHash);
    status = txStatus.status;
    if (status === 'SUCCESS') {
      return txHash;
    }
    if (status === 'FAILED') {
      throw new Error('Minting failed on chain');
    }
  }

  return txHash;
}
