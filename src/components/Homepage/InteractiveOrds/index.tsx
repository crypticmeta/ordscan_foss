import React from "react";
import Slider from "react-slick";
import Image from "next/image";
import Link from "next/link";
import { Collection } from "types";
function Featured({ featured }) {
  var settings = {
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
    dots: true,
    infinite: false,
    autoplay: true,
    speed: 500,
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
          dots: true,
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
    <div className=" py-14 lg:py-0 md:pr-10  overflow-hidden">
      <div className="">
        <h2 className="text-3xl text-center py-3">Featured Collections</h2>
      </div>
      <div className="w-full">
        <Slider {...settings} className="w-full">
          {featured?.map((item: Collection) => (
            <div
              key={item._id}
              className={`w-[300px] h-[400px] p-3 overflow-hidden`}
            >
              <div className=" services-gradient shadow-xl rounded-2xl  border-2 border-brand_red overflow-hidden">
                <div className="h-[280px] overflow-hidden relative">
                  <Image
                    unoptimized
                    className={`overflow-hidden object-cover `}
                    fill
                    placeholder={"blur"}
                    blurDataURL={"favicon.ico"}
                    alt="ordinal"
                    src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.coverImg}`}
                  />
                </div>
                <div className="p-3 uppercase font-bold text-brand_red">
                  <p className="pb-3">{item?.name}</p>
                  <button className="gradient text-white uppercase font-thin px-4 py-2 text-xs">
                    <Link
                      href={`/collections/${encodeURIComponent(item.slug)}`}
                    >
                      View Details
                    </Link>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}
function SamplePrevArrow(props) {
  const { className, style, onClick } = props;

  return (
    <div
      onClick={onClick}
      style={{ zIndex: 200 }}
      // style={{ ...style }}
      className={
        "arrows prev absolute top-0 bottom-0 left-[-40px] lg:left-0 z-50 flex cursor-pointer w-[150px] flex-col justify-center"
      }
    >
      <svg viewBox="0 0 130 130" className="fill-brand_red">
        <defs>
          <filter
            id="Ellipse_691"
            x="0"
            y="0"
            width="130"
            height="130"
            filterUnits="userSpaceOnUse"
          >
            <feOffset dy="12" in="SourceAlpha" />
            <feGaussianBlur stdDeviation="15" result="blur" />
            <feFlood floodColor="#d82744" floodOpacity="0.502" />
            <feComposite operator="in" in2="blur" />
            <feComposite in="SourceGraphic" />
          </filter>
        </defs>
        <g id="Group_228" data-name="Group 228" transform="translate(45 33)">
          <g
            transform="matrix(1, 0, 0, 1, -45, -33)"
            filter="url(#Ellipse_691)"
          >
            <g
              id="Ellipse_691-2"
              data-name="Ellipse 691"
              transform="translate(45 33)"
              fill="#d82744"
              stroke="#d82744"
              strokeWidth="1"
            >
              <circle cx="20" cy="20" r="20" stroke="none" />
              <circle cx="20" cy="20" r="19.5" fill="none" />
            </g>
          </g>
          <path
            id="Icon_awesome-arrow-down"
            data-name="Icon awesome-arrow-down"
            d="M14.57,9.21l.794-.794a.855.855,0,0,0,0-1.212L8.416.252A.855.855,0,0,0,7.2.252L.252,7.2a.855.855,0,0,0,0,1.212l.794.794A.859.859,0,0,0,2.273,9.2L6.378,4.887V15.164a.856.856,0,0,0,.858.858H8.38a.856.856,0,0,0,.858-.858V4.887L13.344,9.2A.853.853,0,0,0,14.57,9.21Z"
            transform="translate(11.978 27.616) rotate(-90)"
            fill="#fff"
          />
        </g>
      </svg>
    </div>
  );
}
function SampleNextArrow(props) {
  const { className, style, onClick } = props;

  return (
    <div
      onClick={onClick}
      style={{ zIndex: 200 }}
      // style={{ ...style }}
      className={
        "arrows next absolute top-0 bottom-0 right-[-40px] lg:right-0 z-50 flex cursor-pointer w-[150px] flex-col justify-center"
      }
    >
      <svg viewBox="0 0 130 130">
        <defs>
          <filter
            id="Ellipse_691"
            x="0"
            y="0"
            width="130"
            height="130"
            filterUnits="userSpaceOnUse"
          >
            <feOffset dy="12" in="SourceAlpha" />
            <feGaussianBlur stdDeviation="15" result="blur" />
            <feFlood floodColor="#d82744" floodOpacity="0.502" />
            <feComposite operator="in" in2="blur" />
            <feComposite in="SourceGraphic" />
          </filter>
        </defs>
        <g id="Group_229" data-name="Group 229" transform="translate(45 33)">
          <g
            transform="matrix(1, 0, 0, 1, -45, -33)"
            filter="url(#Ellipse_691)"
          >
            <g
              id="Ellipse_691-2"
              data-name="Ellipse 691"
              transform="translate(45 33)"
              fill="#d82744"
              stroke="#d82744"
              strokeWidth="1"
            >
              <circle cx="20" cy="20" r="20" stroke="none" />
              <circle cx="20" cy="20" r="19.5" fill="none" />
            </g>
          </g>
          <path
            id="Icon_awesome-arrow-down"
            data-name="Icon awesome-arrow-down"
            d="M14.57,6.812l.794.794a.855.855,0,0,1,0,1.212L8.416,15.77a.855.855,0,0,1-1.212,0L.252,8.818a.855.855,0,0,1,0-1.212l.794-.794a.859.859,0,0,1,1.227.014l4.105,4.309V.858A.856.856,0,0,1,7.236,0H8.38a.856.856,0,0,1,.858.858V11.136l4.105-4.309A.853.853,0,0,1,14.57,6.812Z"
            transform="translate(12 27.616) rotate(-90)"
            fill="#fff"
          />
        </g>
      </svg>
    </div>
  );
}

export default Featured;
