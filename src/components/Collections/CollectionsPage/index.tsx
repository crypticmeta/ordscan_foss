import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { BsFillPatchCheckFill, BsTwitter } from "react-icons/bs";
import { FaDiscord, FaFileDownload, FaTwitter } from "react-icons/fa";
import { CSVLink, CSVDownload } from "react-csv";
import { useRouter } from "next/router";
import axios from "axios";
import { notify } from "utils/notifications";
import type { Collection } from "types";
import Image from "next/image";
import usePagination from "components/Others/Pagination";
import Stack from "@mui/material/Stack";
import Pagination from "@mui/material/Pagination";
import { useSelector } from "react-redux";
import { RootState } from "stores";
import { satToBtc } from "utils";
import { ImSphere } from "react-icons/im";
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Tooltip } from "@mui/material";
function CollectionPage({ data}) {
  const orderbook = useSelector(
    (state: RootState) => state.orderbook.orderbook
  );
  const router = useRouter();
  const [collection, setCollection] = useState<Collection>(null);
  const [inscriptions, setInscriptions] = useState([]);
  const [inscripted, setInscripted] = useState(0);
  const [sortBy, setSortBy] = useState("created_at")
   const [sortByType, setSortByType] = useState(1);
  //find duplicates
  // const toFindDuplicates = (arry) =>
  //   arry.filter((item, index) => arry.indexOf(item) !== index);

  const [itemPerPage, setItemPerPage] = useState(100);
  let [page, setPage] = useState(1);
  const count = Math.ceil(inscripted / itemPerPage);
  const _DATA = usePagination(inscriptions, itemPerPage);

  const handleChange = (e, p) => {
    setPage(p);
    _DATA.jump(p);
  };
  const getInscriptions = useCallback(async () => {
    if (collection?._id) {
      await axios
        .get(
          `${process.env.NEXT_PUBLIC_API}/inscription?collectionId=${collection._id}&_sort=${sortBy}:${sortByType}&_limit=${itemPerPage}&_start=${page}`
        )
        .then((res) => {
          let inscriptions_list = res.data.data.inscriptions;
          if(orderbook)
          inscriptions_list.map(item => {
            const presentInOrderbook = orderbook.filter(a => a.inscriptionId === item.id)
            if (presentInOrderbook.length) {
              item.listed = true
              item.price = presentInOrderbook[0].price
              item.number = presentInOrderbook[0].number;
            } else {
              item.listed = false;
              item.price = 0;
              item.number = item?.number;
            }
          })

          // console.log('sorting by ... ', sortBy)

          if (sortBy === "listing") {
            inscriptions_list.sort((a, b) => b.listed - a.listed); //show listed first
          } else if (sortBy === "price") {
            inscriptions_list.sort((a, b) => b.price - a.price); //show low price first
          } else if (sortBy === "number") {
            const withNumber = inscriptions_list.filter(a => a.number).sort((a,b)=>a.number-b.number)
            const withoutNumber = inscriptions_list.filter(a=>!a.number)
            inscriptions_list=[...withNumber, ...withoutNumber] //show low price first
          }
          setInscriptions(inscriptions_list);
          setInscripted(res.data.data.total);
        })
        .catch((err) => {
          notify({ type: "error", message: "Error getting data" });
        });
    }
  }, [collection, page, orderbook, sortBy]);

  const getCollection = useCallback(async () => {
    if (router.query.slug) {
      await axios
        .get(
          `${process.env.NEXT_PUBLIC_API}/collection?slug=${router.query.slug}&_limit=1`
        )
        .then((res) => {
          setCollection(res.data.data.collections[0]);
          getInscriptions();
        })
        .catch((err) => {
          notify({ type: "error", message: "Error getting data" });
        });
    }
  }, [router.query.slug]);

  useEffect(() => {
    if(collection?._id)
    getInscriptions()
  }, [page, collection, sortBy])
  

  useEffect(() => {
    const tempData = [];
    if (inscriptions.length > 0) {
      inscriptions.map((item) => {
        tempData.push({
          name: item.name,
          number: item.number,
          id: item.id,
          url: "https://ordinalnovus.com/search/" + item.id,
        });
      }); 
    }
  }, [inscriptions]);

  useEffect(() => {
    // getAllId();
    if (router.query.slug) getCollection();
  }, [getCollection, router]);

  const handlesortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value as unknown as string);
  };
  return (
    <div className="h-screen custom-container">
      <div className="collection-info pb-6">
        <h2 className="text-white text-center font-bold text-3xl uppercase pb-3 flex justify-center items-center">
          {collection?.name}
          {collection?.verified && (
            <Tooltip title="Verified">
              <div>
                <BsFillPatchCheckFill className="pl-4 text-yellow-500 text-4xl" />
              </div>
            </Tooltip>
          )}
        </h2>
        <div className="center">
          <div className="flex flex-wrap bg-brand_black justify-center px-6 py-6 w-full">
            <div className="w-full lg:w-6/12 lg:pr-3 lg:border-r-4 lg:border-brand_red">
              <p className="text-gray-400 text-justify pb-3">
                {collection?.description || " No Description"}
              </p>
              {!collection?.verified && (
                <p className="text-gray-400 text-justify pb-3">
                  This collection is not verified yet. Are you the owner of this
                  collection? Feel free to contact us.
                </p>
              )}
              <div className="w-full flex justify-center lg:justify-start flex-wrap">
                <div className="flex pt-4 space-x-2 text-xl text-white">
                  {collection?.twitter_link && (
                    <Link target="#" href={collection?.twitter_link || "/"}>
                      <BsTwitter />
                    </Link>
                  )}
                  {collection?.discord_link && (
                    <Link target="#" href={collection?.discord_link || "/"}>
                      {" "}
                      <FaDiscord />{" "}
                    </Link>
                  )}
                  {collection?.website_link && (
                    <Link target="#" href={collection?.website_link || "/"}>
                      {" "}
                      <ImSphere />{" "}
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <div className="w-full lg:w-6/12 lg:pl-3 text-gray-400">
              <div className="w-full flex items-center flex-wrap">
                <div className="w-6/12 md:w-4/12 xl:w-3/12  p-2">
                  <div className="text-white border-brand_red border-2 rounded-xl bg-brand_black text-center p-2">
                    <p className="text-xs text-gray-500">Supply</p>
                    <p className=" text-sm pt-1 flex items-center justify-center">
                      <span>{collection?.supply} </span>
                    </p>
                  </div>
                </div>
                <div className="w-6/12 md:w-4/12 xl:w-3/12  p-2">
                  <div className="text-white border-brand_red border-2 rounded-xl bg-brand_black text-center p-2">
                    <p className="text-xs text-gray-500">Inscribed</p>
                    <p className=" text-sm pt-1 flex items-center justify-center">
                      <span>{inscripted} </span>
                    </p>
                  </div>
                </div>
                <div className="w-6/12 md:w-4/12 xl:w-3/12  p-2">
                  <div className="text-white border-brand_red border-2 rounded-xl bg-brand_black text-center p-2">
                    <p className="text-xs text-gray-500">Mint Status</p>
                    <p className=" text-sm pt-1 flex items-center justify-center">
                      <span>{collection?.status} </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center flex-wrap">
        <Stack spacing={2}>
          <Pagination
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
                //@ts-ignore
                handlesortChange(e);
              }}
              variant="outlined"
            >
              <MenuItem value={"created_at"}>Default</MenuItem>
              {/* <MenuItem value={"name"}>Name</MenuItem> */}
              <MenuItem value={"listing"}>Listing</MenuItem>
              <MenuItem value={"price"}>Price</MenuItem>
              <MenuItem value={"number"}>Number</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between">
        {inscriptions.map((item, idx) => (
          <Card item={item} key={item._id} collection={collection} />
        ))}
      </div>
    </div>
  );
}
const Card = ({ item, collection }) => {
  return (
    <div className={`w-[300px] h-[400px] p-3 overflow-hidden`}>
      <Link prefetch={false} href={`/search/${encodeURIComponent(item.id)}`}>
        <div className=" bg-brand_black h-full w-full shadow-xl rounded-2xl">
          <div className="h-[300px] overflow-hidden relative">
            {item?.price > 0 && (
              <div className="z-10 absolute bottom-0 left-0 right-0 bg-brand_blue text-white text-xs text-center py-2 px-2">
                <p>On Sale For {satToBtc(item?.price)} BTC</p>
              </div>
            )}
            {collection.icon_type.includes("image") ||
            item?.content_type?.includes("image") ? (
              <Image
                loading="lazy"
                style={{ imageRendering: "pixelated" }}
                unoptimized
                className={`overflow-hidden object-cover`}
                fill
                placeholder={"blur"}
                blurDataURL={"favicon.ico"}
                alt="ordinal"
                src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.id}`}
              />
            ) : (
              <>
                {collection.content_type?.includes("video") ||
                item?.content_type?.includes("video") ? (
                  <video muted autoPlay>
                    <source
                      src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.id}`}
                    />
                  </video>
                ) : (
                  <iframe
                    referrerPolicy="no-referrer"
                    sandbox="allow-scripts allow-same-origin"
                    className={`overflow-hidden`}
                    src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.id}`}
                  ></iframe>
                )}
              </>
            )}
          </div>
          <div className="p-3 font-bold text-brand_red flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-200 flex justify-between">
                <span>{item.name}</span>
              </div>
              {item?.number > 0 && (
                <div className="text-gray-500 text-xs">
                  <span>Inscription {item?.number}</span>
                </div>
              )}
              {/* {item?.listed && (
                <div className="text-gray-500 text-xs">
                  <span>On Sale</span>
                </div>
              )} */}
            </div>
            <div className="flex items-center justify-between pt-2">
              <button className="bg-brand_blue rounded hover:bg-blue-800 text-white uppercase font-thin px-2 py-1 text-xs">
                {item?.listed ? "Buy" : "Details"}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
export default CollectionPage;
