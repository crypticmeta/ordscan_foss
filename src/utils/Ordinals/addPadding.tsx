import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import {
  calculateFee,
  calculateTxSize,
  getAddressUtxos,
  getTxHexById,
  getWalletAddress,
  recommendedFeeRate,
  satToBtc,
  selectPaddingUtxos,
  selectUtxos,
} from "utils";
import { UTXO } from "types";
import { toXOnly } from "./sellOrdinal";

bitcoin.initEccLib(secp256k1);
interface Result {
  status: string;
  message: string;
  data: any;
}
let paymentUtxos;
const numberOfDummyUtxosToCreate = 1;
const feeLevel = "hourFee";
export const addPaddingPSBT = async (
  payAddress: string,
  receiveAddr: string,
  output: string,
  number: string,
  inscriptionOutputValue: number,
  selectedUtxos: UTXO[],
  wallet,
  maxSats,
  feeRate
) => {
  paymentUtxos = selectedUtxos;
  let result = await generatePaddingPSBT(
    payAddress,
    receiveAddr,
    paymentUtxos,
    inscriptionOutputValue,
    output,
    wallet,
    maxSats,
    feeRate
  );

  return result;
};
export const paddingUTXOCheck = async (
  payAddr: string,
  inscriptionOutputValue: number
) => {
  let payerUtxos;
  try {
    payerUtxos = await getAddressUtxos(payAddr);
  } catch (e) {
    console.error(e, " Invalid buyer address error");
    return { status: "error", message: "Invalid Address", data: {} };
  }

  let minimumValueRequired = 10000 - inscriptionOutputValue + 2000; //(minimum sats after padding - current output value)+ fee/buffer
  let vins = payerUtxos.length;
  let vouts = 1;
  try {
    paymentUtxos = await selectPaddingUtxos(
      payerUtxos,
      minimumValueRequired,
      vins,
      vouts,
      await recommendedFeeRate(),
      payAddr
    );
    if (paymentUtxos?.status === "error") {
      return {
        status: "error",
        message: "You don't have sufficient utxo to add padding",
      };
    }
    return {
      status: "success",
      message: "You have sufficient utxo to add padding",
      data: { paymentUtxos },
    };
  } catch (e) {
    // console.log(e)
    return {
      status: "error",
      message: e.message || e || "Not enough balance",
    };
  }
};

const generatePaddingPSBT = async (
  payAddr,
  receiveAddr,
  paymentUtxos,
  inscriptionOutputValue,
  output,
  wallet,
  maxSats,
  feeRate
) => {
  console.log(feeRate, "feerate", maxSats, "maxSats");
  const inputs = [];
  const outputs = []
  const psbt = new bitcoin.Psbt({ network: undefined });
  const [ordinalUtxoTxId, ordinalUtxoVout] = output.split(":");
  const tx: any = bitcoin.Transaction.fromHex(
    await getTxHexById(ordinalUtxoTxId)
  );
  const installedWalletName = wallet;
  if (installedWalletName != "Hiro") {
    for (const output in tx.outs) {
      try {
        tx.setWitness(parseInt(output), []);
      } catch {}
    }
  }
  console.log("add ordinal as first input");
  //ordinal
  inputs.push({
    value: inscriptionOutputValue,
    address: receiveAddr
  });
  const input: any = {
    hash: ordinalUtxoTxId,
    index: parseInt(ordinalUtxoVout),
    nonWitnessUtxo: tx.toBuffer(),
    witnessUtxo: tx.outs[ordinalUtxoVout],
  };
  if (installedWalletName == "Hiro") {
    const state = JSON.parse(localStorage.getItem("blockstack-session"));
    // const cardinal = state.userData.profile.btcAddress.p2wpkh.mainnet;
    // const ordinal = state.userData.profile.btcAddress.p2tr.mainnet;
    console.log(state.userData.profile.btcPublicKey.p2tr, "state pt2r");
    await getWalletAddress(wallet);
    input.tapInternalKey = toXOnly(
      tx
        .toBuffer()
        .__proto__.constructor(state.userData.profile.btcPublicKey.p2tr, "hex")
    );
  }

  psbt.addInput(input);
  //check ordinal input finalization

  let totalValue = 0;
  let totalPaymentValue = 0;
  console.log(paymentUtxos, "padding utxos");
  // Add payment utxo inputs
  for (const utxo of paymentUtxos) {
    const tx = bitcoin.Transaction.fromHex(await getTxHexById(utxo.txid));
    if (wallet !== "Hiro") {
      for (const output in tx.outs) {
        try {
          tx.setWitness(Number(output), []);
        } catch {}
      }
    }

    console.log("add padding utxos");
    inputs.push({
      value: utxo.value,
      address: payAddr
    });
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: bitcoin.Transaction.fromHex(
        await getTxHexById(utxo.txid)
      ).toBuffer(),
    });

    totalValue += utxo.value;
    totalPaymentValue += utxo.value;
  }

  console.log({
    inputs: psbt.txInputs.length,
    outputs: psbt.txOutputs.length,
    feeRate: feeRate || (await recommendedFeeRate()),
    totalValue,
  });

  const fee = calculateFee(
    psbt.txInputs.length,
    psbt.txOutputs.length,
    feeRate || (await recommendedFeeRate()),
    receiveAddr
  );
  console.log("fee ", fee);

  //inscription output

  if (maxSats < totalValue - 10000) {
    outputs.push({
      value: inscriptionOutputValue + maxSats,
      address: receiveAddr
    });
    psbt.addOutput({
      address: receiveAddr,
      value: inscriptionOutputValue + maxSats,
    });
    outputs.push({
      value: totalValue - maxSats - fee,
      address: payAddr
    });
    psbt.addOutput({
      address: payAddr,
      value: totalValue - maxSats - fee,
    });
    console.log({
      outputValue0: inscriptionOutputValue + maxSats,
      outputValue1: totalValue - maxSats - fee,
    });
  } else {
    outputs.push({
      value: inscriptionOutputValue + (maxSats - fee),
      address: receiveAddr
    });
    psbt.addOutput({
      address: receiveAddr,
      value: inscriptionOutputValue + (maxSats - fee),
    });
    console.log({
      outputValue0: inscriptionOutputValue + (maxSats - fee),
    });
  }

  const txSize = calculateTxSize(psbt);
  console.log(fee, "calculate Fee Rate", txSize);

  return {
    status: "success",
    message: "Successfully created psbt",
    data: {
      psbt: psbt.toBase64(),
      outputs: outputs,
      inputs,
      fee: fee,
      feeRate: (fee / txSize).toFixed(2),
    },
  };
};
