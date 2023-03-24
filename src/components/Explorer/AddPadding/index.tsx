import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Modal,
  Radio,
  RadioGroup,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  PsbtData,
  PsbtRequestOptions,
  useConnect,
} from "@stacks/connect-react";
import { AppContext } from "common/context";
import { stacksMainnetNetwork } from "common/utils";
import copy from "copy-to-clipboard";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { Inscription, UTXO } from "types";
import {
  addressHasTxInMempool,
  base64ToHex,
  baseMempoolApiUrl,
  baseMempoolUrl,
  range,
  removeFalsey,
  signPSBTUsingWallet,
} from "utils";
import { Mixpanel } from "utils/mixpanel";
import { notify } from "utils/notifications";

import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import { addPaddingPSBT, paddingUTXOCheck } from "utils/Ordinals/addPadding";
import FeeSlider from "components/Others/FeeSlider";
import { submitSignedSalePsbt } from "utils/Ordinals/sellOrdinal";
import { shortForm } from "utils/shortForm";
import MaxAmount from "./MaxAmount";
interface OrdinalProp {
  data: Inscription;
  saleData: any;
}
bitcoin.initEccLib(secp256k1);
function Padding({ data, saleData }: OrdinalProp): JSX.Element {
  //wallets
  const state = useContext(AppContext);
  const { doOpenAuth, signPsbt } = useConnect();
  const [wallets, setwallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState("");

  //add-padding
  const [maxSats, setMaxSats] = useState(0)
  const [receiveAddr, setReceiveAddr] = useState(""); //ordinal address
  const [payAddr, setPayAddr] = useState(""); //btc address
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<any>({});
  const [selectedUtxo, setSelectedUtxo] = useState<UTXO[]>([]);
  const [psbt, setPSBT] = useState("");
  const [totalBalance, setTotalbalance] = useState(0)
  const [feeRate, setFeeRate] = useState(0)
  const handleOpen = () => {
    setOpen(true);
  };

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
            console.log(data.hex, 'signed hex')
            // const tx = bitcoin.Transaction.fromHex(data.hex);
            // console.log(tx, 'signedPSBT')
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
  }, [data, selectedWallet, state, open, payAddr, receiveAddr]);

  const handleClose = () => setOpen(false);
  const utxoCheck = async () => {
    if (await addressHasTxInMempool(payAddr)) {
      handleClose();
      notify({ type: "error", message: "Previous Tx is yet to confirm." });
      return;
    }
    const result = await paddingUTXOCheck(payAddr, Number(data.output_value));
    if (result.status === "error") {
      handleClose();
      notify({ type: "error", message: result.message });
    } else if (result.status === "success") {
      setResult(result.data.paymentUtxos);
      setSelectedUtxo(result.data.paymentUtxos.slice(0,3));
    }
  };
  const addPadding = async () => {
    if (!payAddr || !receiveAddr) {
      notify({ type: "error", message: "Needs both address" });
      return;
    }
    if (await addressHasTxInMempool(payAddr)) {
      handleClose();
      notify({ type: "error", message: "Previous Tx is yet to confirm." });
      return;
    }
    const result = await addPaddingPSBT(
      payAddr,
      receiveAddr,
      data.output,
      data.inscription_number,
      Number(data.output_value),
      selectedUtxo,
      selectedWallet,
      maxSats,
      feeRate
    );
    if (result.status === "error") {
      handleClose();
      notify({ type: "error", message: result.message });
    } else if (result.status === "success") {
      setPSBT(result.data.psbt);
      setResult(result.data);
      console.log(result.data, 'PSBT GENERATED')
      // Mixpanel.track("AddPaddingPSBTGenerated", {
      //   data,
      //   saleData,
      //   psbt: result.data.psbt,
      // });
      // //if psbt is present and a wallet has been selected, it will request signature
      if (result.data.psbt && selectedWallet) {
        await signWithAvailableWallet(selectedWallet, result.data.psbt);
      }
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
    // console.log(signedPsbt, "signedPsbt");
    const b64 = bitcoin.Psbt.fromHex(signedPsbt, {
      network: undefined,
    }).toBase64();
    if (b64 !== psbt) setSignedB64PSBT(b64);
    // console.log(psbt, 'UNSIGNED')
    // console.log(b64, 'SIGNED')
  }, [psbt, signedPsbt]);

  useEffect(() => {
    //converts available signedHePSBT to Base64 format for easy copy and ordscan, openordex link
    if (signedPsbt && psbt ) {
      signedPsbtDataToB64();
    }
  }, [signedPsbt, psbt, signedPsbtDataToB64]);

  const broadcastTx = useCallback(async () => {
    try {
        const result = await submitSignedSalePsbt(
          signedB64PSBT,
          psbt,
          selectedWallet
      );
      console.log(result, 'RESULT')
      const tempPsbt = bitcoin.Psbt.fromHex(signedPsbt);
      if (selectedWallet == "Hiro") {
        for (let i = 0; i < tempPsbt.data.inputs.length; i++) {
          try {
            tempPsbt.finalizeInput(i);
          } catch (e) {
            console.error(e);
          }
        }
      }
      const txHex = tempPsbt.extractTransaction().toHex();
      console.log(txHex, "TXHEX");
    
      //TODO: remove below line to enable Broadcasting TX
      return 0
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
      const dbData = {
        ...saleData,
        ...data,
        txid: txId,
      };
      Mixpanel.track("AddPaddingTXBroadcasted", dbData);
      notify({
        type: "success",
        message: "Transaction signed and broadcasted to mempool successfully",
      });
      window.open(`${baseMempoolUrl}/tx/${txId}`, "_blank");
    } catch (e) {
      console.error(e);
      notify({
        type: "error",
        message: e.message,
      });
      // alert(e);
    }
  }, [data, saleData, selectedWallet, signedPsbt]);

  useEffect(() => {
    var total = 0;
    selectedUtxo?.map(item => {
      total = total + item.value;
    })
    setTotalbalance(total)
    setMaxSats(total>20000?20000:total)
  }, [selectedUtxo])
  
  useEffect(() => {
    setPayAddr(data.address)
    setReceiveAddr(data.address)
  }, [data])
  

  return (
    <>
      {/* <div className="center flex-col my-2">
        <button
          disabled={ true}
          onClick={handleOpen}
          className="bg-brand_black text-white text-xl px-6 py-2 rounded hover:border-brand_red hover:text-brand_red border-2"
        >
          Add padding to this Inscription
          <span className="text-xs text-brand_red"> soon</span>
        </button>
      </div> */}

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
                Add Padding to{" "}
                <span className="text-brand_blue">
                  Inscription {data.inscription_number}
                </span>
              </h2>
              {!psbt ? (
                <div className="form p-6 text-white">
                  {result?.length ? (
                    <div>
                      <div className="w-full center flex-wrap">
                        <div className="w-6/12 md:w-4/12  p-2">
                          <div className="text-white bg-blue-200 border-2 rounded-xl text-center p-2">
                            <p className="text-xs text-blue-500">
                              Current Value
                            </p>
                            <p className="text-blue-900 text-sm pt-1 flex items-center justify-center capitalize">
                              <span>{data.output_value} </span>
                            </p>
                          </div>
                        </div>
                        {result?.map((item, idx) => {
                          return (
                            <div
                              key={item?.txid}
                              className="w-6/12 md:w-4/12  p-2 cursor-pointer relative"
                              onClick={() => {
                                if (
                                  selectedUtxo?.filter(
                                    (a) => a.txid === item.txid
                                  ).length > 0
                                ) {
                                  let tempItem = [...selectedUtxo];
                                  const index = tempItem.findIndex(
                                    (a) => a.txid === item.txid
                                  );
                                  tempItem[index] = null;
                                  tempItem = removeFalsey(tempItem);
                                  setSelectedUtxo(tempItem);
                                } else {
                                  if (selectedUtxo?.length < 3)
                                    setSelectedUtxo([...selectedUtxo, item]);
                                }
                              }}
                            >
                              <Tooltip title="This UTXO will be added as padding">
                                <div className="absolute top-[2px] right-[2px]">
                                  {selectedUtxo?.filter(
                                    (a) => a.txid === item?.txid
                                  ).length > 0 && (
                                    <BsFillCheckCircleFill className="text-green-500 ml-2" />
                                  )}
                                </div>
                              </Tooltip>
                              <div className="text-white border-brand_red border-2 rounded-xl bg-brand_black hover:bg-gray-900 text-center p-2">
                                <p className="text-xs text-gray-500">
                                  Balance {idx + 1}
                                </p>
                                <p className=" text-sm pt-1 flex items-center justify-center capitalize">
                                  <span>{item?.value} </span>
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div
                        className={`center w-full ${
                          maxSats > totalBalance ? " bg-red-500 " : ""
                        }`}
                      >
                        <p>Use only </p>
                        <input
                          className="bg-transparent px-4 py-1 focus:outline-none "
                          value={maxSats}
                          onChange={(e) => setMaxSats(Number(e.target.value))}
                        />
                        <p>sats</p>
                      </div>
                      <MaxAmount amount={maxSats} balance={ totalBalance} setAmount={setMaxSats } />
                      <FeeSlider fee={feeRate} setFee={setFeeRate} />
                      {totalBalance >
                      10000 - Number(data.output_value) + 2000 ? (
                        <p className="text-center pt-4 text-lg ">
                          <span className="text-brand_blue">Congrats!</span> You
                          have funds to add padding!
                        </p>
                      ) : (
                        <p className="text-center pt-4 text-lg ">
                          Select more UTXOs
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      {selectedWallet == "" ? (
                        <p className="text-xs">
                          Make sure inscription address has enough balance to
                          add padding and payment address belongs to same wallet
                          as the ordinal
                        </p>
                      ) : (
                        <p>
                          Make sure wallet has enough balance to add padding.
                        </p>
                      )}
                      <div className="py-3">
                        <p className="pt-1 text-xs capitalize">
                          {" "}
                          payment address :
                        </p>
                        <p className="border my-1 text-xs px-4 py-1 mb-2">
                          <input
                            onChange={(e) => setPayAddr(e.target.value)}
                            className="bg-transparent focus:outline-none w-full "
                            value={payAddr}
                          />
                        </p>
                        <p className="pt-1 text-xs capitalize">
                          {" "}
                          ordinal address :{" "}
                        </p>
                        <p className="bg-brand_blue text-xs px-4 py-1 mb-2">
                          {receiveAddr}
                        </p>
                      </div>
                      {/* {wallets?.length > 0 && (
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
                              <FormControlLabel
                                value={""}
                                control={<Radio />}
                                color="inherit"
                                label={"Sparrow" + " wallet"}
                              />
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
                      )} */}
                    </div>
                  )}
                  {selectedUtxo?.length > 0 ? (
                    <button
                      onClick={() => addPadding()}
                      className="w-full my-2 z-[1] left-0 bg-brand_blue text-white text-xs px-6 py-2 rounded  hover:bg-blue-900"
                    >
                      Add padding
                    </button>
                  ) : (
                    <button
                      onClick={() => utxoCheck()}
                      className="w-full my-2 z-[1] left-0 bg-brand_blue text-white text-xs px-6 py-2 rounded  hover:bg-blue-900"
                    >
                      Check Balance
                    </button>
                  )}
                  <button
                    onClick={handleClose}
                    className="w-full my-2 z-[1] left-0 bg-brand_red text-white text-xs px-6 py-2 rounded  hover:bg-red-800"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="form p-2">
                  <div>
                    <TextField
                      id="filled-basic"
                      label={
                        signedB64PSBT
                          ? "Signed TX"
                          : "Sign and broadcast this tx to add UTXO"
                      }
                      variant="filled"
                      fullWidth
                      multiline
                      rows={3}
                      value={signedB64PSBT ? signedB64PSBT : psbt}
                    />
                    <div className="center">
                      <button
                        className="m-3 z-[1] left-0 bg-brand_black text-white text-xl px-6 py-2 rounded hover:border-brand_blue hover:text-brand_blue border-2"
                        onClick={() =>
                          copy(signedB64PSBT ? signedB64PSBT : psbt)
                        }
                      >
                        Copy {signedB64PSBT ? "Signed" : "Unsigned"} PSBT
                      </button>
                    </div>
                  </div>
                  <div className=" ">
                    <div className="flex md:h-[30vh]  bg-gray-900 border border-brand_red  p-6 overflow-y-scroll no-scrollbar py-2 justify-center items-start text-center text-xs text-white">
                      <div className="inputs md:w-6/12">
                        <p>INPUTS</p>
                        {result?.inputs?.length > 0 &&
                          result.inputs?.map((item, idx) => (
                            <div className="m-1" key={item + ":" + idx}>
                              <div className="text-white bg-blue-200 border-2 rounded-xl text-center p-2">
                                <p className="text-xs text-blue-500">
                                  {item === Number(data.output_value)
                                    ? " Inscription "
                                    : "Input " + (idx + 1)}
                                </p>
                                <p className="text-blue-900 text-sm pt-1 flex items-center justify-center capitalize">
                                  <span>{item.value} </span>
                                </p>
                                <p className="text-blue-900 text-sm pt-1 flex items-center justify-center capitalize">
                                  <span>{shortForm(item.address)} </span>
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                      <div className="outputs w-full md:w-6/12">
                        <p>OUTPUTS</p>
                        {result.outputs?.map((item, idx) => (
                          <div className="m-2" key={item + idx}>
                            <div className="text-white bg-green-300 rounded-xl text-center p-2">
                              <p className="text-xs text-green-900">
                                {idx === 0
                                  ? "Inscription"
                                  : "Output " + (idx + 1)}
                              </p>
                              <p className="text-green-900 text-sm pt-1 flex items-center justify-center capitalize">
                                <span>{item.value} </span>
                              </p>
                              <p className="text-green-900 text-sm pt-1 flex items-center justify-center capitalize">
                                <span>{shortForm(item.address)} </span>
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className="m-2">
                          <div className="text-white bg-brand_black border-2 border-green-500 rounded-xl text-center p-2">
                            <p className="text-xs text-green-200">Fee</p>
                            <p className="text-green-500 text-sm pt-1 flex items-center justify-center ">
                              <span>{result?.fee}</span>
                            </p>
                          </div>
                        </div>
                        <div className="m-2">
                          <div className="text-white bg-brand_black border-2 border-green-500 rounded-xl text-center p-2">
                            <p className="text-xs text-green-200">Fee Rate</p>
                            <p className="text-green-500 text-sm pt-1 flex items-center justify-center ">
                              <span>{result?.feeRate} vB/s </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full flex flex-col justify-end items-end flex-wrap">
                      <p className="w-full my-2  bg-brand_black text-white text-xl ">
                        {result?.for === "padding"
                          ? " This TX will add padding to the inscription."
                          : ""}
                      </p>
                      {selectedWallet && signedB64PSBT && (
                        <button
                          onClick={() => broadcastTx()}
                          className="w-full bg-brand_blue text-white my-2 hover:bg-blue-800 text-xs px-6 py-2 rounded "
                        >
                          Confirm TX
                        </button>
                      )}

                      <div className=" flex items-center flex-wrap justify-between w-full">
                        <button
                          onClick={() => {
                            setResult(null);
                            setSelectedUtxo([]);
                            setPSBT("");
                          }}
                          className="w-full md:w-5/12 bg-brand_red text-white text-xs py-2 px-4 rounded  hover:bg-red-800"
                        >
                          Back
                        </button>

                        <button
                          onClick={handleClose}
                          className="w-full md:w-5/12 bg-brand_red text-white text-xs py-2 px-4 rounded  hover:bg-red-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
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

export default Padding;
