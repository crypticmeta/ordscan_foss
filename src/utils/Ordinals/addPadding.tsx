import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import {
  calculateFee,
  getAddressUtxos,
  getTxHexById,
  recommendedFeeRate,
  satToBtc,
  selectUtxos,
} from "utils";

bitcoin.initEccLib(secp256k1);
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
let paymentUtxos;
const numberOfDummyUtxosToCreate = 1;
const feeLevel = "hourFee";
export const addPaddingPSBT = async (
  inscriptionAddress: string,
  output: string,
  number: string,
  inscriptionOutputValue: number
) => {
  let payerUtxos;
  try {
    payerUtxos = await getAddressUtxos(inscriptionAddress);
  } catch (e) {
    console.error(e, " Invalid wallet address error");
    return { status: "error", message: "Invalid Address", data: {} };
  }
  let minimumValueRequired = 7000 - inscriptionOutputValue + 1000; //(minimum sats after padding - current output value)+ fee/buffer
  let vins = 1;
  let vouts = 2;
  paymentUtxos = await selectUtxos(
    payerUtxos,
    minimumValueRequired,
    vins,
    vouts,
    await recommendedFeeRate()
  );
  let psbt = await generatePaddingPSBT(
    inscriptionAddress,
    paymentUtxos,
    inscriptionOutputValue,
    output
  );
  return {
    status: "success",
    message: "Generated PSBT for padding Successfully",
    data: { psbt, for: "padding", afterPadding: 0 },
  };
};
export const paddingUTXOCheck = async (
  inscriptionAddress: string,
  inscriptionOutputValue: number
) => {
  let payerUtxos;
  try {
    payerUtxos = await getAddressUtxos(inscriptionAddress);
  } catch (e) {
    console.error(e, " Invalid buyer address error");
    return { status: "error", message: "Invalid Address", data: {} };
  }
  
  let minimumValueRequired = 7000 - inscriptionOutputValue + 1000; //(minimum sats after padding - current output value)+ fee/buffer
  let vins = 1;
  let vouts = 2;
    try {  paymentUtxos = await selectUtxos(
      payerUtxos,
      minimumValueRequired,
      vins,
      vouts,
      await recommendedFeeRate()
    );
    if (paymentUtxos?.status==="error") {
      return {
        status: "error",
        message: "You don't have sufficient utxo to add padding",
      };
    }
    return {
      status: "success",
      message: "You have sufficient utxo to add padding",
      data: { paymentUtxos },
    };}
    catch (e) {
      // console.log(e)
        return {
          status: "error",
          message: e.message||e||"Not enough balance",
        };
    }
};
const generatePaddingPSBT = async (
  inscriptionAddress,
  paymentUtxos,
  inscriptionOutputValue,
  output
) => {
  console.log('here')
  const psbt = new bitcoin.Psbt({ network: undefined });
  const [ordinalUtxoTxId, ordinalUtxoVout] = output.split(":");
  const tx = bitcoin.Transaction.fromHex(await getTxHexById(ordinalUtxoTxId));
  for (const output in tx.outs) {
    try {
      tx.setWitness(Number(output), []);
    } catch {}
  }
  console.log("addInput")
  psbt.addInput({
    hash: ordinalUtxoTxId,
    index: parseInt(ordinalUtxoVout),
    nonWitnessUtxo: tx.toBuffer(),
    // witnessUtxo: tx.outs[ordinalUtxoVout],
  });
  let totalValue = 0;
  let totalPaymentValue = 0;
  console.log(paymentUtxos, 'pu')
  // Add payment utxo inputs
  for (const utxo of paymentUtxos) {
    const tx = bitcoin.Transaction.fromHex(await getTxHexById(utxo.txid));
    for (const output in tx.outs) {
      try {
        tx.setWitness(Number(output), []);
      } catch {}
    }

    console.log("input")
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: tx.toBuffer(),
      // witnessUtxo: tx.outs[utxo.vout],
    });

    totalValue += utxo.value;
    totalPaymentValue += utxo.value;
  }

  console.log("fee")
  const fee = calculateFee(
    psbt.txInputs.length,
    psbt.txOutputs.length,
    await recommendedFeeRate()
  );


  psbt.addOutput({
    address: inscriptionAddress,
    value: inscriptionOutputValue + (totalValue - fee),
  });

  return psbt.toBase64();
};
