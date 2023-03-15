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
  buyerAddr: string,
  price: any,
  output: string,
  number: string,
  inscriptionOutputValue: number,
  signedPSBT: string
) => {
  await processSellerPsbt({ output, signedPsbt: signedPSBT });
  price = validateSellerPSBTAndExtractPrice(signedPSBT, output);
  if (price?.error) {
    return ({status:"error", message: price?.error})
  }
  price = satToBtc(Number(price));
  const payerAddress = buyerAddr;
  const receiverAddress = buyerAddr;
  localStorage.setItem("payerAddress", payerAddress);
  let payerUtxos;
  try {
    payerUtxos = await getAddressUtxos(payerAddress);
  } catch (e) {
    console.error(e, " Invalid buyer address error");
    return { status: "error", message: "Invalid Address", data: {} };
  }
  let minimumValueRequired = price + 5000;
  let vins = 1;
  let vouts = 2;
  paymentUtxos = await selectUtxos(
    payerUtxos,
    minimumValueRequired,
    vins,
    vouts,
    await recommendedFeeRate()
  );
  let psbt:any = await generatePSBTBuyingInscription(
    payerAddress,
    receiverAddress,
    btcToSat(price),
    paymentUtxos,
    inscriptionOutputValue
  );
  if (psbt?.error) {
    return { status: "error", message: psbt.error, data: {} };
  }
  return {
    status: "success",
    message: "Generated PSBT for buying inscription Successfully",
    data: { psbt, for: "buying" },
  };
};
const generatePSBTBuyingInscription = async (
  payerAddress,
  receiverAddress,
  price,
  paymentUtxos,
  inscriptionOutputValue
) => {
  const psbt = new bitcoin.Psbt({ network: undefined });
  let totalValue = 0;
  let totalPaymentValue = 0;
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

  // Add payer signed input
  psbt.addInput({
    ...sellerSignedPsbt.data.globalMap.unsignedTx.tx.ins[0],
    ...sellerSignedPsbt.data.inputs[0],
  });

  const fee = calculateFee(
    psbt.txInputs.length,
    psbt.txOutputs.length,
    await recommendedFeeRate()
  );

  const changeValue = totalValue - price;
  if (changeValue < 0) {
    return {
      error: `Your wallet address doesn't have enough funds to buy this inscription.
Price:          ${satToBtc(price)} BTC
Fees:       ${satToBtc(fee)} BTC
You have:   ${satToBtc(totalPaymentValue)} BTC
Required:   ${satToBtc(totalValue - changeValue)} BTC
Missing:     ${satToBtc(-changeValue)} BTC`,
    };
  }
  // Change utxo
  psbt.addOutput({
    address: payerAddress,
    value: changeValue,
  });
  // Add payer output
  psbt.addOutput({
    ...sellerSignedPsbt.data.globalMap.unsignedTx.tx.outs[0],
  });
  if (fee > (inscriptionOutputValue - 1000)) {
    console.log(fee, 'fee')
   return { error: "inscription Value is lower than current tx fee. Buy on Openordex instead." };
  } else {
    psbt.addOutput({
      address: payerAddress,
      value: inscriptionOutputValue - fee,
    });
  }
  return psbt.toBase64();
};

export const processSellerPsbt = async ({ output, signedPsbt }) => {
  const sellerSignedPsbtBase64 = signedPsbt.trim().replaceAll(" ", "+");
  try { if (sellerSignedPsbtBase64) {
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
    console.log('valid')
    return sellerOutputValueBtc;
  }}
  catch (e) {
    console.error(e, 'inProcessSellerPsbt')
  }
};
