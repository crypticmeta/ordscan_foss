import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import usePagination from "components/Others/Pagination";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
function Explorer() {
  const [data, setData] = useState([]);
  const fetchRecent = useCallback(async () => {
    await axios
      .get("https://ordapi.xyz/feed")
      .then((res) => {
        setData(res.data.rss.channel.item);
      })
      .catch((err) => console.error(err, "ERR"));
  }, []);

  useEffect(() => {
    fetchRecent();
  }, []);

  
  const [itemPerPage, setItemPerPage] = useState(12);
  let [page, setPage] = useState(1);
  const count = Math.ceil(data.length / itemPerPage);
  const _DATA = usePagination(data, itemPerPage);

  const handleChange = (e, p) => {
    setPage(p);
    _DATA.jump(p);
  };

  return (
    <div className="custom-container  text-white">
      
      <h2 className="text-3xl text-center py-3">Recent Ordinals</h2>
      <Stack spacing={2}>
        <Pagination
          count={count}
          size={"large"}
          variant="outlined"
          shape="rounded"
          onChange={handleChange}
        />
      </Stack>
      <div className="flex justify-center lg:justify-between items-center flex-wrap">
        {_DATA?.currentData().map((item, idx) => {
          if (idx < 31) return <Card item={item} key={item.guid} />;
        })}
      </div>
      {/* <Stack spacing={2}>
        <Pagination
          count={count}
          size={"large"}
          variant="outlined"
          shape="rounded"
          onChange={handleChange}
        />
      </Stack> */}
    </div>
  );
}
const Card = ({ item }) => {
  const [show, setShow] = useState(true);
  const [videoError, setVideoError] = useState(false);
  return (
    <div className={`w-[300px] h-[400px] p-3 overflow-hidden `}>
      <div className=" bg-brand_black h-full w-full shadow-xl rounded-2xl">
        <div className="h-[280px] overflow-hidden relative">
          {show ? (
            <Image
              unoptimized
              className={`overflow-hidden object-cover`}
              fill
              style={{ imageRendering: "pixelated" }}
              placeholder={"blur"}
              blurDataURL={"favicon.ico"}
              onError={() => setShow(false)}
              alt="ordinal"
              src={`https://ordinals.com/content/${item.guid.split("/")[2]}`}
            />
          ) : (
            <>
              {!videoError ? (
                <video muted autoPlay onError={()=>setVideoError(true)}>
                  <source
                    src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${
                      item.guid.split("/")[2]
                    }`}
                  />
                </video>
              ) : (
                <iframe
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  sandbox="allow-scripts allow-same-origin"
                  className={`overflow-hidden bg-white h-full w-full center ${
                    show && "hidden"
                  }`}
                  allow="autoplay encrypted-media picture-in-picture media-src"
                  src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${
                    item.guid.split("/")[2]
                  }`}
                ></iframe>
              )}
            </>
          )}
        </div>
        <div className="p-3 uppercase font-bold text-brand_red">
          <p className="pb-3">{item.title}</p>
          <button className="gradient text-white uppercase font-thin px-4 py-2 text-xs">
            <Link
              href={`/search/${encodeURIComponent(item.guid.split("/")[2])}`}
            >
              View Details
            </Link>
          </button>
        </div>
      </div>
    </div>
  );
};
export default Explorer;
