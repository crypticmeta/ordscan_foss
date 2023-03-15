import React, { useCallback, useEffect, useState } from "react";
import { relayInit } from "nostr-tools";
import {FaBitcoin} from 'react-icons/fa'
import Link from "next/link";
import Image from "next/image";
import useDataStore from "stores/useDataStore";
import CircularProgress from "@mui/material/CircularProgress";
import {
  getInscriptionDataById,
  satToBtc,
  validateSellerPSBTAndExtractPrice,
} from "utils";
import axios from "axios";
import moment from "moment";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import usePagination from "components/Others/Pagination";
import { useDispatch, useSelector } from "react-redux";
import { setOrderbook, setOrderbookLoading } from "stores/reducers/orderbookSlice";
import { RootState } from "stores";
const nostrRelayUrl = "wss://nostr.openordex.org";
const nostrOrderEventKind = 802;
function Orderbook() {
  const orderbook = useSelector((state: RootState) => state.orderbook.orderbook);
  const lastUpdated = useSelector(
    (state: RootState) => state.orderbook.lastUpdated
  );
   const orderbookLoading = useSelector((state: RootState) => state.orderbook.loading);
  const relay = relayInit(nostrRelayUrl);
  const dispatch = useDispatch();
  const connectRelay = useCallback(async () => {
     dispatch(setOrderbookLoading(true));
    relay.on("connect", () => {
      console.log(`connected to ${relay.url}`);
    });
    relay.on("error", () => {
       dispatch(setOrderbookLoading(false));
      return;
      console.log(`failed to connect to ${relay.url}`);
    });
    await relay.connect();
    let events = await relay.list([{ kinds: [nostrOrderEventKind], limit: 100 }]);
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
        .get(`${process.env.NEXT_PUBLIC_API}/inscription?flagged=true`)
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
      // console.log("using cached flagged item");
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
              latestOrders.length >= 40 ||
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

      dispatch(
        setOrderbook(latestOrders.sort((a, b) => b.created_at - a.created_at))
      );
       dispatch(setOrderbookLoading(false));
    } catch (e) {
       dispatch(setOrderbookLoading(false));
    }
  }, []);

  useEffect(() => {
   
    if (
      !orderbook ||
      orderbook?.length < 50 ||
      new Date().valueOf() - lastUpdated > 300000
    )
      connectRelay();
  }, [orderbook]);

  const [itemPerPage, setItemPerPage] = useState(12);
  let [page, setPage] = useState(1);
  const count = Math.ceil(orderbook?.length||0 / itemPerPage);
  
  const _DATA = usePagination(
    orderbook || [],
    itemPerPage
  );

  const handleChange = (e, p) => {
    setPage(p);
    _DATA.jump(p);
  };

  console.log(orderbook, '_DATA')
  return (
    <div className=" py-14 lg:py-0  overflow-hidden">
      <div className="">
        <h2 className="text-3xl text-center py-3">Orderbook</h2>
      </div>
      <Stack spacing={2}>
        <Pagination
          count={count}
          size={"large"}
          variant="outlined"
          shape="rounded"
          onChange={handleChange}
        />
      </Stack>
      {orderbookLoading ? (
        <div className="text-brand_red min-h-[50vh] center w-full">
          <CircularProgress size={70} color="inherit" />
        </div>
      ) : (
        <div className="w-full flex items-center justify-between flex-wrap">
          {orderbook?.length > 0 ? (
            <>
              {_DATA
                ?.currentData()
                ?.sort((a, b) => b.created_at - a.created_at)
                .map((item: any, idx: number) => {
                  if (idx < 40) return <Card key={item.id} item={item} />;
                })}
            </>
          ) : (
            <p className="text-center text-white py-6">
              No Valid Listing Found
            </p>
          )}
        </div>
      )}
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
            {/* <div className="absolute top-[10px] left-[10px] px-2 py-1 z-10 bg-gray-900 text-xs">
              {id}
            </div> */}
            {item.type.includes("image") ? (
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
              <iframe
                loading="lazy"
                referrerPolicy="no-referrer"
                sandbox="allow-scripts allow-same-origin"
                allow=""
                className={`overflow-hidden bg-white h-full w-full center no-scrollbar`}
                src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${id}`}
              ></iframe>
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
