import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import useDataStore from "stores/useDataStore";
import axios from "axios";
import { notify } from "utils/notifications";
function Index() {
  const setLoadingtrue = useDataStore((state) => state.setLoadingTrue);
  const setLoadingFalse = useDataStore((state) => state.setLoadingFalse);
  const [id, setId] = useState( "" );
  const [sats, setSats] = useState(10);
  useEffect(() => {
    if (localStorage.getItem("ordscan-alert-email")) {
      setId(localStorage.getItem("ordscan-alert-email"));
    }
  }, [])
  
  const handleSubmit = useCallback(async () => {
    if (sats && id) {
      setLoadingtrue();
      const body = {
        email: id,
        fee: sats,
        compare: "<",
      };
      await axios
        .post("/api/add-email", body)
        .then((res) => {
          if (res.status === 200) {
            localStorage.setItem("ordscan-alert-email", id);
            localStorage.setItem("ordscan-alert-sats", String(sats));
            notify({ type: "success", message: "Submitted Successfully" });
          }
          setLoadingFalse();
        })
        .catch((err) => {
          setLoadingFalse();
          notify({ type: "error", message: "Some error occurred" });
          console.error(err, "ERR");
        });
    } else {
      if (!sats)
        notify({
          type: "error",
          message: "Fee missing in Sats/vB. Enter a number",
        });
      if (!id) notify({ type: "error", message: "Email missing" });
    }
  }, [id, sats, setLoadingFalse, setLoadingtrue]);

  return (
    <div className="custom-container ">
      <div className="flex items-center flex-wrap justify-center md:justify-between w-full">
        <div className="w-full md:w-3/12 pr-3">
          <div className="bg-brand_black w-full h-full flex sm:px-6 px-3 py-1 justify-between rounded-2xl  border-white border-2 items-center my-3 lg:my-0">
            <input
              type="number"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
              placeholder={"Enter Sats/vB"}
              value={sats}
              onChange={(e) => setSats(Number(e.target.value))}
              className=" text-xs md:text-base w-full py-2 bg-transparent focus:outline-none text-white"
            />
          </div>
        </div>
        <div className="bg-brand_black w-full h-full md:w-6/12 lg:w-7/12 flex sm:px-6 px-3 py-1 justify-between rounded-2xl  border-white border-2 items-center my-3 lg:my-0">
          <input
            type="email"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
            placeholder={"Enter email here"}
            value={id}
            onChange={(e) => setId(e.target.value)}
            className=" text-xs md:text-base w-full py-2 bg-transparent focus:outline-none text-white"
          />
        </div>
        <div className="w-full lg:w-2/12 md:pr-3 h-full flex items-center lg:justify-end">
          <button
            onClick={handleSubmit}
            disabled={id == ""}
            className="m-3 bg-white text-brand_black brightness-150 md:text-xl cursor-pointer rounded-2xl uppercase font-thin px-4 py-2 text-xs"
          >
            Submit
          </button>
        </div>
      </div>
      <p className="text-white text-sm text-center pt-3">
        You will receive an alert on{" "}
        <span className="text-brand_blue">{id || " Your Email "}</span> when the
        BTC Tx Fee goes below{" "}
        <span className="text-brand_red">{sats || 1} Sats/vB</span> . Once a
        day.
      </p>
    </div>
  );
}

export default Index;
