import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import {
  bitcoinPrice,
  btcToSat,
  calculateFee,
  getAddressUtxos,
  getTxHexById,
  recommendedFeeRate,
  satToBtc,
  selectUtxos,
  validateSellerPSBTAndExtractPrice,
} from "utils";
import { notify } from "utils/notifications";

bitcoin.initEccLib(secp256k1);
interface Result {
  status: string;
  message: string;
  data: any;
}
let sellerSignedPsbt;
const bitcoinPriceApiUrl = "https://blockchain.info/ticker?cors=true";
const baseMempoolUrl = true
  ? "https://mempool.space"
  : "https://mempool.space/signet";
const baseMempoolApiUrl = `${baseMempoolUrl}/api`;
const ordinalsExplorerUrl = process.env.NEXT_PUBLIC_PROVIDER;
let paymentUtxos;
const numberOfDummyUtxosToCreate = 1;
const feeLevel = "hourFee";
export const buyInscriptionPSBT = async (
  paymentAddr: string,
  receiveAddr: string,
  wallet: string,
  price: any,
  output: string,
  number: string,
  inscriptionOutputValue: number,
  signedPSBT: string
) => {
  await processSellerPsbt({ output, signedPsbt: signedPSBT });
  price = validateSellerPSBTAndExtractPrice(signedPSBT, output);
  notify({ type: "info", message: "PSBT is valid. 👍🏿" });
  if (price?.error) {
    return { status: "error", message: price?.error };
  }
  price = satToBtc(Number(price));
  const payerAddress = paymentAddr;
  const receiverAddress = receiveAddr;
  localStorage.setItem("payerAddress", payerAddress);
  let payerUtxos;
  try {
    payerUtxos = await getAddressUtxos(payerAddress);
  } catch (e) {
    console.error(e, " Invalid buyer address error");
    return { status: "error", message: "Invalid Address", data: {} };
  }
  let minimumValueRequired = btcToSat(price);
  let vins = 2;
  let vouts = 3;
  try {
    const utxoResult = await selectUtxos(
      payerUtxos,
      minimumValueRequired,
      vins,
      vouts,
      await recommendedFeeRate(),
      inscriptionOutputValue,
      payerAddress
    );
    let takerUtxos, paddingUtxos;
    console.log(utxoResult, "utxoResult");
    if (utxoResult.status === "success") {
      if (utxoResult?.data?.psbt) {
        return utxoResult;
      } else {
        takerUtxos = utxoResult.data.takerUtxos;
        paddingUtxos = utxoResult.data.paddingUtxos;
      }
    } else {
      return utxoResult;
    }

    let psbt: any = await generatePSBTBuyingInscription(
      payerAddress,
      receiverAddress,
      btcToSat(price),
      takerUtxos,
      paddingUtxos,
      inscriptionOutputValue
    );
    if (psbt?.error) {
      return { status: "error", message: psbt.error, data: {} };
    }
    return {
      status: "success",
      message: "Generated PSBT for buying inscription Successfully",
      data: { psbt, for: "Buying" },
    };
  } catch (e) {
    console.log(e, "error generating buy PSBT");
    return {
      status: "error",
      message: "error generating buy PSBT",
    };
  }
};
const generatePSBTBuyingInscription = async (
  payerAddress,
  receiverAddress,
  price,
  takerUtxos,
  paddingUtxos,
  inscriptionOutputValue
) => {
  const psbt = new bitcoin.Psbt({ network: undefined });
  // add payment inputs
  for (const utxo of takerUtxos) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: bitcoin.Transaction.fromHex(
        await getTxHexById(utxo.txid)
      ).toBuffer(),
    });
  }
  let inscriptionUtxoValue = inscriptionOutputValue;

  // add inscription input
  psbt.addInput({
    ...sellerSignedPsbt.data.globalMap.unsignedTx.tx.ins[0],
    ...sellerSignedPsbt.data.inputs[0],
  });

  // add padding inputs
  for (const utxo of paddingUtxos) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: bitcoin.Transaction.fromHex(
        await getTxHexById(utxo.txid)
      ).toBuffer(),
    });
  }

  // add change outputs
  let sumOfTakerUtxos = 0;
  takerUtxos.forEach((u) => (sumOfTakerUtxos += u.value));
  let remainingTakerUtxoChange = sumOfTakerUtxos - price;

  for (let i = 0; i < takerUtxos.length; i++) {
    if (i < takerUtxos.length - 1) {
      psbt.addOutput({
        address: payerAddress,
        value: Math.ceil((sumOfTakerUtxos - price) / takerUtxos.length),
      });
      remainingTakerUtxoChange -= Math.ceil(
        (sumOfTakerUtxos - price) / takerUtxos.length
      );
    } else {
      psbt.addOutput({
        address: payerAddress,
        value: remainingTakerUtxoChange,
      });
    }
  }

  // add payment output
  psbt.addOutput({
    ...sellerSignedPsbt.data.globalMap.unsignedTx.tx.outs[0],
  });

  const fee = calculateFee(
    psbt.txInputs.length,
    psbt.txOutputs.length,
    await recommendedFeeRate()
  );
  let remainingPaddingValue = 0;
  paddingUtxos.forEach((u) => (remainingPaddingValue += u.value));

  // If no added padding available, and safe to send with current fee, then send
  console.log({ paddingUtxos, takerUtxos, fee, inscriptionOutputValue });
  if (!paddingUtxos.length && inscriptionUtxoValue - fee > 2000) {
    psbt.addOutput({
      address: receiverAddress,
      value: inscriptionUtxoValue - fee,
    });
    // If safe to proceed with available padding, then send
  } else if (
    inscriptionUtxoValue + remainingPaddingValue - fee < 10000 &&
    inscriptionUtxoValue + remainingPaddingValue - fee > 2000
  ) {
    psbt.addOutput({
      address: receiverAddress,
      value: inscriptionUtxoValue + remainingPaddingValue - fee,
    });
    // If padding available to reset the 10k threshold, reset and spend change to receiver
  } else if (inscriptionUtxoValue + remainingPaddingValue - fee > 10000) {
    psbt.addOutput({
      address: receiverAddress,
      value: inscriptionUtxoValue > 10000 ? inscriptionUtxoValue : 10000,
    });

    remainingPaddingValue -= 10000 - inscriptionUtxoValue + fee;

    psbt.addOutput({
      address: receiverAddress,
      value: remainingPaddingValue - fee,
    });
  } else {
    throw new Error(
      `Fee markets are currently very volatile.  Please add additional funds or wait.`
    );
  }

  return psbt.toBase64();
};

export const processSellerPsbt = async ({ output, signedPsbt }) => {
  const sellerSignedPsbtBase64 = signedPsbt.trim().replaceAll(" ", "+");
  try {
    if (sellerSignedPsbtBase64) {
      sellerSignedPsbt = bitcoin.Psbt.fromBase64(sellerSignedPsbtBase64, {
        network: undefined,
      });
      const sellerInput = sellerSignedPsbt.txInputs[0];
      const sellerSignedPsbtInput = `${sellerInput.hash
        .reverse()
        .toString("hex")}:${sellerInput.index}`;

      // console.log('checking vlidity: ', sellerSignedPsbtInput === output)

      if (sellerSignedPsbtInput != output) {
        // console.log(
        //   `Seller signed PSBT does not match this inscription\n\n${sellerSignedPsbtInput}\n!=\n${output}`
        // );
        return false;
      }

      if (
        sellerSignedPsbt.txInputs.length != 1 ||
        sellerSignedPsbt.txInputs.length != 1
      ) {
        // console.log(`Invalid seller signed PSBT`);
        return false;
      }

      const sellerOutput = sellerSignedPsbt.txOutputs[0];
      const price = sellerOutput.value;
      const sellerOutputValueBtc = satToBtc(price);
      console.log("valid");
      return sellerOutputValueBtc;
    }
  } catch (e) {
    console.error(e, "inProcessSellerPsbt");
  }
};
