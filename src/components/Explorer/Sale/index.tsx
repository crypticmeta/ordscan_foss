import React, { useCallback, useEffect, useState } from "react";
import copy from "copy-to-clipboard";
import Modal from "@mui/material/Modal";
import { TextField } from "@mui/material";
import { btcToSat, nostrOrderEventKind, nostrRelayUrl,
  signPSBTUsingWallet, } from "../../../utils";
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
interface OrdinalProp {
  data: Inscription;
  setSaleData: Function;
}
function Sale({ data, setSaleData }: OrdinalProp): JSX.Element {
  const relay = relayInit(nostrRelayUrl);
  const [signedTx, setSignedTx] = useState("");
  const [price, setPrice] = useState("");
  const [sellerAddr, setSellerAdd] = useState(data.address);
  const [open, setOpen] = React.useState(false);
  const [psbt, setPSBT] = useState("");
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const generateSalePSBT = async () => {
    const psbt = await generatePSBTListingInscriptionForSale(
      data.output.split("/")[2],
      btcToSat(Number(price)),
      sellerAddr
    ).catch((err) => console.error(err, "Error generating PSBT"));
    Mixpanel.track("SellPSBTGenerated", { data, psbt: psbt });

    setPSBT(psbt || "");
  };

  const submitSignedTX = async () => {
    const result = await submitSignedSalePsbt(signedTx, psbt);
    if (result.status === "success" && result.data?.signedPSBT) {
      try {
        await publishPSBT(result?.data?.signedPSBT);
      } catch (e) {}
    } else if (result.status === "error") {
      notify({ type: result.status, message: result.message });
    }
  };

  useEffect(() => {
    setPSBT("");
    setSignedTx("");
    setSellerAdd(data.address);
    return () => {
      setPSBT("");
      setSignedTx("");
      setSellerAdd(data.address);
    };
  }, [data]);

 
 
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
         ["x", "ordscan"], // Exchange name (e.g. "openordex")
       ],
       content: signedPsbt,
     };
     const dbData = {
       pubkey: pk,
       created_at: event.created_at,
       network: "mainnet",
       type: "sell",
       inscription_id: data.id,
       inscription_output: data.output.split("/")[2],
       price: btcToSat(Number(price)),
       marketplace: "Ordscan",
       signedPsbt,
       event_id: getEventHash(event),
     };
     event.id = getEventHash(event);
     event.sig = signEvent(event, sk);
     let pub = relay.publish(event);
     pub.on("ok", async () => {
       console.log(`${relay.url} has accepted our event`);
       await axios
         .post(`${process.env.NEXT_PUBLIC_API}/order/create`, dbData)
         .catch((e) => {});
       Mixpanel.track("Listed", dbData);
       notify({
         type: "succes",
         message: "Successfully Listed the inscription for sale",
       });
       setSaleData( {
        id: data.id,
        inscriptionId: data.id,
        price,
        signedPsbt: signedPsbt,
        createdAt: new Date().toDateString(),
        type: "sell",
        utxo: data.output.split("/")[2],
      })
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
      try {
        console.log(result?.data?.signedPSBT === psbt);
        await publishPSBT(result?.data?.signedPSBT);
      } catch (e) {
        console.log(e, "error publishing");
      }
    }
  }, [psbt, publishPSBT]);
 
  return (
    <>
      <div className="center flex-col">
        <button
          disabled={Number(data.output_value) < 6000}
          onClick={handleOpen}
          className={`first-letter:mb-2 z-[1] left-0 ${
            Number(data.output_value) < 6000
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-brand_blue "
          }  text-white text-xl px-6 py-2 rounded `}
        >
          {Number(data.output_value) > 6000 ? "List Now  " : "Add Padding to List   "}
          <span className="text-xs text-blue-200">Beta</span>
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
              {psbt ? (
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
                      <button
                        className="m-2 z-[1] left-0 bg-brand_blue text-white text-xs px-6 py-2 rounded hover:bg-blue-700 border-2"
                        onClick={() => signWithUnisatWallet()}
                      >
                        Sign With Unisat Wallet
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
              ) : (
                <div className="form p-6">
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
                      label="Address to receive payment"
                      variant="filled"
                      fullWidth
                      value={sellerAddr}
                      onChange={(e) => setSellerAdd(e.target.value)}
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end flex-wrap">
                <button
                  onClick={() => (psbt ? submitSignedTX() : generateSalePSBT())}
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
