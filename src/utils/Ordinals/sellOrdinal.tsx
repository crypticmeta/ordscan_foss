import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import {
  base64ToHex,
  bitcoinPrice,
  btcToSat,
  calculateFee,
  getAddressUtxos,
  getTxHexById,
  recommendedFeeRate,
  satToBtc,
  selectUtxos,
  validateSellerPSBTAndExtractPrice,
  witnessStackToScriptWitness,
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

export async function generatePSBTListingInscriptionForSale(
  ordinalOutput,
  price,
  paymentAddress
) {
  let psbt = new bitcoin.Psbt({ network: undefined });

  const [ordinalUtxoTxId, ordinalUtxoVout] = ordinalOutput.split(":");
  const tx = bitcoin.Transaction.fromHex(await getTxHexById(ordinalUtxoTxId));
  for (const output in tx.outs) {
    try {
      tx.setWitness(Number(output), []);
    } catch {}
  }
  psbt.addInput({
    hash: ordinalUtxoTxId,
    index: parseInt(ordinalUtxoVout),
    nonWitnessUtxo: tx.toBuffer(),
    // witnessUtxo: tx.outs[ordinalUtxoVout],
    sighashType:
      bitcoin.Transaction.SIGHASH_SINGLE |
      bitcoin.Transaction.SIGHASH_ANYONECANPAY,
  });

  psbt.addOutput({
    address: paymentAddress,
    value: price,
  });

  return psbt.toBase64();
}

export const submitSignedSalePsbt = async (
  signedTx: string,
  psbt: string
): Promise<Result> => {
  const signedContent = signedTx;
  let signedSalePsbt;
  if (
    signedContent.startsWith("02000000") ||
    signedContent.startsWith("01000000")
  ) {
    const sellerSignedTx = bitcoin.Transaction.fromHex(signedContent);
    const sellerSignedInput = sellerSignedTx.ins[0];
    signedSalePsbt = bitcoin.Psbt.fromBase64(psbt, { network: undefined });
    if (sellerSignedInput?.script?.length) {
      signedSalePsbt.updateInput(0, {
        finalScriptSig: sellerSignedInput.script,
      });
    }
    if (sellerSignedInput?.witness?.[0]?.length) {
      signedSalePsbt.updateInput(0, {
        finalScriptWitness: witnessStackToScriptWitness(
          sellerSignedInput.witness
        ),
      });
    }
    signedSalePsbt = signedSalePsbt.toBase64();
  } else {
    signedSalePsbt = signedTx;
  }
  try {
    bitcoin.Psbt.fromBase64(signedSalePsbt, {
      network: undefined,
    }).extractTransaction(true);
  } catch (e) {
    if (e.message == "Not finalized") {
      return {
        status: "error",
        message: "Please sign and finalize the PSBT before submitting it",
        data: {},
      };
      // return notify();
    } else if (e.message != "Outputs are spending more than Inputs") {
      console.error(e);
      return {
        status: "error",
        message: "Invalid PSBT " + e.message || e,
        data: {},
      };
    }
  }
  const hash = "sellerSignedPsbt=" + signedSalePsbt;
  return {
    message: "checked signed psbt successfully",
    data: { hash, signedPSBT: signedSalePsbt },
    status: "success",
  };
};




// async function signPSBTUsingWalletAndBroadcast(psbt, unisat) {
//   try {
//     await unisat.requestAccounts();
//     const signedPsbt = await unisat.signPsbt(base64ToHex(input.value));
//     const txHex = bitcoin.Psbt.fromHex(signedPsbt).extractTransaction().toHex();

//     const res = await fetch(`${baseMempoolApiUrl}/tx`, {
//       method: "post",
//       body: txHex,
//     });
//     if (res.status != 200) {
//       return alert(
//         `Mempool API returned ${res.status} ${
//           res.statusText
//         }\n\n${await res.text()}`
//       );
//     }

//     const txId = res.text();
//     alert("Transaction signed and broadcasted to mempool successfully");
//     window.open(`${baseMempoolUrl}/tx/${txId}`, "_blank");
//   } catch (e) {
//     console.error(e);
//     alert(e);
//   }
// }