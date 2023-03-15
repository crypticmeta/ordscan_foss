import usePagination from 'components/Others/Pagination';
import Link from 'next/link';
import React, { useState } from 'react'
import Image from 'next/image'
import { BsFillPatchCheckFill } from 'react-icons/bs';
import Tooltip from '@mui/material/Tooltip';
function Collections({ collections }) {
  return (
    <div className="text-white py-14 lg:pt-0 md:pr-10  overflow-hidden">
      <div className="flex justify-between">
        <h2 className="text-3xl text-center py-3">Collections</h2>
        <button>
          <Link prefetch={false} href="/collections">
            View All
          </Link>
        </button>
      </div>
      <div className="center flex-wrap">
        {collections
          .map((item: any, idx: number) => {
            if (idx <12) return <Card key={item._id} item={item} />;
          })}
      </div>
    </div>
  );
}
const Card = ({ item }) => {
  return (
    <div className={`w-full md:w-4/12 p-3 `}>
      <Link
        prefetch={false}
        href={`/collections/${encodeURIComponent(item.slug)}`}
      >
        <div className=" bg-brand_black hover:bg-gray-900 h-full w-full shadow-xl rounded-2xl flex">
          <div className="overflow-hidden relative w-[100px] h-[100px]">
            {item?.icon_type?.includes("image") ? (
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
              <iframe
                loading="lazy"
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin"
                allow=""
                className={`overflow-hidden bg-white h-[100px] w-[100px] center no-scrollbar`}
                src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.inscription_icon}`}
              ></iframe>
            )}
          </div>
          <div className="p-3 font-bold text-brand_red flex flex-col justify-evenly">
            <div className="text-xs lg:text-lg text-gray-200 flex justify-between">
              <span>{item.name}</span>
              {item.verified && (
                <Tooltip title="Verified">
                  <div>
                    <BsFillPatchCheckFill className="pl-4 text-yellow-500 text-4xl" />
                  </div>
                </Tooltip>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Supply: <span>{item.supply}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
export default Collections