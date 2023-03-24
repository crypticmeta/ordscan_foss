import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import {
  getTxHexById,
  getWalletAddress,
  witnessStackToScriptWitness,
} from "utils";

bitcoin.initEccLib(secp256k1);
interface Result {
  status: string;
  message: string;
  data: any;
}

export async function generatePSBTListingInscriptionForSale(
  ordinalOutput,
  price,
  paymentAddress,
  wallet
) {
  let psbt = new bitcoin.Psbt({ network: undefined });

  const [ordinalUtxoTxId, ordinalUtxoVout] = ordinalOutput.split(":");
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

  const input: any = {
    hash: ordinalUtxoTxId,
    index: parseInt(ordinalUtxoVout),
    nonWitnessUtxo: tx.toBuffer(),
    witnessUtxo: tx.outs[ordinalUtxoVout],
    sighashType:
      bitcoin.Transaction.SIGHASH_SINGLE |
      bitcoin.Transaction.SIGHASH_ANYONECANPAY,
  };
  if (installedWalletName == "Hiro") {
    const state = JSON.parse(localStorage.getItem("blockstack-session"));
    // const cardinal = state.userData.profile.btcAddress.p2wpkh.mainnet;
    // const ordinal = state.userData.profile.btcAddress.p2tr.mainnet;
    await getWalletAddress(wallet);
    input.tapInternalKey = toXOnly(
      tx
        .toBuffer()
        .__proto__.constructor(state.userData.profile.btcPublicKey.p2tr, "hex")
    );
  }

  psbt.addInput(input);

  psbt.addOutput({
    address: paymentAddress,
    value: price,
  });

  return psbt.toBase64();
}
export const toXOnly = (pubKey) =>
  pubKey.length === 32 ? pubKey : pubKey.slice(1, 33);

export const submitSignedSalePsbt = async (
  signedTx: string,
  psbt: string,
  wallet?: string
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
  } else if (signedContent.match(/^[0-9a-fA-F]+$/)) {
    signedSalePsbt = bitcoin.Psbt.fromHex(signedContent, {
      network: undefined,
    }).toBase64();
  } else {
    signedSalePsbt = signedTx;
  }
  try {
    let testPsbt: any = bitcoin.Psbt.fromBase64(signedSalePsbt, {
      network: undefined,
    });
    if (wallet == "Hiro") {
      for (let i = 0; i < testPsbt.data.inputs.length; i++) {
        console.log(testPsbt.data.inputs[i]);
        if (
          testPsbt.data.inputs[i].tapKeySig?.length &&
          !testPsbt.data.inputs[i]?.finalScriptWitness?.length
        ) {
          testPsbt.updateInput(i, {
            finalScriptWitness: testPsbt.data.inputs[
              i
            ].tapKeySig.__proto__.constructor([
              1,
              65,
              ...testPsbt.data.inputs[i].tapKeySig,
            ]),
          });
        }
      }
      signedSalePsbt = testPsbt.toBase64();
    }
    testPsbt.extractTransaction(true);
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

  // console.log(signedSalePsbt, "BAse64");
  return {
    message: "checked signed psbt successfully",
    data: { hash, signedPSBT: signedSalePsbt },
    status: "success",
  };
};
