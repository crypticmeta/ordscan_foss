import React, { useCallback,  useState } from "react";
import copy from "copy-to-clipboard";
import Modal from "@mui/material/Modal";
import { TextField } from "@mui/material";
import Link from "next/link";
import { addressHasTxInMempool, getAddressMempoolTxIds, signPSBTUsingWalletAndBroadcast } from "../../../utils";
import { notify } from "utils/notifications";
import QRCode from "react-qr-code";
import { Inscription, Order } from "types";
import { buyInscriptionPSBT } from "utils/Ordinals/buyOrdinal";
import { Mixpanel } from "utils/mixpanel";
const baseMempoolUrl = "https://mempool.space";
interface OrdinalProp {
  data: Inscription;
  saleData: Order;
}
function Buy({ data, saleData }: OrdinalProp): JSX.Element {
  const [buyerAddr, setBuyerAddr] = useState("");
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<any>({});
  const [psbt, setPSBT] = useState("");
  const handleOpen = () => {
    if (localStorage.getItem("payerAddress")) {
      setBuyerAddr(localStorage.getItem("payerAddress"));
    } 
    setOpen(true);
  };
  const handleClose = () => setOpen(false);
  const buy = async () => {
    if (await addressHasTxInMempool(buyerAddr)) {
      handleClose();
      notify({ type: "error", message: "Previous Tx is yet to confirm." });
      return;
    }
    const result = await buyInscriptionPSBT(
      buyerAddr,
      Number(saleData.price),
      data.output.split("/")[2],
      data.inscription_number,
      Number(data.output_value),
      saleData.signedPsbt
    );
    if (result.status === "error") {
      handleClose();
      notify({ type: "error", message: result.message });
    } else if (result.status === "success") {
      setPSBT(result.data.psbt);
      setResult(result.data);
      Mixpanel.track("BuyPSBTGenerated", { data, saleData, psbt: result.data.psbt });
      // waitForTx();
    }
  };

  // const waitForTx = useCallback(async () => {
  //   // handleClose();
  //   const payerCurrentMempoolTxIds = await getAddressMempoolTxIds(buyerAddr);
  //   notify({ type: "info", message: "waiting for tx in mempool" });
  //   const interval = setInterval(async () => {
  //     const txId = (await getAddressMempoolTxIds(buyerAddr)).find(
  //       (txId) => !payerCurrentMempoolTxIds.includes(txId)
  //     );


  //     if (txId) {
  //       {
  //         clearInterval(interval);
  //         Mixpanel.track("Bought", {data,saleData, purchaseTx: txId});
  //         notify({
  //           type: "success",
  //           message: `Buy Ordinal Tx Confimed. check <a href="${baseMempoolUrl}/tx/${txId}" target="_blank">here</a>.`,
  //         });
  //       }
  //     }
  //   }, 5_000);
  // }, [buyerAddr, data, saleData]);

    
  const signWithUnisatWallet = useCallback(async () => {
    //@ts-ignore
    const unisat: any = window?.window?.unisat || null;
    if (!unisat) {
      notify({ type: "error", message: "No unisat extension found" });
    }

    const result: any = await signPSBTUsingWalletAndBroadcast(psbt, unisat);

    if (result.status === "error") {
      notify({ type: "error", message: result.message });
    } else {
      handleClose();
      notify({
        type: "success",
        message: "Tx successfully broadcasted. TXID: " + result.data.tx,
      });
    }
  }, [psbt]);

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
        <button
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
                Buying{" "}
                <span className="text-brand_red">
                  Inscription {data.inscription_number}
                </span>{" "}
                For {saleData.price.toFixed(5)} BTC
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
                      <p className="pt-3 text-xs text-white">
                        Waiting for Transaction in mempool
                      </p>
                    </div>
                    <div className="flex flex-col justify-end items-end flex-wrap">
                      <p className="w-full mx-6 my-2 z-[1] left-0 bg-brand_black text-white text-xl ">
                        {result?.for === "utxo"
                          ? " This TX will generate dummy UTXO. Redo the process once this TX is confirmed."
                          : "Sign this Transaction to buy the Ordinal"}
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
              ) : (
                <div className="form p-6">
                  <div>
                    <TextField
                      id="filled-basic"
                      label="Buyer Address"
                      variant="filled"
                      fullWidth
                      value={buyerAddr}
                      onChange={(e) => setBuyerAddr(e.target.value)}
                    />
                  </div>
                  {/* <div className="mb-4">
                  <TextField
                    id="filled-basic"
                    label="Receive Inscription Address"
                    variant="filled"
                    fullWidth
                    value={buyerAddr}
                    // onChange={(e) => setPrice(e.target.value)}
                  />
                </div> */}
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
