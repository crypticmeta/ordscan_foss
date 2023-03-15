import React from "react";
import Slider from "react-slick";
import Link from "next/link";
import { Collection } from "types";
function Featured({ featured }) {
  var settings = {
    dots: false,
    arrows: false,
    infinite: true,
    autoplay: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    initialSlide: 0,
  };
  return (
    <div className=" py-14 lg:py-6">
      <div className="w-full">
        <Slider {...settings} className="w-full">
          {featured?.map((item: Collection) => (
            <div key={item._id} className={`p-3`}>
              <div className="bg-brand_black shadow-xl w-full h-[80vh] lg:h-[60vh] overflow-hidden rounded-2xl  border-2 border-white flex justify-between items-center flex-wrap">
                <div className="order-2 lg:order-1 w-full h-[50%] lg:h-full lg:w-8/12 p-3 lg:p-12 uppercase text-white pt-6 lg:pt-0 flex flex-col justify-end lg:justify-center lg:items-start">
                  <p className="pb-3 text-2xl lg:text-4xl font-extrabold ">
                    {item.name}
                  </p>
                  <p className="text-xs lg:text-lg font-light text-gray-500">
                    {item?.description}
                  </p>
                  <button className="bg-brand_blue brightness-90 hover:brightness-100 text-white text-xs lg:text-xl capitalize font-thin px-4 py-2 mt-3 lg:mt-12">
                    <Link
                      prefetch={false}
                      href={`/collections/${encodeURIComponent(item.slug)}`}
                    >
                      View Details
                    </Link>
                  </button>
                </div>
                <div className="order-1 lg:order-2 w-full h-[50%] lg:h-full lg:w-4/12 relative">
                  {item.icon_type?.includes("image") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      style={{
                        imageRendering: "pixelated",
                      }}
                      className={`w-full h-full object-cover lg:object-contain`}
                      alt="ordinal"
                      src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.inscription_icon}`}
                    />
                  ) : (
                    <>
                      {item.icon_type?.includes("video") ? (
                        <video muted autoPlay className="w-full h-full">
                          <source
                            src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.inscription_icon}`}
                          />
                        </video>
                      ) : (
                        <iframe
                          referrerPolicy="no-referrer"
                          sandbox="allow-scripts allow-same-origin"
                          className={`w-full h-full`}
                          src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.inscription_icon}`}
                        ></iframe>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}

export default Featured;
