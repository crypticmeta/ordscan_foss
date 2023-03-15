import { format } from "date-fns";
import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import { processSellerPsbt } from "./Ordinals/buyOrdinal";

let sellerSignedPsbt;
bitcoin.initEccLib(secp256k1);
const varuint = require("bip174/src/lib/converter/varint");
export function witnessStackToScriptWitness(witness) {
  let buffer = Buffer.allocUnsafe(0);
  function writeSlice(slice) {
    buffer = Buffer.concat([buffer, Buffer.from(slice)]);
  }
  function writeVarInt(i) {
    const currentLen = buffer.length;
    const varintLen = varuint.encodingLength(i);
    buffer = Buffer.concat([buffer, Buffer.allocUnsafe(varintLen)]);
    varuint.encode(i, buffer, currentLen);
  }
  function writeVarSlice(slice) {
    writeVarInt(slice.length);
    writeSlice(slice);
  }
  function writeVector(vector) {
    writeVarInt(vector.length);
    vector.forEach(writeVarSlice);
  }
  writeVector(witness);
  return buffer;
}

interface Result {
  status: string;
  message: string;
  data: any;
}
const bitcoinPriceApiUrl = "https://blockchain.info/ticker?cors=true";
const baseMempoolUrl = true
  ? "https://mempool.space"
  : "https://mempool.space/signet";
const baseMempoolApiUrl = `${baseMempoolUrl}/api`;
const ordinalsExplorerUrl = process.env.NEXT_PUBLIC_PROVIDER;
let price = 0;
let dummyUtxoValue = 1_000;
let paymentUtxos;
const numberOfDummyUtxosToCreate = 1;
const feeLevel = "hourFee";
// Concatenates classes into a single className string
const cn = (...args: string[]) => args.join(" ");

const formatDate = (date: string) =>
  format(new Date(date), "MM/dd/yyyy h:mm:ss");

/**
 * Formats number as currency string.
 *
 * @param number Number to format.
 */
const numberToCurrencyString = (number: number) =>
  number.toLocaleString("en-US");

/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * (x * 255).clamp(0, 255)
 *
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
const clamp = (current, min, max) => Math.min(Math.max(current, min), max);

export const updateBuyerAddress = async (
  buyerAddr: string,
  price: number,
  output: string,
  number: string,
  inscriptionOutputValue: number,
  signedPSBT: string
): Promise<Result> => {
  await processSellerPsbt({ output, signedPsbt: signedPSBT });
  const payerAddress = buyerAddr;
  localStorage.setItem("payerAddress", payerAddress);
  let payerUtxos;
  let psbt;

  try {
    payerUtxos = await getAddressUtxos(payerAddress);
  } catch (e) {
    console.error(e, " Invalid buyer address error");
    return { status: "error", message: "Invalid Address", data: {} };
    //  document.getElementById("payerAddress").classList.add("is-invalid");
    //  hideDummyUtxoElements();
    //  return console.error(e);
  } finally {
    //show loading utxos status
  }

  //  document.getElementById("payerAddress").classList.remove("is-invalid");

  const potentialDummyUtxos = payerUtxos.filter(
    (utxo) => utxo.value <= dummyUtxoValue
  );
  let dummyUtxo = undefined;

  for (const potentialDummyUtxo of potentialDummyUtxos) {
    if (!(await doesUtxoContainInscription(potentialDummyUtxo))) {
      //  hideDummyUtxoElements();
      console.error("utxo doesnt contain inscription");
      dummyUtxo = potentialDummyUtxo;
      break;
    }
  }

  let minimumValueRequired;
  let vins;
  let vouts;

  if (!dummyUtxo) {
    //  showDummyUtxoElements();

    minimumValueRequired = numberOfDummyUtxosToCreate * dummyUtxoValue;
    vins = 0;
    vouts = numberOfDummyUtxosToCreate;
  } else {
    // hideDummyUtxoElements();
    minimumValueRequired = price + numberOfDummyUtxosToCreate * dummyUtxoValue;
    vins = 1;
    vouts = 2 + numberOfDummyUtxosToCreate;
  }

  try {
    paymentUtxos = await selectUtxos(
      payerUtxos,
      minimumValueRequired,
      vins,
      vouts,
      await recommendedFeeRate()
    );
    if (!dummyUtxo) {
      psbt = await generatePSBTGeneratingDummyUtxos(
        payerAddress,
        numberOfDummyUtxosToCreate,
        paymentUtxos
      );
      return {
        status: "success",
        message: "Generated PSBT for creating dummy utxo Successfully",
        data: { psbt, for: "utxo" },
      };
    } else {
      const receiverAddress = payerAddress;
      psbt = await generatePSBTBuyingInscriptionOld(
        payerAddress,
        receiverAddress,
        btcToSat(price),
        paymentUtxos,
        dummyUtxo,
        inscriptionOutputValue
      );
      return {
        status: "success",
        message: "Generated PSBT for buying inscription Successfully",
        data: { psbt, for: "buying" },
      };
    }
  } catch (e) {
    paymentUtxos = undefined;
    console.error(e, "error generating psbt");
    return { status: "error", message: e?.message || e, data: {} };
    // document.getElementById("payerAddress").classList.add("is-invalid");
    // return alert(e);
  }
};
const generatePSBTBuyingInscriptionOld = async (
  payerAddress,
  receiverAddress,
  price,
  paymentUtxos,
  dummyUtxo,
  inscriptionOutputValue
) => {
  const psbt = new bitcoin.Psbt({ network: undefined });
  let totalValue = 0;
  let totalPaymentValue = 0;

  // Add dummy utxo input
  const tx = bitcoin.Transaction.fromHex(await getTxHexById(dummyUtxo.txid));
  for (const output in tx.outs) {
    try {
      tx.setWitness(Number(output), []);
    } catch {}
  }
  psbt.addInput({
    hash: dummyUtxo.txid,
    index: dummyUtxo.vout,
    nonWitnessUtxo: tx.toBuffer(),
    // witnessUtxo: tx.outs[dummyUtxo.vout],
  });

  // Add inscription output
  psbt.addOutput({
    address: receiverAddress,
    value: dummyUtxo.value + inscriptionOutputValue,
  });

  // Add payer signed input
  psbt.addInput({
    ...sellerSignedPsbt.data.globalMap.unsignedTx.tx.ins[0],
    ...sellerSignedPsbt.data.inputs[0],
  });

  // Add payer output
  psbt.addOutput({
    ...sellerSignedPsbt.data.globalMap.unsignedTx.tx.outs[0],
  });

  // Add payment utxo inputs
  for (const utxo of paymentUtxos) {
    const tx = bitcoin.Transaction.fromHex(await getTxHexById(utxo.txid));
    for (const output in tx.outs) {
      try {
        tx.setWitness(Number(output), []);
      } catch {}
    }

    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: tx.toBuffer(),
      // witnessUtxo: tx.outs[utxo.vout],
    });

    totalValue += utxo.value;
    totalPaymentValue += utxo.value;
  }

  // Create a new dummy utxo output for the next purchase
  psbt.addOutput({
    address: payerAddress,
    value: dummyUtxoValue,
  });

  const fee = calculateFee(
    psbt.txInputs.length,
    psbt.txOutputs.length,
    await recommendedFeeRate()
  );

  const changeValue = totalValue - dummyUtxo.value - price - fee;
  if (changeValue < 0) {
    throw `Your wallet address doesn't have enough funds to buy this inscription.
Price:          ${satToBtc(price)} BTC
Fees:       ${satToBtc(fee + dummyUtxoValue)} BTC
You have:   ${satToBtc(totalPaymentValue)} BTC
Required:   ${satToBtc(totalValue - changeValue)} BTC
Missing:     ${satToBtc(-changeValue)} BTC`;
  }
  // Change utxo
  psbt.addOutput({
    address: payerAddress,
    value: changeValue,
  });
  return psbt.toBase64();
};
async function doesUtxoContainInscription(utxo) {
  const html = await fetch(
    `${ordinalsExplorerUrl}/output/${utxo.txid}:${utxo.vout}`
  ).then((response) => response.text());

  return html.match(/class=thumbnails/) !== null;
}
export async function getAddressMempoolTxIds(address) {
  return await fetch(`${baseMempoolApiUrl}/address/${address}/txs/mempool`)
    .then((response) => response.json())
    .then((txs) => txs.map((tx) => tx.txid));
}
export async function getAddressUtxos(address) {
  return await fetch(`${baseMempoolApiUrl}/address/${address}/utxo`).then(
    (response) => response.json()
  );
}
export async function selectUtxos(
  utxos,
  amount,
  vins,
  vouts,
  recommendedFeeRate
) {
  const selectedUtxos = [];
  let selectedAmount = 0;

  // Sort descending by value, and filter out dummy utxos
  utxos = utxos
    .filter((x) => x.value > dummyUtxoValue)
    .sort((a, b) => b.value - a.value);

  for (const utxo of utxos) {
    // Never spend a utxo that contains an inscription for cardinal purposes
    if (await doesUtxoContainInscription(utxo)) {
      continue;
    }
    selectedUtxos.push(utxo);
    selectedAmount += utxo.value;

    if (
      selectedAmount >=
      amount +
        dummyUtxoValue +
        calculateFee(vins + selectedUtxos.length, vouts, recommendedFeeRate)
    ) {
      break;
    }
  }

  if (selectedAmount < amount) {
//     throw new Error(`Not enough cardinal spendable funds.
// Address has:  ${satToBtc(selectedAmount)} BTC
// Needed:  ${satToBtc(amount)} BTC`);
    
    return {
      status: "error",
      message: `Address has ${satToBtc(selectedAmount)} BTC Needs ${satToBtc(
        amount
      )} BTC`,
    };
  }

  return selectedUtxos;
  async function doesUtxoContainInscription(utxo) {
    const html = await fetch(
      `${ordinalsExplorerUrl}/output/${utxo.txid}:${utxo.vout}`
    ).then((response) => response.text());

    return html.match(/class=thumbnails/) !== null;
  }
}
const generatePSBTGeneratingDummyUtxos = async (
  payerAddress,
  numberOfDummyUtxosToCreate,
  payerUtxos
) => {
  const psbt = new bitcoin.Psbt({ network: undefined });

  let totalValue = 0;
  for (const utxo of payerUtxos) {
    const tx = bitcoin.Transaction.fromHex(await getTxHexById(utxo.txid));
    for (const output in tx.outs) {
      try {
        tx.setWitness(Number(output), []);
      } catch {}
    }
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: tx.toBuffer(),
      // witnessUtxo: tx.outs[utxo.vout],
    });

    totalValue += utxo.value;
  }

  for (let i = 0; i < numberOfDummyUtxosToCreate; i++) {
    psbt.addOutput({
      address: payerAddress,
      value: dummyUtxoValue,
    });
  }

  const fee = calculateFee(
    psbt.txInputs.length,
    psbt.txOutputs.length,
    await recommendedFeeRate()
  );

  // Change utxo
  psbt.addOutput({
    address: payerAddress,
    value: totalValue - numberOfDummyUtxosToCreate * dummyUtxoValue - fee,
  });

  return psbt.toBase64();
};
export function calculateFee(
  vins,
  vouts,
  recommendedFeeRate,
  includeChangeOutput = true
) {
  const baseTxSize = 10;
  const inSize = 180;
  const outSize = 34;

  //@ts-ignore
  const txSize =
    baseTxSize +
    vins * inSize +
    vouts * outSize +
    //@ts-ignore
    includeChangeOutput * outSize;
  const fee = txSize * recommendedFeeRate;

  return fee;
}
export function btcToSat(btc) {
  return Math.floor(Number(btc) * Math.pow(10, 8));
}

export function satToBtc(sat) {
  return Number(sat) / Math.pow(10, 8);
}

export const bitcoinPrice = fetch(bitcoinPriceApiUrl)
  .then((response) => response.json())
  .then((data) => data.USD?.last);
export { cn, formatDate, numberToCurrencyString, clamp };

function getHashQueryStringParam(paramName) {
  const params = new URLSearchParams(window.location.hash.substr(1));
  return params.get(paramName);
}

const txHexByIdCache = {};
export async function getTxHexById(txId) {
  if (!txHexByIdCache[txId]) {
    txHexByIdCache[txId] = await fetch(
      `${baseMempoolApiUrl}/tx/${txId}/hex`
    ).then((response) => response.text());
  }

  return txHexByIdCache[txId];
}
export const recommendedFeeRate = async () =>
  fetch(`${baseMempoolApiUrl}/v1/fees/recommended`)
    .then((response) => response.json())
    .then((data) => data[feeLevel]);

export async function getInscriptionDataById(
  inscriptionId: string,
  verifyIsInscriptionNumber?: any
) {
  const html = await fetch(
    ordinalsExplorerUrl + "/inscription/" + inscriptionId
  ).then((response) => response.text());

  const data: any = [...html.matchAll(/<dt>(.*?)<\/dt>\s*<dd.*?>(.*?)<\/dd>/gm)]
    .map((x) => {
      x[2] = x[2].replace(/<.*?>/gm, "");
      return x;
    })
    .reduce((a, b) => {
      return { ...a, [b[1]]: b[2] };
    }, {});

  const error = `Inscription ${
    verifyIsInscriptionNumber || inscriptionId
  } not found (maybe you're on signet and looking for a mainnet inscription or vice versa)`;
  try {
    data.number = html.match(/<h1>Inscription (\d*)<\/h1>/)[1];
  } catch {
    throw new Error(error);
  }
  if (
    verifyIsInscriptionNumber &&
    String(data.number) != String(verifyIsInscriptionNumber)
  ) {
    throw new Error(error);
  }

  return data;
}

export function validateSellerPSBTAndExtractPrice(
  sellerSignedPsbtBase64,
  utxo
) {
  try {
    sellerSignedPsbtBase64 = sellerSignedPsbtBase64.trim().replaceAll(" ", "+");
    sellerSignedPsbt = bitcoin.Psbt.fromBase64(sellerSignedPsbtBase64, {
      network: undefined,
    });
    const sellerInput = sellerSignedPsbt.txInputs[0];
    const sellerSignedPsbtInput = `${sellerInput.hash
      .reverse()
      .toString("hex")}:${sellerInput.index}`;

    if (sellerSignedPsbtInput != utxo) {
      // console.error(
      //   `Seller signed PSBT does not match this inscription\n\n${sellerSignedPsbtInput}\n!=\n${utxo}`
      // );
      return {
        error: `Seller signed PSBT does not match this inscription\n\n${sellerSignedPsbtInput}\n!=\n${utxo}`,
      };
    }
    if (
      sellerSignedPsbt.txInputs.length != 1 ||
      sellerSignedPsbt.txInputs.length != 1
    ) {
      return { error: "`Invalid seller signed PSBT`" };
    }

    try {
      sellerSignedPsbt.extractTransaction(true);
    } catch (e) {
      if (e.message == "Not finalized") {
        return { error: "PSBT not signed" };
      } else if (e.message != "Outputs are spending more than Inputs") {
        return { error: "Invalid PSBT " + e.message || e };
      }
    }

    const sellerOutput = sellerSignedPsbt.txOutputs[0];
    price = sellerOutput.value;

    return Number(price);
  } catch (e) {
    console.error(e, "error in validateSellerPSBTAndExtractPrice");
  }
}

export const nostrRelayUrl = "wss://nostr.openordex.org";
export const nostrOrderEventKind = 802;


export const addressHasTxInMempool = async(address) => {
  const payerCurrentMempoolTxIds = await getAddressMempoolTxIds(address);
  if (payerCurrentMempoolTxIds.length > 1)
    return true
  else
    return false
}

export const fetcher = (...args: any[]) => fetch(...args).then((res) => res.json());

export  const convert = (n) => {
  if (n < 1e3) return n;
  if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
  if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
  if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
  if (n >= 1e12) return +(n / 1e12).toFixed(1) + "T";
};

export function base64ToHex(str) {
  return atob(str)
    .split("")
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
}

async function getWalletAddress(unisat:any) {
  if (typeof unisat !== "undefined") {
    return (await unisat.requestAccounts())[0];
  }
}


export async function signPSBTUsingWallet(psbt, unisat, successMessage="signed transaction successfully") {
  try {
    const accounts = await unisat.requestAccounts();
    const tempSignedPsbt = await unisat.signPsbt(base64ToHex(psbt));
    const signedPsbt = bitcoin.Psbt.fromHex(tempSignedPsbt, {
      network: undefined,
    }).toBase64();
    return {
      message: successMessage,
      data: {
        signedPSBT: signedPsbt,
      },
      status: "success",
    };
  } catch (e) {
    // console.error(e);
    // alert(e.message);
    return { status: "error", message: e.message };
  }
}

export async function signTxUsingWallet(
  psbt,
  unisat,
  successMessage = "signed psbt successfully"
) {
  try {
    const accounts = await unisat.requestAccounts();
    const tempSignedPsbt = await unisat.signPsbt(base64ToHex(psbt));
    const signedPsbt = bitcoin.Psbt.fromHex(tempSignedPsbt, {
      network: undefined,
    }).toBase64();
    return {
      message: successMessage,
      data: {
        signedPSBT: signedPsbt,
      },
      status: "success",
    };
  } catch (e) {
    // console.error(e);
    // alert(e.message);
    return { status: "error", message: e.message };
  }
}

export async function signPSBTUsingWalletAndBroadcast(
  psbt,
  unisat,
  successMessage = "signed transaction successfully"
) {
  try {
    const accounts = await unisat.requestAccounts();
    const signedPsbt = await unisat.signPsbt(base64ToHex(psbt));
    const txHex = bitcoin.Psbt.fromHex(signedPsbt).extractTransaction().toHex();

    const res = await fetch(`${baseMempoolApiUrl}/tx`, {
      method: "post",
      body: txHex,
    });
    console.log(res, 'response')
    if (res.status != 200) {
      return {
        message: `Mempool API returned ${res.status} ${
          res.statusText
        }\n\n${await res.text()}`,

        status: "error",
      };
      return alert(
        `Mempool API returned ${res.status} ${
          res.statusText
        }\n\n${await res.text()}`
      );
    }

    const txId = res.text();
    return {
      message: successMessage,
      data: {
        tx: `${baseMempoolUrl}/tx/${txId}`,
      },
      status: "success",
    };
    // alert("Transaction signed and broadcasted to mempool successfully");
    // window.open(`${baseMempoolUrl}/tx/${txId}`, "_blank");
  } catch (e) {
    console.error(e, 'ERRRRR');
    // alert(e);
     return { status: "error", message: e.message };
  }
}