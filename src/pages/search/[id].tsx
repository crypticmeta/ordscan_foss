import React, { useEffect } from "react";
import Ordinal from "components/Explorer/Ordinal";
import { useDispatch, useSelector } from "react-redux";
import { setOrdinal } from "stores/reducers/ordinalSlice";
import { load } from "cheerio";
import axios from "axios";
import Meta from "components/Layout/Meta";
function Id({ data }) {
  const dispatch = useDispatch();
  useEffect(() => {
    if (data?.id) {
      dispatch(setOrdinal(data));
    }
    return () => {
      dispatch(setOrdinal(null));
    };
  }, [data, dispatch]);

  if (!data?.id) {
    return (
      <div className="custom-container   h-screen">
        <div className="center text-white text-center text-3xl lg:px-24 items-center flex-wrap pt-12">
          INVALID ID
        </div>
      </div>
    );
  }
  if (data?.id)
    return (
      <div className="custom-container   h-screen">
        <Meta
          title={`Ordscan | Inscription #${data.inscription_number}`}
          description={`Inscription #${data.inscription_number} is ${
            data.content_type.split("/")[0] === "image" ? "an " : "a"
          } ${data.content_type.split("/")[0]} held by ${data.address} wallet`}
          image={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${data.id}`}
        />
        <Ordinal data={data} />
      </div>
    );
}
export async function getServerSideProps({ params, req, res }) {
  const { id } = params;
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=100, stale-while-revalidate=59"
  );
  let data = null;
  const inscriptionIdCheck = new RegExp(/^[0-9A-Fa-f]{64}i\d$/gm);
  const transactionIdCheck = new RegExp(/^[0-9A-Fa-f]{64}$/gm);
  const addressCheck = new RegExp(/^[bc1]{3}/gm);
  const numberCheck = new RegExp(/^[0-9]+$/gm);
  let type = "id";

  if (inscriptionIdCheck.test(id)) type = "id";
  else if (transactionIdCheck.test(id)) type = "tx";
  else if (addressCheck.test(id)) type = "address";
  else if (numberCheck.test(id) || !isNaN(id)) type = "number";
  else {
    type = "invalid";
  }

  try {
    console.log(inscriptionIdCheck.test(id), " Is inscription ID");
    console.log(transactionIdCheck.test(id), " Is Transaction ID");
    console.log(addressCheck.test(id), " Is Address");
    console.log(!isNaN(id), " Is Number");
    if (type == "id") {
      console.log("getting inscription id details...");
      const res: any = await fetch("https://ordapi.xyz/inscription/" + id);
      const response = await res.json();
      if (response) data = response;
    } else if (type == "tx") {
      console.log("getting tx details ...");
      const txRes: any = await fetch("https://ordapi.xyz/tx/" + id);
      const txResponse = await txRes.json();
      const address = txResponse.address;
      const res: any = await fetch("https://ordapi.xyz/address/" + address);
      const response = await res.json();
      if (response) {
        data = response;
        data.address = address;
      }
    } else if (type == "address") {
      const res: any = await fetch("https://ordapi.xyz/address/" + id);
      const response = await res.json();
      if (response) {
        data = response;
        data.address = id;
      }
    } else if (type == "number") {
      await axios
        .get(process.env.NEXT_PUBLIC_PROVIDER+"/inscriptions/" + id)
        .then(async (numberRes) => {
          const $ = load(numberRes.data);
          const inscription_id = $(".thumbnails")
            .children()
            .first()
            .toString()
            .split("/")[2]
            .split('"')[0];
          const res: any = await fetch(
            "https://ordapi.xyz/inscription/" + inscription_id
          );
          const response = await res.json();
          if (response) data = response;
        })
        .catch((err) => console.log(err, "axios ERR"));
    }
  } catch (e) {
    console.log(e, "ERR");
  }
  return {
    props: { data },
  };
}
export default Id;
