import { BigNumber } from "ethers";
import { useState } from "react";

import { ensureERC20Allowance } from "src/pages/components/lib/contracts-shortcuts";
import { safeParseEther } from "src/pages/components/lib/utils";
import { PositiveNumberInput, Button } from "src/pages/components/ui";
import { useBalances, useDeployedContracts, useManagerManaged, useSigner, useTransactionLogger, useWalletAddress } from "src/pages/components/lib/hooks";
import { ERC20 } from "src/contracts/dollar/artifacts/types";

const UarRedeem = () => {
    const [walletAddress] = useWalletAddress();
    const signer = useSigner();
    const [balances, refreshBalances] = useBalances();
    const [, doTransaction, doingTransaction] = useTransactionLogger();
    const deployedContracts = useDeployedContracts();
    const managedContracts = useManagerManaged();

    const [inputVal, setInputVal] = useState("");

    if (!walletAddress || !signer) {
        return <span>Connnect wallet</span>;
    }

    if (!managedContracts || !deployedContracts || !balances) {
        return <span>Loading...</span>;
    }

    const redeemUarForUad = async (amount: BigNumber) => {
        const { debtCouponManager } = deployedContracts;
        await ensureERC20Allowance("uCR -> DebtCouponManager", managedContracts.uar as unknown as ERC20, amount, signer, debtCouponManager.address);
        await (await debtCouponManager.connect(signer).burnAutoRedeemTokensForDollars(amount)).wait();
        refreshBalances();
    };

    const handleRedeem = () => {
        const amount = extractValidAmount();
        if (amount) {
            doTransaction("Redeeming uCR...", async () => {
                setInputVal("");
                await redeemUarForUad(amount);
            });
        }
    };

    const extractValidAmount = (val: string = inputVal): null | BigNumber => {
        const amount = safeParseEther(val);
        return amount && amount.gt(BigNumber.from(0)) && amount.lte(balances.ucr) ? amount : null;
    };

    const submitEnabled = !!(extractValidAmount() && !doingTransaction);

    return (
        <div className="grid gap-4">
            <PositiveNumberInput placeholder="uCR Amount" value={inputVal} onChange={setInputVal} />
            <Button onClick={handleRedeem} disabled={!submitEnabled}>
                Redeem uCR for uAD
            </Button>
        </div>
    );
};

export default UarRedeem;
