import usePagination from "components/Others/Pagination";
import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";
import { BsFillPatchCheckFill } from "react-icons/bs";
import Tooltip from "@mui/material/Tooltip";
import { convert } from "utils";
const groups = [
  {
    id: "26482871f33f1051f450f2da9af275794c0b5f1c61ebf35e4467fb42c2813403i0",
    number: 1,
    min: 0,
    max: 1000,
  },
  {
    id: "e9dd57d70ce95daf70846e66ef4be197cef0f35eed9aea80b460601c6098417ei0",
    number: 1001,
    min: 1000,
    max: 5000,
  },
  {
    id: "3dc428c2e72dec052463f5a3facb62d98cd215f936265bd46e6ce7ed8cb457bdi0",
    number: 5001,
    min: 5000,
    max: 10000,
  },
  {
    id: "bd38c95183d1b2d5f82570767f40a54f3ff9bb75160aa2e7c34101d069bd3673i0",
    number: 10001,
    min: 10000,
    max: 20000,
  },
  {
    id: "0f8da6c7769c8c421523e6cd85cfea3095a58503a397b3ce2735796141ae468ai0",
    number: 20001,
    min: 20000,
    max: 50000,
  },
  {
    id: "78faf339fac5afac1affb8ccadacc6ea138dfa5bd93207e8dec71606f7bce0c5i0",
    number: 50001,
    min: 50000,
    max: 100000,
  },
];
function Hooks() {
  return (
    <div className="text-white py-14 lg:pt-0 md:pr-10  overflow-hidden">
      <div className="flex justify-between">
        <h2 className="text-3xl text-center py-3">Inscriptions</h2>
        <button>
          <Link prefetch={false} href="/collections">
            View All
          </Link>
        </button>
      </div>
      <div className="center flex-wrap">
              {groups.map((item: any, idx: number) => {
            // return <></>
                return <Card key={idx} item={ item} />;
        })}
      </div>
    </div>
  );
}
const Card = ({item }) => {
      const [show, setShow] = useState(true);
      const [videoError, setVideoError] = useState(false);
  return (
    <div className={`w-full md:w-4/12 p-3 `}>
      <Link
        prefetch={false}
        href={`/inscriptions?min=${encodeURIComponent(
          item.min
        )}&max=${encodeURIComponent(item.max)}`}
      >
        <div className=" bg-brand_black hover:bg-gray-900 h-full w-full shadow-xl rounded-2xl flex">
          <div className="overflow-hidden relative w-[100px] h-[100px]">
            {show ? (
              <Image
                style={{ imageRendering: "pixelated" }}
                unoptimized
                loading="lazy"
                className={`overflow-hidden object-cover ${!show && "hidden"}`}
                fill
                placeholder={"blur"}
                blurDataURL={"favicon.ico"}
                onError={() => setShow(false)}
                alt="ordinal"
                src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.id}`}
              />
            ) : (
              <>
                {!videoError ? (
                  <video muted autoPlay onError={() => setVideoError(true)}>
                    <source
                      src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.id}`}
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
                    src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.id}`}
                  ></iframe>
                )}
              </>
            )}
          </div>
          <div className="p-3 font-bold text-brand_red flex flex-col justify-evenly">
            <div className="text-xs lg:text-lg text-gray-200 flex justify-between">
              <span>Below {convert(item.max)}</span>
            </div>
            <div className="text-xs text-gray-500">
              Range: <span>#{item.min}</span> - <span>#{item.max}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
export default Hooks;
