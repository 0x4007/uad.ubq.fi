import { JsonRpcProvider, JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import { useAccount, useSigner } from "wagmi";
import { WagmiConfig, createClient, chain } from "wagmi";
import { ConnectKitProvider, getDefaultClient } from "connectkit";
import { FC, useEffect, useState } from "react";
import { ChildrenShim } from "./children-shim";
// @ts-expect-error - no types
import { RPCHandler } from "@ubiquity-dao/rpc-handler";
import { useMemo } from "react";

const IS_DEV = process.env.NEXT_PUBLIC_NODE_ENV === "development";

export type PossibleProviders = Web3Provider | JsonRpcProvider | null;

export type Web3State = {
  metamaskInstalled: boolean;
  jsonRpcEnabled: boolean;
  providerMode: "none" | "metamask" | "jsonrpc";
  provider: PossibleProviders;
  connecting: boolean;
  walletAddress: null | string;
  signer?: JsonRpcSigner;
};

const metamaskInstalled = typeof window !== "undefined" ? !!window?.ethereum?.request : false;

const client = createClient(
  getDefaultClient({
    chains: [chain.mainnet, chain.hardhat, chain.localhost],
    autoConnect: true,
    appName: "Ubiquity",
  })
);

export const UseWeb3Provider: FC<ChildrenShim> = ({ children }) => {
  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider
        theme="midnight"
        customTheme={{
          "--ck-body-background": "#000",
          "--ck-border-radius": "8px",
        }}
      >
        {children}
      </ConnectKitProvider>
    </WagmiConfig>
  );
};

/**
 * Singleton class to handle the RPC provider
 * so that we supply one provider across the app
 */
class Handler {
  provider_: JsonRpcProvider | null;
  handler_: RPCHandler | null;
  initializing_: Promise<void> | null;
  static instance: Handler | null = null;
  constructor() {
    this.provider_ = null;
    this.handler_ = new RPCHandler({
      networkId: IS_DEV ? 31337 : 1,
      autoStorage: true,
      cacheRefreshCycles: 10,
      rpcTimeout: 1500,
      networkName: null,
      runtimeRpcs: null,
      networkRpcs: null,
    });
    this.initializing_ = null;
    this.provider_ = null;
  }

  static getInstance(): Handler {
    if (!Handler.instance) {
      Handler.instance = new Handler();
    }
    return Handler.instance;
  }

  async init() {
    if (!this.provider_ && !this.initializing_) {
      this.initializing_ = (async () => {
        const provider = await this.handler_.getFastestRpcProvider();
        this.provider_ = provider;
        this.initializing_ = null;
      })();
    }
    if (this.initializing_) {
      await this.initializing_;
    }

    return this.provider_;
  }

  get provider() {
    if (!this.provider_) {
      this.init();
    }
    return this.provider_;
  }

  set provider(provider: JsonRpcProvider | null) {
    this.provider_ = provider;
  }

  get handler() {
    return this.handler_;
  }

  set handler(handler: RPCHandler | null) {
    this.handler_ = handler;
  }
}

const useHandlerFastestRpc = () => {
  const [provider, setProvider] = useState<JsonRpcProvider | null>(null);

  useEffect(() => {
    const handlerInstance = Handler.getInstance();
    handlerInstance.init().then(() => {
      setProvider(handlerInstance.provider);
    });
  }, []);

  return useMemo(() => ({ provider }), [provider]);
};

const useWeb3 = (): [Web3State] => {
  const { isConnecting, address } = useAccount();
  const { data: signer } = useSigner();
  const { provider } = useHandlerFastestRpc();

  const web3State = useMemo(() => {
    return {
      metamaskInstalled,
      jsonRpcEnabled: IS_DEV,
      providerMode: "none" as "none" | "metamask" | "jsonrpc",
      provider: provider,
      connecting: isConnecting,
      walletAddress: address as string,
      signer: signer as JsonRpcSigner,
    };
  }, [provider, signer, address, isConnecting]);

  return [web3State];
};

export default useWeb3;
