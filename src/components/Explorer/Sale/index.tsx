import React, { useCallback, useContext, useEffect, useState } from "react";
import copy from "copy-to-clipboard";
import Modal from "@mui/material/Modal";
import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import {
  base64ToHex,
  btcToSat,
  nostrOrderEventKind,
  nostrRelayUrl,
  range,
  signPSBTUsingWallet,
} from "../../../utils";
import axios from "axios";
import { notify } from "utils/notifications";
import {
  generatePrivateKey,
  getEventHash,
  getPublicKey,
  relayInit,
  signEvent,
} from "nostr-tools";
import { Inscription } from "types";
import {
  generatePSBTListingInscriptionForSale,
  submitSignedSalePsbt,
} from "utils/Ordinals/sellOrdinal";
import { Mixpanel } from "utils/mixpanel";
import { AppContext } from "common/context";
import {
  PsbtData,
  PsbtRequestOptions,
  useConnect,
} from "@stacks/connect-react";
import { stacksMainnetNetwork } from "common/utils";

import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";

bitcoin.initEccLib(secp256k1);
interface OrdinalProp {
  data: Inscription;
  setSaleData: Function;
}
function Sale({ data, setSaleData }: OrdinalProp): JSX.Element {
  const state = useContext(AppContext);
  const { doOpenAuth, signPsbt } = useConnect();
  const [wallets, setwallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const relay = relayInit(nostrRelayUrl);
  const [signedTx, setSignedTx] = useState("");
  const [signedB64PSBT, setSignedB64PSBT] = useState("");
  const [price, setPrice] = useState("");
  const [sellerAddr, setSellerAddr] = useState(data.address);
  const [open, setOpen] = React.useState(false);
  const [psbt, setPSBT] = useState("");

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const signTx = useCallback(
    async (options: PsbtRequestOptions, network?: any) => {
      {
        const defaultNetwork = stacksMainnetNetwork;

        return await signPsbt({
          ...options,
          network: network || defaultNetwork,
          onFinish: async (data: PsbtData) => {
            //sets signed psbt data in hex format
            setSignedTx(data.hex);
            return data.hex;
            //  publishPSBT()
          },
          onCancel: () => {
            console.log("popup closed!");
          },
        });
      }
    },
    [signPsbt]
  );

  const signWithAvailableWallet = useCallback(
    async (wallet, psbt) => {
      let result = null;
      if (wallet === "Unisat") result = await signPSBTUsingWallet(psbt, wallet);
      else if (wallet === "Hiro") {
        result = await signTx({
          hex: base64ToHex(psbt),
          allowedSighash: [0x01, 0x02, 0x03, 0x81, 0x82, 0x83],
          signAtIndex: range(bitcoin.Psbt.fromBase64(psbt).inputCount),
        });
      }

      if (result?.status === "error") {
        notify({ type: "error", message: result.message });
      } else if(selectedWallet!=="Hiro") {
        try {
          if (result?.data?.signedPSBT != psbt) {
            setSignedTx(result.data.signedPSBT);
          }
          // await publishPSBT(result?.data?.signedPSBT);
        } catch (e) {
          console.log(e, "error publishing");
        }
      }
    },
    [selectedWallet, signTx]
  );
  const generateSalePSBT = useCallback(
    async (wallet: string) => {
      const tempPsbt = await generatePSBTListingInscriptionForSale(
        data.output,
        btcToSat(Number(price)),
        sellerAddr,
        wallet
      ).catch((err) => console.error(err, "Error generating PSBT"));

      setPSBT(tempPsbt || "");

      //if psbt is present and a wallet has been selected, it will request signature
      if (tempPsbt && selectedWallet) {
        await signWithAvailableWallet(selectedWallet, tempPsbt);
      }
    },
    [data.output, price, selectedWallet, sellerAddr, signWithAvailableWallet]
  );

  const submitSignedPSBT = async () => {
    const result = await submitSignedSalePsbt(signedTx, psbt, selectedWallet);
    if (result.status === "success" && result.data?.signedPSBT) {
      try {
        notify({ type: "success", message: "Signed successfully" });
        //TODO: Uncomment to enable publishing to orderbook
        // await publishPSBT(result?.data?.signedPSBT);
      } catch (e) {}
    } else if (result.status === "error") {
      notify({ type: result.status, message: result.message });
    }
  };

  useEffect(() => {
    if (selectedWallet === "Hiro" && state?.userData) {
      const cardinal = state?.userData?.profile.btcAddress.p2wpkh.mainnet;
      setSellerAddr(cardinal);
    }
  }, [selectedWallet, state]);

  const publishPSBT = useCallback(
    async (signedPsbt) => {
      relay.on("connect", () => {
        console.log(`connected to ${relay.url}`);
      });
      relay.on("error", () => {
        console.log(`failed to connect to ${relay.url}`);
      });
      await relay.connect();
      let sk = generatePrivateKey(); // `sk` is a hex string
      let pk = getPublicKey(sk); // `pk` is a hex string
      let event: any = {
        kind: nostrOrderEventKind,
        pubkey: pk,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["n", "mainnet"], // Network name (e.g. "mainnet", "signet")
          ["t", "sell"], // Type of order (e.g. "sell", "buy")
          ["i", data.id], // Inscription ID
          ["u", data.output.split("/")[2]], // Inscription UTXO
          ["s", JSON.stringify(btcToSat(Number(price)))], // Price in sats
          ["x", "twelveFrog"], // Exchange name (e.g. "openordex")
        ],
        content: signedPsbt,
      };
      event.id = getEventHash(event);
      event.sig = signEvent(event, sk);
      let pub = relay.publish(event);
      pub.on("ok", async () => {
        console.log(`${relay.url} has accepted our event`);
        notify({
          type: "succes",
          message: "Successfully Listed the inscription for sale",
        });
        setSaleData({
          id: data.id,
          inscriptionId: data.id,
          price,
          signedPsbt: signedPsbt,
          createdAt: new Date().toDateString(),
          type: "sell",
          utxo: data.output.split("/")[2],
        });
        return true;
      });
      pub.on("failed", (reason) => {
        notify({
          type: "error",
          message:
            "successfully generated listing. Failed to publish to orderbook.",
        });
        console.log(`failed to publish to ${relay.url}: ${reason}`);
        return false;
      });
      handleClose();
      return true;
    },
    [data.id, data.output, price, relay, signedTx]
  );

  useEffect(() => {
    if (localStorage.getItem("btc-wallets")) {
      setwallets(JSON.parse(localStorage.getItem("btc-wallets")) || []);
    }
  }, [data, price]);

  const signedPsbtDataToB64 = useCallback(async () => {
    const result = await submitSignedSalePsbt(signedTx, psbt, selectedWallet);
    setSignedB64PSBT(result.data.signedPSBT);
    const tempSaleData = {
      id: data.id,
      inscriptionId: data.id,
      price: Number(price),
      signedPsbt: result.data.signedPSBT,
      createdAt: new Date().toDateString(),
      type: "sell",
      utxo: data.output.split("/")[2],
    };
    setSaleData(tempSaleData);
  }, [
    data.id,
    data.output,
    price,
    psbt,
    selectedWallet,
    setSaleData,
    signedTx,
  ]);

  useEffect(() => {
    //converts available signedHePSBT to Base64 format for easy copy and ordscan, openordex link
    if (signedTx && psbt) {
      signedPsbtDataToB64();
    }
  }, [signedTx, psbt, signedPsbtDataToB64]);

  return (
    <>
      <div className="center flex-col">
        <button
          onClick={handleOpen}
          className={`first-letter:mb-2 z-[1] left-0 bg-brand_blue text-white text-xl px-6 py-2 rounded `}
        >
          List Now
          <span className="text-xs text-blue-200"> Beta</span>
        </button>
      </div>

      {open ? (
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="List Inscription For Sale"
          aria-describedby="List Inscription For Sale"
        >
          <div className="center min-h-screen bg-black bg-opacity-80">
            <div className="w-full md:w-8/12 lg:w-6/12 custom-container bg-brand_black border border-brand_red">
              <h2 className="text-white text-center">
                Listing{" "}
                <span className="text-brand_red">
                  Inscription {data.inscription_number}
                </span>{" "}
                For Sale
              </h2>
              {!psbt ? (
                <div className="form p-6 text-white">
                  <div className="mb-4">
                    <TextField
                      id="filled-basic"
                      label="Price in BTC"
                      variant="filled"
                      fullWidth
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <TextField
                      id="filled-basic"
                      label="Address to receive payment:"
                      variant="filled"
                      fullWidth
                      value={sellerAddr}
                      onChange={(e) => setSellerAddr(e.target.value)}
                    />
                    <label
                      htmlFor="paymentAddress"
                      className="mb-2 mt-2 text-xs pt-2"
                    >
                      {sellerAddr != data.address &&
                        "Address has been derived from wallet. Please confirm before proceeding."}
                    </label>
                  </div>
                  {wallets?.length > 0 && (
                    <div className="pt-4">
                      <FormControl>
                        <FormLabel id="demo-radio-buttons-group-label">
                          Select Wallet
                        </FormLabel>
                        <RadioGroup
                          aria-labelledby="demo-controlled-radio-buttons-group"
                          name="controlled-radio-buttons-group"
                          value={selectedWallet}
                          onChange={(e) => {
                            const item = e.target.value;
                            if (item === "Hiro") {
                              !state?.userData && doOpenAuth();
                            }
                            setSelectedWallet(item);
                          }}
                        >
                          {wallets.map((item, idx) => (
                            <FormControlLabel
                              key={item + idx}
                              value={item}
                              control={<Radio />}
                              color="inherit"
                              label={item + " wallet"}
                            />
                          ))}
                        </RadioGroup>
                      </FormControl>
                    </div>
                  )}
                </div>
              ) : (
                <div className="form p-6">
                  <div>
                    <TextField
                      id="filled-basic"
                      label="Sign This with wallet"
                      variant="filled"
                      fullWidth
                      multiline
                      rows={5}
                      value={psbt}
                    />
                    <div className="center">
                      <button
                        className="m-2 z-[1] left-0 bg-brand_black text-white text-xs px-6 py-2 rounded hover:border-brand_blue hover:text-brand_blue border-2"
                        onClick={() => copy(psbt)}
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xl text-white text-center">
                      Sign BUT. DO NOT BROADCAST.
                    </p>
                  </div>
                  <div className="mb-4">
                    <TextField
                      id="filled-basic"
                      label="Paste Signed Tx Here"
                      variant="filled"
                      fullWidth
                      multiline
                      rows={5}
                      value={signedTx}
                      onChange={(e) => setSignedTx(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end flex-wrap">
                <button
                  onClick={() =>
                    psbt ? submitSignedPSBT() : generateSalePSBT(selectedWallet)
                  }
                  className="m-6 z-[1] left-0 bg-brand_black text-white text-xl px-6 py-2 rounded hover:border-brand_blue hover:text-brand_blue border-2"
                >
                  Submit
                </button>
                {psbt && (
                  <button
                    onClick={() => setPSBT("")}
                    className="m-6 z-[1] left-0 bg-brand_red text-white text-xl px-6 py-2 rounded  hover:bg-red-800"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="m-6 z-[1] left-0 bg-brand_red text-white text-xl px-6 py-2 rounded  hover:bg-red-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Modal>
      ) : (
        <></>
      )}
    </>
  );
}

export default Sale;
