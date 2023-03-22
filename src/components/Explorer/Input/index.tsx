import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Collection } from "types";
import Image from "next/image";
import { FaBitcoin } from "react-icons/fa";

import { useDispatch } from "react-redux";
import { setOrdinal } from "stores/reducers/ordinalSlice";
function Index() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [id, setId] = useState("");
  const [collections, setCollections] = useState<Collection[] | null>(null);

  useEffect(() => {
    if (router.query?.id) {
      setId(router.query.id + "");
    } else {
      setId("");
    }
  }, [router]);

  const handleIDChange = (event: any) => {
    setId(event.target.value);
  };

  const searchCollection = useCallback(async () => {
    await axios
      .get(
        `${process.env.NEXT_PUBLIC_API}/collection?name=${id}&collectionLive=true`
      )
      .then((res) => {
        setCollections(res.data.data.collections);
      })
      .catch((err) => {
        console.error(err.response, "err");
      });
  }, [id]);

  useEffect(() => {
    if (id) searchCollection();
  }, [id]);

  return (
    <div className="custom-container flex items-center flex-wrap justify-center md:justify-between w-full relative">
      <div
        className={`bg-brand_black w-full h-full flex sm:px-6 px-3 py-1 justify-between rounded-2xl  border-white border-2 items-center my-3 lg:my-0 relative`}
      >
        <input
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              router.push(`/search/${id}`);
            }
          }}
          value={id}
          placeholder={"Enter ID / Address / Transaction / Number / Collection"}
          onChange={(e) => handleIDChange(e)}
          className=" text-xs md:text-base flex-1 py-2 bg-transparent focus:outline-none text-white"
        />
        <div className="flex items-center lg:justify-end">
          <button
            onClick={(e) => dispatch(setOrdinal(null))}
            disabled={id == ""}
            className=" bg-white text-brand_black brightness-150 rounded-full uppercase font-thin cursor-pointer hover:bg-gray-600 px-4 py-2 text-xs"
          >
            <Link href={`/search/${encodeURIComponent(id)}`}>Search</Link>
          </button>
        </div>
        {id && collections?.length > 0 && (
          <div className="absolute left-0 right-0 top-[130%] rounded bg-brand_black z-[10] max-h-[50vh] overflow-y-scroll small-scrollbar text-white">
            {collections?.map((item) => (
              <Card
                item={item}
                key={item._id}
                admin={router?.asPath.includes("admin")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
const Card = ({ item, admin }) => {
  return (
    <div className={`w-full`}>
      <Link
        prefetch={false}
        href={`${admin ? "/admin" : ""}/collections/${encodeURIComponent(
          item.slug
        )}`}
      >
        <div className=" hover:bg-gray-900 w-full p-3 cursor-pointer border-b-2 border-black h-full flex">
          <div className="overflow-hidden relative w-[50px] h-[50px]">
            {item.icon_type.includes("image") ? (
              <Image
                loading="lazy"
                style={{ imageRendering: "pixelated" }}
                unoptimized
                className={`overflow-hidden object-cover`}
                fill
                placeholder={"blur"}
                blurDataURL={"favicon.ico"}
                alt="ordinal"
                src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.inscription_icon}`}
              />
            ) : (
              <>
                {item.icon_type.includes("video") ? (
                  <video
                    muted
                    autoPlay
                    className={`overflow-hidden object-contain w-full h-full`}
                  >
                    <source
                      src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.inscription_icon}`}
                    />
                  </video>
                ) : (
                  <iframe
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    sandbox="allow-scripts allow-same-origin"
                    allow=""
                    className={`overflow-hidden bg-white h-[100px] w-[100px] center no-scrollbar`}
                    src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.inscription_icon}`}
                  ></iframe>
                )}
              </>
            )}
          </div>
          <div className="p-3 font-bold text-yellow-500 flex justify-between w-full items-center">
            <div className="flex items-center">
              <div className="text-xs lg:text-lg text-gray-200 flex justify-between">
                <span>{item.name}</span>
              </div>
              <div className="text-xs text-gray-500 pl-3 hidden md:block">
                <span>{item.supply}</span> Items
              </div>
            </div>
            <FaBitcoin className="text-xl hidden md:block" />
          </div>
        </div>
      </Link>
    </div>
  );
};
export default Index;
