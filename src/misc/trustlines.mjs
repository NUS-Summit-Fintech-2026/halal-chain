import xrpl from "xrpl";

const XRPL_RPC_URL = "wss://s.altnet.rippletest.net:51233";

// Your investor seeds
const INVESTOR_A_SEED = "sEd7rZMw5Azd4o8GcySJkmYDwffHhcp";
const INVESTOR_B_SEED = "sEd7amH3B19dqYLTYhpUMH3wx97vNcn";

// Official RLUSD Testnet issuer (Ripple docs)
const RLUSD_TESTNET_ISSUER = "rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV";

// RLUSD is 5 letters, so must be 160-bit hex on XRPL
// "RLUSD" => 524C555344000000000000000000000000000000
const RLUSD_CURRENCY_HEX = "524C555344000000000000000000000000000000";

const TRUST_LIMIT_RLUSD = "1000000";

function memoJSON(obj) {
  const json = JSON.stringify(obj);
  const hex = Buffer.from(json, "utf8").toString("hex").toUpperCase();
  return [{ Memo: { MemoData: hex } }];
}

async function submitAndWait(client, tx, wallet) {
  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);
  const code = result.result.meta?.TransactionResult;
  if (code !== "tesSUCCESS") throw new Error(`Tx failed: ${code}`);
  return result.result.hash;
}

async function ensureTrustLine(client, holderWallet, currency, issuerAddress, limit) {
  const lines = await client.request({
    command: "account_lines",
    account: holderWallet.address,
    ledger_index: "validated",
  });

  const exists = (lines.result.lines || []).some(
    (l) => l.currency === currency && l.account === issuerAddress
  );

  if (exists) {
    console.log(`✅ Trust line already exists for ${holderWallet.address}`);
    return;
  }

  const tx = {
    TransactionType: "TrustSet",
    Account: holderWallet.address,
    LimitAmount: { currency, issuer: issuerAddress, value: String(limit) },
    Memos: memoJSON({
      type: "TRUSTSET_RLUSD_OFFICIAL",
      currency,
      issuer: issuerAddress,
      ts: Date.now(),
    }),
  };

  const hash = await submitAndWait(client, tx, holderWallet);
  console.log(`🧾 TrustSet OK for ${holderWallet.address} | hash=${hash}`);
}

async function printRLUSDLine(client, address, label) {
  const lines = await client.request({ command: "account_lines", account: address });
  const match = (lines.result.lines || []).find(
    (l) => l.currency === RLUSD_CURRENCY_HEX && l.account === RLUSD_TESTNET_ISSUER
  );

  console.log(`\n=== ${label} RLUSD Trust Line ===`);
  if (!match) {
    console.log("Not found (yet).");
  } else {
    console.log(`issuer=${match.account}`);
    console.log(`currency=${match.currency}`);
    console.log(`balance=${match.balance}`);
    console.log(`limit=${match.limit}`);
  }
}

async function main() {
  const client = new xrpl.Client(XRPL_RPC_URL);
  await client.connect();
  console.log("✅ Connected:", XRPL_RPC_URL);

  const investorA = xrpl.Wallet.fromSeed(INVESTOR_A_SEED);
  const investorB = xrpl.Wallet.fromSeed(INVESTOR_B_SEED);

  console.log("\nInvestor A:", investorA.address);
  console.log("Investor B:", investorB.address);
  console.log("\nOfficial RLUSD Testnet Issuer:", RLUSD_TESTNET_ISSUER);
  console.log("RLUSD currency hex:", RLUSD_CURRENCY_HEX);

  await ensureTrustLine(client, investorA, RLUSD_CURRENCY_HEX, RLUSD_TESTNET_ISSUER, TRUST_LIMIT_RLUSD);
  await ensureTrustLine(client, investorB, RLUSD_CURRENCY_HEX, RLUSD_TESTNET_ISSUER, TRUST_LIMIT_RLUSD);

  await printRLUSDLine(client, investorA.address, "INVESTOR_A");
  await printRLUSDLine(client, investorB.address, "INVESTOR_B");

  await client.disconnect();
  console.log("\n✅ Step 2B complete: trust lines are set. Now claim RLUSD from tryrlusd.com.");
}

main().catch((e) => {
  console.error("❌ Error:", e.message || e);
  process.exit(1);
});
