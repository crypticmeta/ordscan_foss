import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import Ordinal from "components/Explorer/Ordinal";
import useDataStore from "stores/useDataStore";
import CircularProgress from "@mui/material/CircularProgress";
import { notify } from "utils/notifications";
import { Inscription } from "types";
 
function Id() {
  const [list, setList] = useState([])
  const loading = useDataStore((state) => state.loading);
  const setLoadingtrue = useDataStore((state) => state.setLoadingTrue);
  const setLoadingFalse = useDataStore((state) => state.setLoadingFalse);
  const router = useRouter();
    const [data, setData] = useState<Inscription | null>(null);
    const fetchData = useCallback(async () => {
      setLoadingtrue();
      await axios
        .get("https://ordinals.com/inscriptions/" + router.query.id)
        .then(async (res) => {
          const tempIds= []
          const dataArr = res.data
            .slice(res.data.search("href=/inscription/"))
            .split("href=/inscription/");
          dataArr.map((item, idx) => {
            if(idx && idx<13 )
            {
              tempIds.push(item.split("><")[0]);
            }
          })

              const inscription = res.data.slice(
                res.data.search("href=/inscription/") + 18
              );
              const inscriptionId = inscription.slice(
                0,
                inscription.search(">")
          );
          setList(tempIds)
              await fetchInscriptionData(inscriptionId)
          setLoadingFalse();
        })
        .catch((err) => {
          setLoadingFalse();
          notify({ type: "error", message: "invalid ID" });
          console.error(err, "ERR");
        });
    }, [router.query]);

    const fetchInscriptionData = useCallback(async (inscriptionId) => {
      setLoadingtrue();
      await axios
        .get("https://ordapi.xyz/inscription/" + inscriptionId)
        .then((res) => {
          if (res.data?.id) setData(res.data);
          setLoadingFalse();
        })
        .catch((err) => {
          setLoadingFalse();
          notify({ type: "error", message: "invalid ID" });
          console.error(err, "ERR");
        });
    }, []);
  


  useEffect(() => {
    if (router.query?.id) fetchData();
  }, [fetchData, router.query]);

  if (!data) {
    return (
      <div className="custom-container   h-screen">
        {loading ? (
          <div className="text-brand_red h-50vh center">
            <CircularProgress size={70} color="inherit" />
          </div>
        ) : (
          <div className="center text-white text-center text-3xl lg:px-24 items-center flex-wrap">
            INVALID ID
          </div>
        )}
      </div>
    );
  }
  if (data?.id)
    return (
      <div className="custom-container   h-screen">
        <Ordinal data={data} />
      </div>
    );
}

export default Id;
