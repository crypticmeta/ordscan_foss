import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Ordinal from "components/Explorer/Ordinal";
import useDataStore from "stores/useDataStore";
import CircularProgress from "@mui/material/CircularProgress";
import { Inscription } from "types";

function Id() {
  const loading = useDataStore((state) => state.loading);
  const setLoadingtrue = useDataStore((state) => state.setLoadingTrue);
  const setLoadingFalse = useDataStore((state) => state.setLoadingFalse);
  const router = useRouter();
  const [data, setData] = useState<Inscription | null>(null);
  const fetchData = useCallback(async () => {
    setLoadingtrue();
    await axios
      .get("https://ordapi.xyz/tx/" + router.query.id)
      .then(async (txres) => {
        if (txres.data?.address) {
          await axios
            .get("https://ordapi.xyz/address/" + txres.data?.address)
            .then((res) => {
              if (res.data[0]?.id) {
                res.data[0].address = txres.data?.address;
                setData(res.data[0]);
              }
              setLoadingFalse();
            })
            .catch((err) => {
              setLoadingFalse();
              console.error(err, "ERR");
            });
        }
        setLoadingFalse();
        
      })
      .catch((err) => {
        setLoadingFalse();
        console.error(err, "TX ERR");
      });
  }, [router.query]);

  useEffect(() => {
    if (router.query?.id) fetchData();
  }, [fetchData, router.query]);

  if (data?.id)
    return (
      <div className="custom-container   h-screen">
        <Ordinal data={data} />
      </div>
    );
  else {
    return (
      <div className="custom-container   h-screen">
        {loading ? (
          <div className="text-brand_red h-50vh center">
            <CircularProgress size={70} color="inherit" />
          </div>
        ) : (
          <div className="center text-white text-center text-3xl lg:px-24 items-center flex-wrap">
            INVALID TRANSACTION
          </div>
        )}
      </div>
    );
  }
}

export default Id;
