import React, { useCallback, useEffect, useState } from "react";
import { relayInit } from "nostr-tools";
import Slider from "react-slick";
import Link from "next/link";
import Image from "next/image";
import NextArrow from "components/Others/NextArrow";
import PrevArrow from "components/Others/PrevArrow";
import useDataStore from "stores/useDataStore";
import CircularProgress from "@mui/material/CircularProgress";
import {
  getInscriptionDataById,
  satToBtc,
  validateSellerPSBTAndExtractPrice,
} from "utils";
import axios from 'axios'
import moment from "moment";
import { processSellerPsbt } from "utils/Ordinals/buyOrdinal";
import { FaBitcoin } from "react-icons/fa";
import { setOrderbook, setOrderbookLoading } from "stores/reducers/orderbookSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "stores";
const nostrRelayUrl = "wss://nostr.openordex.org";
const nostrOrderEventKind = 802;
function Orderbook() {
  
  const orderbook = useSelector(
    (state: RootState) => state.orderbook.orderbook
  );
  const orderbookLoading = useSelector(
    (state: RootState) => state.orderbook.loading
  );
  const dispatch = useDispatch();
  const [listing, setListing] = useState([]);
  const relay = relayInit(nostrRelayUrl);

 

  const connectRelay = useCallback(async () => {
    dispatch(setOrderbookLoading(true));
    relay.on("connect", () => {
      console.log(`connected to ${relay.url}`);
    });
    relay.on("error", () => {
      dispatch(setOrderbookLoading(false));
      return;
      console.error(`failed to connect to ${relay.url}`);
    });
    await relay.connect();
    let events = await relay.list([
      { kinds: [nostrOrderEventKind], limit: 500 },
    ]);
    const filteredOrders = events
      .filter((a) => !a.content.includes("PSBTGOESHERE"))
      .filter((a) => !a.content.startsWith("02000000"))
      .filter((a) => !a.content.startsWith("01000000"))
      .filter((a) => a.tags[0].includes("mainnet"))
      .sort((a, b) => b.created_at - a.created_at);

    const latestOrders = [];
    let flagged = [];
    const flaggedCache =
      localStorage.getItem("ordscan-flagged-inscriptions") || null;
    const parsedFlagged = JSON.parse(flaggedCache);
    if (
      new Date().valueOf() - Number(parsedFlagged?.timestamp) > 3600000 ||
      !flaggedCache
    ) {
      await axios
        .get(`${process.env.NEXT_PUBLIC_API}/inscription?banned=true`)
        .then((res) => {
          //  setSaleData(res.data);
          res.data.data.inscriptions.map((item) => {
            flagged.push(item.id);
          });
          localStorage.setItem(
            "ordscan-flagged-inscriptions",
            JSON.stringify({
              inscriptions: flagged,
              timestamp: new Date().valueOf(),
            })
          );
        })
        .catch((err) => {});
    } else {
      flagged = parsedFlagged?.inscriptions;
    }

    try {
      await Promise.all(
        filteredOrders
          .sort((a, b) => b.created_at - a.created_at)
          .map(async (order: any) => {
            const inscriptionId = order.tags.find((x) => x?.[0] == "i")[1];
            if (
              latestOrders.find((x) => x.inscriptionId == inscriptionId) ||
              // latestOrders.length >= 40 ||
              flagged.includes(inscriptionId)
            ) {
              //inscriptionId alreday stored in latestOrder array
            } else {
              const inscriptionData = await getInscriptionDataById(
                inscriptionId
              );
              const validatedPrice: any = validateSellerPSBTAndExtractPrice(
                order.content,
                inscriptionData.output
              );
              if (validatedPrice.error) {
              } else if (validatedPrice) {
                order.number = inscriptionData.number;
                order.inscriptionId = inscriptionId;
                order.price = validatedPrice;
                order.type = inscriptionData["content type"];
                order.inscription = inscriptionData;
                latestOrders.push(order);
              }
            }
          })
      );
      dispatch(setOrderbook(latestOrders.sort((a,b)=>b.created_at-a.created_at)));
      setListing(latestOrders);
       dispatch(setOrderbookLoading(false));
    } catch (e) {
       dispatch(setOrderbookLoading(false));
    }
  }, []);

  useEffect(() => {
    if(!orderbook)
    connectRelay();
  }, [orderbook]);
  var settings = {
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    dots: false,
    infinite: true,
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
    <div className=" py-14 lg:pt-0 md:pr-10  overflow-hidden">
      <div className="">
        <h2 className="text-3xl text-center py-3">Orderbook</h2>
      </div>
      {orderbookLoading ? (
        <div className="text-brand_red h-50vh center">
          <CircularProgress size={70} color="inherit" />
        </div>
      ) : (
        <div className="w-full">
          {orderbook?.length > 0 ? (
            <Slider {...settings} className="w-full">
              {orderbook
                .map((item: any, idx: number) => {
                  if (idx < 40) return <Card key={item.id} item={item} />;
                })}
            </Slider>
          ) : (
            <p className="text-center text-white py-6">
              No Valid Listing Found
            </p>
          )}
        </div>
      )}
      <div className="center">
        <button className="bg-brand_blue brightness-90 hover:brightness-100 text-white text-xs lg:text-xl capitalize font-thin px-6 py-1 mt-3 lg:mt-12">
          <Link prefetch={false} href={`/orders`}>
            View All
          </Link>
        </button>
      </div>
    </div>
  );
}
const Card = ({ item }) => {
  const id = item.tags.filter((a) => a.includes("i"))[0][1];
  const price = item.price;
  return (
    <div className={`w-[300px] h-[400px] p-3 overflow-hidden`}>
      <Link prefetch={false} href={`/search/${encodeURIComponent(id)}`}>
        <div className=" bg-brand_black h-full w-full shadow-xl rounded-2xl">
          <div className="h-[280px] overflow-hidden relative">
            <div className="absolute bottom-[10px] left-[10px] px-2 py-1 z-10 bg-gray-900 text-xs">
              {moment(item.created_at * 1000).fromNow()}
            </div>
            {item?.type?.includes("image") ? (
              <Image
                loading="lazy"
                style={{ imageRendering: "pixelated" }}
                unoptimized
                className={`overflow-hidden object-cover`}
                fill
                placeholder={"blur"}
                blurDataURL={"favicon.ico"}
                alt="ordinal"
                src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${id}`}
              />
            ) : (
              <>
                {item?.type?.includes("video") ? (
                  <video muted autoPlay>
                    <source
                      src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${id}`}
                    />
                  </video>
                ) : (
                  <iframe
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    sandbox="allow-scripts allow-same-origin"
                    className={`overflow-hidden bg-white h-full w-full center`}
                    allow="autoplay encrypted-media picture-in-picture media-src"
                    src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${id}`}
                  ></iframe>
                )}
              </>
            )}
          </div>
          <div className="p-3 font-bold text-brand_red flex flex-col justify-evenly">
            <div className="text-xs text-gray-200 flex justify-between">
              <span>Inscription</span>
              <span>#{item.number}</span>
            </div>
            <div className="flex items-center justify-between pt-4">
              <div className="pb-1 text-xs lg:text-lg flex items-center text-white">
                {" "}
                <FaBitcoin className="text-yellow-500 mr-3" />{" "}
                {satToBtc(Number(price)).toFixed(2)}
              </div>
              <button className="bg-brand_blue rounded hover:bg-blue-800 text-white uppercase font-thin px-2 py-1 text-xs">
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
export default Orderbook;
