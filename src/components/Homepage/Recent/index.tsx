import React, { useState } from "react";
import Slider from "react-slick";
import Image from "next/image";
import Link from "next/link";
import NextArrow from "components/Others/NextArrow";
import PrevArrow from "components/Others/PrevArrow";
function Recent({ recent }) {
  var settings = {
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    dots: false,
    infinite: false,
    autoplay: true,
    speed: 1000,
    slidesToShow: 4,
    slidesToScroll: 4,
    initialSlide: 0,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: true,
          dots: false,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          initialSlide: 2,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };
  return (
    <div className=" py-14 lg:pt-0 md:pr-10  overflow-hidden">
      <div className="">
        <h2 className="text-3xl text-center py-3">Recently Inscribed</h2>
      </div>
      <div className="w-full">
        <Slider {...settings} className="w-full">
          {recent?.map((item: any, idx: number) => {
            if (idx < 40) return <Card key={item.guid} item={item} />;
          })}
        </Slider>
      </div>
      <div className="center">
        <button className="bg-brand_blue brightness-90 hover:brightness-100 text-white text-xs lg:text-xl capitalize font-thin px-6 py-1 mt-3 lg:mt-12">
          <Link prefetch={false} href={`/explorer`}>
            View All
          </Link>
        </button>
      </div>
    </div>
  );
}
const Card = ({ item }) => {
  const [show, setShow] = useState(true);
  const [videoError, setVideoError] = useState(false);
  return (
    <Link
      prefetch={false}
      href={`/search/${encodeURIComponent(item.guid.split("/")[2])}`}
    >
      <div className={`w-[300px] h-[400px] p-3 overflow-hidden `}>
        <div className="bg-brand_black h-full w-full shadow-xl rounded-2xl">
          <div className="h-[280px] overflow-hidden relative">
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
                src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${
                  item.guid.split("/")[2]
                }`}
              />
            ) : (
              <>
                {!videoError ? (
                  <video muted autoPlay onError={() => setVideoError(true)}>
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
            <p className="pb-3 text-white">{item.title}</p>
            <button className="bg-brand_blue text-white uppercase font-thin px-4 py-2 text-xs">
              View Details
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};



export default Recent;
