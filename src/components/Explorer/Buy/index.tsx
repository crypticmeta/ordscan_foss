import React, { useCallback,  useContext,  useEffect,  useState } from "react";
import copy from "copy-to-clipboard";
import Modal from "@mui/material/Modal";
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from "@mui/material";
import Link from "next/link";
import { addressHasTxInMempool, base64ToHex, baseMempoolApiUrl, getAddressMempoolTxIds, range, signPSBTUsingWallet, signPSBTUsingWalletAndBroadcast } from "../../../utils";
import { notify } from "utils/notifications";
import QRCode from "react-qr-code";
import { Inscription, Order } from "types";
import { buyInscriptionPSBT } from "utils/Ordinals/buyOrdinal";
import { Mixpanel } from "utils/mixpanel";
const baseMempoolUrl = "https://mempool.space";


import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import { AppContext } from "common/context";
import {
  PsbtData,
  PsbtRequestOptions,
  useConnect,
} from "@stacks/connect-react";
import { stacksMainnetNetwork } from "common/utils";
bitcoin.initEccLib(secp256k1);
interface OrdinalProp {
  data: Inscription;
  saleData: Order;
}
function Buy({ data, saleData }: OrdinalProp): JSX.Element {
  //wallets
  const state = useContext(AppContext);
  const { doOpenAuth, signPsbt } = useConnect();
  const [wallets, setwallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);

  //buy
  const [receiveAddr, setReceiveAddr] = useState("");
  const [payAddr, setPayAddr] = useState("");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<any>({});
  const [psbt, setPSBT] = useState("");

  //hiro-sign
  const [signedPsbt, setSignedPsbt] = useState("");
  const [signedB64PSBT, setSignedB64PSBT] = useState("");
  const signTx = useCallback(
    async (options: PsbtRequestOptions, network?: any) => {
      {
        const defaultNetwork = stacksMainnetNetwork;

        return await signPsbt({
          ...options,
          network: network || defaultNetwork,
          onFinish: async (data: PsbtData) => {
            //sets signed psbt data in hex format
            setSignedPsbt(data.hex);
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

  //getAddressFromHiroWallet
  useEffect(() => {
    if (selectedWallet === "Hiro" && state?.userData) {
      //if taproot or segwit address missing. redo auth.
      if (
        !state?.userData?.profile?.btcAddress?.p2tr?.mainnet ||
        !state?.userData?.profile?.btcAddress?.p2wpkh?.mainnet
      ) {
        doOpenAuth();
      }
      const cardinal = state.userData.profile.btcAddress.p2wpkh.mainnet;
      const ordinal = state.userData.profile.btcAddress.p2tr.mainnet;
      setPayAddr(cardinal);
      setReceiveAddr(ordinal);
    }
  }, [doOpenAuth, selectedWallet, state]);

  useEffect(() => {
    if (localStorage.getItem("btc-wallets")) {
      setwallets(JSON.parse(localStorage.getItem("btc-wallets")) || []);
    }
  }, [data, selectedWallet]);

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const buy = async () => {
    if (!payAddr || !receiveAddr) {
      notify({ type: "error", message: "Needs both address" });
      return;
    }
    if (await addressHasTxInMempool(payAddr)) {
      handleClose();
      notify({ type: "error", message: "Previous Tx is yet to confirm." });
      return;
    }
    const result = await buyInscriptionPSBT(
      payAddr,
      receiveAddr,
      selectedWallet,
      Number(saleData.price),
      data.output,
      data.inscription_number,
      Number(data["output value"]),
      saleData.signedPsbt
    );
    if (result.status === "error") {
      handleClose();
      notify({ type: "error", message: result.message });
    } else if (result.status === "success") {
      setPSBT(result.data.psbt);
      setResult(result.data);
      //if psbt is present and a wallet has been selected, it will request signature
      if (result.data.psbt && selectedWallet) {
        await signWithAvailableWallet(selectedWallet, result.data.psbt);
      }
      // waitForTx();
    }
  };

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
      } else {
        try {
          if (result?.data?.signedPSBT != psbt) {
            setSignedPsbt(result.data.signedPSBT);
          }
          // await publishPSBT(result?.data?.signedPSBT);
        } catch (e) {
          console.log(e, "error publishing");
        }
      }
    },
    [signTx]
  );

  const signedPsbtDataToB64 = useCallback(async () => {
    console.log(signedPsbt, "signedPsbt");
    const b64 = bitcoin.Psbt.fromHex(signedPsbt, {
      network: undefined,
    }).toBase64();
    if (b64) setSignedB64PSBT(b64);
  }, [signedPsbt]);

  useEffect(() => {
    //converts available signedHePSBT to Base64 format for easy copy and ordscan, openordex link
    if (signedPsbt && psbt) {
      signedPsbtDataToB64();
    }
  }, [signedPsbt, psbt, signedPsbtDataToB64]);

  const broadcastTx = useCallback(async () => {
    try {
      const psbt = bitcoin.Psbt.fromHex(signedPsbt);
      if (selectedWallet == "Hiro") {
        for (let i = 0; i < psbt.data.inputs.length; i++) {
          try {
            psbt.finalizeInput(i);
          } catch (e) {
            console.error(e);
          }
        }
      }
      const txHex = psbt.extractTransaction().toHex();
      console.log(txHex, "TXHEX");
      //TODO: remove below line to enable Broadcasting TX
      // return 0
      const res = await fetch(`${baseMempoolApiUrl}/tx`, {
        method: "post",
        body: txHex,
      });
      if (res.status != 200) {
        return alert(
          `Mempool API returned ${res.status} ${
            res.statusText
          }\n\n${await res.text()}`
        );
      }

      const txId = await res.text();
      alert("Transaction signed and broadcasted to mempool successfully");
      window.open(`${baseMempoolUrl}/tx/${txId}`, "_blank");
    } catch (e) {
      console.error(e);
      alert(e);
    }
  }, [selectedWallet, signedPsbt]);

  return (
    <>
      <div className="center flex-col mb-2">
        <button
          onClick={handleOpen}
          className={`first-letter:mb-2 z-[1] left-0 bg-brand_blue hover:bg-blue-900 text-white text-xl px-6 py-2 rounded `}
        >
          Buy this Inscription for {saleData?.price?.toFixed(5)} BTC
          {/* <span className="text-xs text-brand_red"> Beta</span> */}
        </button>
        {/* <button
          onClick={() => {
            Mixpanel.track("ReferredToOpenOrdex", { data, saleData });
          }}
          className="bg-brand_black mt-2 text-white text-xl px-6 py-2 rounded hover:border-brand_red hover:text-brand_red border-2"
        >
          <Link
            target="#"
            href={`https://openordex.org/inscription?number=${saleData.inscriptionId}`}
          >
            Buy on Openordex
          </Link>
        </button> */}
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
                Buying{" "}
                <span className="text-brand_red">
                  Inscription {data.inscription_number}
                </span>{" "}
                For {saleData.price.toFixed(5)} BTC
              </h2>
              {!psbt ? (
                <div className="form p-6 text-white">
                  <div>
                    <TextField
                      id="filled-basic"
                      label="Buyer Address"
                      variant="filled"
                      fullWidth
                      value={payAddr}
                      onChange={(e) => setPayAddr(e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <TextField
                      id="filled-basic"
                      label="Receive Inscription Address"
                      variant="filled"
                      fullWidth
                      value={receiveAddr}
                      onChange={(e) => setReceiveAddr(e.target.value)}
                    />
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
                <div className="form p-2">
                  <div>
                    <TextField
                      id="filled-basic"
                      label={
                        result?.for === "Buying" ? (
                          <>
                            Created PSBT for buying inscription #
                            <span className="inscriptionNumber">
                              {data?.inscription_number}
                            </span>{" "}
                            for{" "}
                            <span className="price">
                              {saleData?.price || 0.1}{" "}
                            </span>
                            BTC:
                          </>
                        ) : (
                          <>PSBT generated to create Padding UTXO</>
                        )
                      }
                      variant="filled"
                      fullWidth
                      multiline
                      rows={3}
                      value={psbt}
                    />
                    <div className="center">
                      <button
                        className="m-3 z-[1] left-0 bg-brand_black text-white text-xl px-6 py-2 rounded hover:border-brand_blue hover:text-brand_blue border-2"
                        onClick={() => copy(psbt)}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="mb-4 center">
                    <div className="">
                      <QRCode value={psbt} className="border border-white" />
                      <p className="pt-3 text-xs text-white">
                        Waiting for Transaction in mempool
                      </p>
                    </div>
                    <div className="flex flex-col justify-end items-end flex-wrap">
                      <p className="w-full mx-6 my-2 z-[1] left-0 bg-brand_black text-white text-xl ">
                        {result?.for === "Buying" ? (
                          <>
                            Created PSBT for buying inscription #
                            <span className="inscriptionNumber">
                              {data?.inscription_number}
                            </span>{" "}
                            for{" "}
                            <span className="price">
                              {saleData?.price || 0.1}{" "}
                            </span>
                            BTC:
                          </>
                        ) : (
                          <>PSBT generated to create Padding UTXO</>
                        )}
                      </p>

                      {/* <button
                        onClick={() => signWithUnisatWallet()}
                        className="my-2 mx-6 z-[1] left-0 bg-yellow-600 w-full text-white text-xs px-6 py-2 rounded hover:bg-yellow-700 border-2"
                      >
                        Sign with UNISAT
                      </button> */}

                      <button
                        onClick={() => setPSBT("")}
                        className="w-full mx-6 my-2 z-[1] left-0 bg-brand_red text-white text-xl px-6 py-2 rounded  hover:bg-red-800"
                      >
                        Back
                      </button>

                      <button
                        onClick={handleClose}
                        className="w-full mx-6 my-2 z-[1] left-0 bg-brand_red text-white text-xl px-6 py-2 rounded  hover:bg-red-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {!psbt ? (
                <div className="flex justify-end flex-wrap">
                  {!psbt && (
                    <button
                      onClick={() => buy()}
                      className="m-6 z-[1] left-0 bg-brand_black text-white text-xl px-6 py-2 rounded hover:border-brand_blue hover:text-brand_blue border-2"
                    >
                      Submit
                    </button>
                  )}
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
              ) : (
                <></>
              )}
            </div>
          </div>
        </Modal>
      ) : (
        <></>
      )}
    </>
  );
}

export default Buy;
