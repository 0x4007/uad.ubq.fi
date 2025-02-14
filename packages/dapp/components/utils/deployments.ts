import ContractDeployments from "@ubiquity/contracts/deployments.json";

const _contractDeployments = (): Record<
  string,
  {
    contracts: Record<string, { address: string; abi: unknown }>;
  }
> => {
  return ContractDeployments;
};

export const getDeployments = (chainId: number, contractName: string): { address: string; abi: unknown } | undefined => {
  const record = _contractDeployments()[chainId.toString()] ?? {};
  const contractInstance = record?.contracts ? record?.contracts[contractName] : undefined;
  return contractInstance ? { address: contractInstance.address, abi: contractInstance.abi } : undefined;
};
