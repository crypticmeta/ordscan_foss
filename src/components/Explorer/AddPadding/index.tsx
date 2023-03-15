import { Modal, TextField, Tooltip } from "@mui/material";
import copy from "copy-to-clipboard";
import React, { useCallback, useState } from "react";
import { BsFillCheckCircleFill } from "react-icons/bs";
import QRCode from "react-qr-code";
import { Inscription, UTXO } from "types";
import { addressHasTxInMempool, signPSBTUsingWallet } from "utils";
import { Mixpanel } from "utils/mixpanel";
import { notify } from "utils/notifications";
import { addPaddingPSBT, paddingUTXOCheck } from "utils/Ordinals/addPadding";
interface OrdinalProp {
  data: Inscription;
  saleData: any;
}

function Padding({ data, saleData }: OrdinalProp): JSX.Element {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<any>({});
  const [selectedUtxo, setSelectedUtxo] = useState<UTXO>(null);
  const [psbt, setPSBT] = useState("");
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const utxoCheck = async () => {
    if (await addressHasTxInMempool(data.address)) {
      handleClose();
      notify({ type: "error", message: "Previous Tx is yet to confirm." });
      return;
    }
    const result = await paddingUTXOCheck(
      data.address,
      Number(data.output_value)
    );
    if (result.status === "error") {
      handleClose();
      notify({ type: "error", message: result.message });
    } else if (result.status === "success") {
      setResult(result.data.paymentUtxos);
      setSelectedUtxo(result.data.paymentUtxos[0]);
    }
  };
  const addPadding = async () => {
    const result = await addPaddingPSBT(
      data.address,
      data.output.split("/")[2],
      data.inscription_number,
      Number(data.output_value)
    );
    if (result.status === "error") {
      handleClose();
      notify({ type: "error", message: result.message });
    } else if (result.status === "success") {
      setPSBT(result.data.psbt);
      setResult(result.data);
      Mixpanel.track("AddPaddingPSBTGenerated", {
        data,
        saleData,
        psbt: result.data.psbt,
      });
    }
  };

  const signWithUnisatWallet = useCallback(async () => {
    //@ts-ignore
    const unisat: any = window?.window?.unisat || null;
    if (!unisat) {
      notify({ type: "error", message: "No unisat extension found" });
    }

    const result = await signPSBTUsingWallet(psbt, unisat);

    if (result.status === "error") {
      notify({ type: "error", message: result.message });
    } else {
      notify({ type: "success", message: result.message });      
      handleClose();
      copy(result.data.signedPSBT);
      notify({ type: "success", message: "Signed Tx has been copied. Open sparrow and broadcast the TX." });  
    }
  }, [psbt]);
  return (
    <>
      <div className="center flex-col my-2">
        <button
          onClick={handleOpen}
          className="bg-brand_black text-white text-xl px-6 py-2 rounded hover:border-brand_red hover:text-brand_red border-2"
        >
          Add padding to this Inscription
          <span className="text-xs text-brand_red"> Beta</span>
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
                Add Padding to{" "}
                <span className="text-brand_blue">
                  Inscription {data.inscription_number}
                </span>
              </h2>
              {psbt ? (
                <div className="form p-2">
                  <div>
                    <TextField
                      id="filled-basic"
                      label="Sign and broadcast this tx to create dummy UTXO"
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
                    </div>
                    <div className="flex flex-col justify-end items-end flex-wrap">
                      <p className="w-full mx-6 my-2 z-[1] left-0 bg-brand_black text-white text-xl ">
                        {result?.for === "padding"
                          ? " This TX will add padding to the inscription."
                          : ""}
                      </p>
                      <button
                        onClick={() => signWithUnisatWallet()}
                        className="w-full mx-6 my-2 z-[1] left-0 bg-yellow-300 text-yellow-900 text-xs px-6 py-2 rounded  hover:bg-yellow-400"
                      >
                        Sign Using UNISAT Wallet
                      </button>

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
              ) : (
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
                        {result.map((item, idx) => (
                          <div
                            key={item.txid}
                            className="w-6/12 md:w-4/12  p-2 cursor-pointer relative"
                            onClick={() => setSelectedUtxo(item)}
                          >
                            <Tooltip title="This UTXO will be added as padding">
                              <div className="absolute top-[2px] right-[2px]">
                                {item.txid === selectedUtxo?.txid && (
                                  <BsFillCheckCircleFill className="text-green-500 ml-2" />
                                )}
                              </div>
                            </Tooltip>
                            <div className="text-white border-brand_red border-2 rounded-xl bg-brand_black hover:bg-gray-900 text-center p-2">
                              <p className="text-xs text-gray-500">
                                Balance {idx + 1}
                              </p>
                              <p className=" text-sm pt-1 flex items-center justify-center capitalize">
                                <span>{item.value} </span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-center pt-4 text-lg ">
                        <span className="text-brand_blue">Congrats!</span> You
                        have funds to add padding!
                      </p>
                    </div>
                  ) : (
                    <p>
                      Make sure inscription address has enough balance to add
                      padding.
                    </p>
                  )}
                </div>
              )}
              {!psbt ? (
                <div className="flex justify-center flex-wrap">
                  {!psbt && (
                    <button
                      onClick={() =>
                        result?.length ? addPadding() : utxoCheck()
                      }
                      className="m-2 z-[1] left-0 bg-brand_blue text-white text-xl px-6 py-2 rounded hover:bg-blue-900"
                    >
                      {result?.length ? "Add Padding" : "Check Balance"}
                    </button>
                  )}

                  <button
                    onClick={handleClose}
                    className="m-2 z-[1] left-0 bg-brand_red text-white text-xl px-6 py-2 rounded  hover:bg-red-800"
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

export default Padding;
