import React, { useCallback, useEffect, useState } from "react";
import Ordinal from "components/Explorer/Ordinal";
import { useDispatch, useSelector } from "react-redux";
import { setOrdinal } from "stores/reducers/ordinalSlice";
import { RootState } from "stores";
function Id({ data }) {
  const dispatch = useDispatch();
  
  const ordinal = useSelector((state:RootState) => state.ordinalSlice.ordinal);
  useEffect(() => {
    if (data?.id) {
      dispatch(setOrdinal(data));
    }
    return () => {
      dispatch(setOrdinal(null))
    };
  }, [data, dispatch]);
  if (!data.id) {
    return (
      <div className="custom-container   h-screen">
        <div className="center text-white text-center text-3xl lg:px-24 items-center flex-wrap pt-12">
          INVALID ID
        </div>
      </div>
    );
  }
  if (ordinal?.id)
    return (
      <div className="custom-container   h-screen">
        <Ordinal data={ ordinal} />
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

  try {
    const res: any = await fetch("https://ordapi.xyz/inscription/" + id);
    const response = await res.json();
    if (response) data = response;
  } catch (e) {
    console.error(e, "ERR");
  }
  return {
    props: { data },
  };
}
export default Id;
