import React, { useCallback, useEffect, useState } from 'react'
import {useRouter} from 'next/router'
import usePagination from 'components/Others/Pagination';
import Image from 'next/image'
import {
  FormControl,
  Input,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import axios from "axios";
import { notify } from "utils/notifications";
import Stack from "@mui/material/Stack";
import Pagination from "@mui/material/Pagination";
import { load } from 'cheerio';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from 'stores';
import { satToBtc } from 'utils';
import { FaBitcoin } from 'react-icons/fa';
import moment from 'moment';
function Index() {
     const orderbook = useSelector(
       (state: RootState) => state.orderbook.orderbook
     );
    const router = useRouter();
    const [inscriptionList, setInscriptionList] = useState([]);
    const [totalInscription, setTotalInscription] = useState(0);
    const [itemPerPage, setItemPerPage] = useState(50);
    const [sortBy, setSortBy] = useState("number");
    const [sortByType, setSortByType] = useState(1);
    const [start, setStart] = useState(0)
    let [page, setPage] = useState(1);

      const count = Math.ceil(totalInscription / itemPerPage);
      const _DATA = usePagination(
        inscriptionList,
        itemPerPage
      );

    const handleChange = (e, p) => {
          setStart(Number(router.query.min) + (itemPerPage) * p);
        setPage(p);
        _DATA.jump(p);
      };

    useEffect(() => {
        if (router.query) {
            if (router.query.min)
                setStart(Number(router.query.min) + (itemPerPage));
            if (router.query.min && router.query.max) {
              setTotalInscription(
                Number(router.query.max) - Number(router.query.min)
              );
            } else if (router.query.min && !router.query.max) {
                setTotalInscription(100)
          }
      }
    }, [itemPerPage, router.query])

    const loadInscription = useCallback(
      async () => {
        console.log(start, 'start')
            let ids = []
          await axios
           .get("https://ordinals.com/inscriptions/" + start)
           .then(numberRes => {
              const $ = load(numberRes.data);
            const _100I = $(".thumbnails")
                .children().each((i, e) => {
                    const d = {
                        id: e.attribs.href.split("/")[2],
                        number: start-i
                    };
                    ids.push(d);
                })
        console.log(ids, 'iiiids')
            ids = ids.slice(0, itemPerPage)
            ids.map(item => {
                const presentInOrderbook = orderbook?.filter(
                  (a) => a.inscriptionId === item.id
                );
                if (presentInOrderbook?.length) {
                    item.number = presentInOrderbook[0].number
                  item.listed = true;
                    item.price = presentInOrderbook[0].price;
                    item.created_at = presentInOrderbook[0].created_at
                } else {
                  item.listed = false;
                  item.price = null;
                }
            })
            ids = ids.reverse();
            if (sortBy === "price" && orderbook)
            {
                orderbook.map(item => {
                    console.log(item.number)
                    if (
                      item.number >= Number(router.query.min) &&
                      item.number <= Number(router.query.max)
                    ) {
                      console.log(item, "i");
                      const d = {
                        listed: true,
                        id: item.inscriptionId,
                          price: item.price,
                          number: item.number,
                        created_at: item.created_at
                      };
                      ids.push(d);
                    }
                })
                
                ids.sort((a, b) => b.price - a.price);
            }
            
             setInscriptionList(ids)
             setPage(0)
           })
           .catch((err) => console.log(err, "axios ERR"));
           
      },
      [start, itemPerPage, sortBy, orderbook, router.query.min, router.query.max],
  )
  
  console.log(_DATA.currentData(), 'DATA', inscriptionList, 'IL')
    
  useEffect(() => {
        loadInscription();
    }, [start, sortBy, loadInscription])
     const handlesortChange = (event: SelectChangeEvent) => {
       setSortBy(event.target.value as unknown as string);
     };
  return (
    <div className="custom-container">
      <div className="flex justify-between items-center">
        <Stack spacing={2}>
          <Pagination
            page={page}
            count={count}
            size={"large"}
            variant="outlined"
            shape="rounded"
            onChange={handleChange}
          />
        </Stack>
        <div className="w-full h-full md:w-6/12 lg:w-5/12 flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
          <FormControl fullWidth color="primary">
            <InputLabel id="sort">Sort By</InputLabel>
            <Select
              color="primary"
              labelId="sort"
              id="sort"
              value={sortBy}
              label="sort"
              onChange={(e) => {
                handlesortChange(e);
              }}
              variant="outlined"
            >
              <MenuItem value={"number"}>Default</MenuItem>
              <MenuItem value={"price"}>Price</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>
      <div className="flex items-center justify-center flex-wrap">
        {_DATA?.currentData()?.length > 0 &&
          _DATA
            ?.currentData()
            ?.map((item) => <Card key={item.id} item={item} />)}
      </div>
      <div className="flex justify-end items-center">
        <Stack spacing={2}>
          <Pagination
            page={page}
            count={count}
            size={"large"}
            variant="outlined"
            shape="rounded"
            onChange={handleChange}
          />
        </Stack>
      </div>
    </div>
  );
}
const Card = ({ item }) => {
  const [show, setShow] = useState(true);
  const [videoError, setVideoError] = useState(false);
  return (
    <div className={`p-3 `}>
      <Link prefetch={false} href={`/search/${encodeURIComponent(item.id)}`}>
        <div className=" w-[280px] h-[380px] bg-brand_black hover:bg-gray-900 text-white shadow-xl rounded-2xl">
          <div className="overflow-hidden relative h-[280px]">
            {item?.created_at && (
              <div className="absolute bottom-[10px] left-[10px] px-2 py-1 z-10 bg-gray-900 text-xs">
                {moment(item.created_at * 1000).fromNow()}
              </div>
            )}
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
            <div className="text-xs text-gray-200 flex justify-between">
              <span>Inscription</span>
              <span>#{item.number}</span>
            </div>
            <div className="flex items-center justify-between pt-4">
              {item?.price ? (
                <div className="pb-1 text-xs lg:text-lg flex items-center text-white">
                  {" "}
                  <FaBitcoin className="text-yellow-500 mr-3" />{" "}
                  {satToBtc(Number(item.price)).toFixed(2)}
                </div>
              ) : (
                <div></div>
              )}
              <button className="bg-brand_blue rounded hover:bg-blue-800 text-white uppercase font-thin px-2 py-1 text-xs">
                {item?.price ? "Buy Now" : "View Details"}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
export default Index