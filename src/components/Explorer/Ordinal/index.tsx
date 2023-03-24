import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { AiOutlineCopy } from "react-icons/ai";
import { relayInit } from "nostr-tools";
import { nostrOrderEventKind, nostrRelayUrl, satToBtc, validateSellerPSBTAndExtractPrice } from "utils";
import copy from "copy-to-clipboard";
import { shortForm } from "utils/shortForm";
import { BsDownload, BsFillPatchCheckFill } from "react-icons/bs";
import { saveAs } from "file-saver";
import { MdNavigateNext, MdNavigateBefore } from "react-icons/md";
import Link from "next/link";
import Sale from "../Sale";
import { useRouter } from "next/router";
import axios from "axios";
import Buy from "../Buy";
import { AiFillFlag } from "react-icons/ai";
import Tooltip from "@mui/material/Tooltip";
import { notify } from "utils/notifications";
import { Inscription, Order } from "types";
import AddPadding from "../AddPadding";
import { useDispatch, useSelector } from "react-redux";
import { setOrdinal } from "stores/reducers/ordinalSlice";
import { RootState } from "stores";
import { BiLinkExternal } from "react-icons/bi";
interface OrdinalProp {
  data: Inscription;
}

function Ordinal({ data }: OrdinalProp): JSX.Element {
   const lastUpdated = useSelector(
     (state: RootState) => state.orderbook.lastUpdated
   );
  const orderbook = useSelector(
    (state: RootState) => state.orderbook.orderbook
  );
  const dispatch = useDispatch();
  const [saleData, setSaleData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [db, setDB] = useState(null);
  const router = useRouter();

  const handleSave = () => {
    const url = `${process.env.NEXT_PUBLIC_PROVIDER}/content/${data.id}`;
    saveAs(url, data.title);
  };

  const checkDB = useCallback(async () => {
    await axios
      .get(`${process.env.NEXT_PUBLIC_API}/inscription?id=${data.id}`)
      .then((res) => {
        //  setSaleData(res.data);
        setDB(res.data?.data?.inscriptions[0] || null);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  }, [data]);

  const flagContent = useCallback(async () => {
    let flagData = {};
    if (db) {
      flagData = {
        _id: db._id,
        flagged: true,
      };
    } else {
      flagData = {
        inscriptionId: data.id,
        number: data.inscription_number,
        flagged: true,
      };
    }
    await axios
      .post(`${process.env.NEXT_PUBLIC_API}/inscription/flag`, flagData)
      .then((res) => {
        notify({ type: "success", message: "Flagged successfully" });
        setLoading(false);
      })
      .catch((err) => {
        notify({ type: "error", message: "Error Occurred while flagging" });
        setLoading(false);
      });
  }, [data, db]);

  useEffect(() => {
    if (data?.id) {
      checkDB();
    }
  }, [checkDB, data]);

  const checkValidity = useCallback(
    (signedPSBT) => {
      const result: any = validateSellerPSBTAndExtractPrice(signedPSBT, data.output);
      // console.log(result, 'validity check result')
      if (result?.error)
        return false
      else
      return result;
    },
    [data.output]
  );

  const parseNostr = useCallback(
    async (item) => {
      try {
        const valid = await checkValidity(item.content);
        if (!valid) {
          // console.log(valid, "VALID");
          return null;
        }
        const id = item.tags.filter((a) => a.includes("i"))[0][1];
        const type = item.tags.filter((a) => a.includes("t"))[0][1];
        const utxo = item.tags.filter((a) => a.includes("u"))[0][1];
        const price = item.tags.filter(
          (a) => a.includes("p") || a.includes("s")
        )[0][1];
        const parsedData = {
          id: item.id,
          inscriptionId: id,
          price: satToBtc(Number(price)),
          signedPsbt: item.content,
          createdAt: item.created_at,
          type,
          utxo,
        };
        return parsedData;
      } catch (e) {
        return null;
      }
    },
    [checkValidity]
  );

  const connectRelay = useCallback(async () => {
    let tempList = [];
    let events = [];

    const relay = relayInit(nostrRelayUrl);

    const list = [];
    relay.on("connect", () => {
      console.log(`connected to ${relay.url}`);
    });
    relay.on("error", () => {
      console.error(`failed to connect to ${relay.url}`);
    });
    await relay.connect();
    events = await relay.list([
      { kinds: [nostrOrderEventKind], "#u": [data?.output] },
    ]);
    events = events
      .filter((a) => !a.content.includes("PSBTGOESHERE"))
      .filter((a) => !a.content.startsWith("02000000"))
      .filter((a) => !a.content.startsWith("01000000"))
      .filter((a) => a.tags[0].includes("mainnet"))
      .sort((a, b) => b.created_at - a.created_at)
      .filter((a) =>
        a.tags.filter((b) => {
          if (b.includes("i")) {
            list.push(b[1]);
          }
          if (b.includes("i") && b[1] === data.id) {
            tempList.push(a);
          }
        })
      );

    if (router.query.signedpsbt) {
      const tempSaleData = {
        id: data.id,
        inscriptionId: data.id,
        price: satToBtc(checkValidity(router.query.signedpsbt)),
        signedPsbt: router.query.signedpsbt + "",
        createdAt: new Date().toDateString(),
        type: "sell",
        utxo: data.output,
      };
      // console.log(tempSaleData, 'TSD')
      const valid = checkValidity(router.query.signedpsbt)
      tempSaleData.price = satToBtc(valid);
      setSaleData(tempSaleData);
    } else if (tempList[0]) {
      try {
        if (tempList.length > 1) {
          const validatedOrders = [];
          await Promise.all(
            tempList.map(async (item) => {
              const valid = await checkValidity(item.content);
            
              if (valid) {
                validatedOrders.push(item);
              }
            })
          );
          tempList = validatedOrders.sort(
            (a, b) => b.created_at - a.created_at
          );
        }
        const parsedData = await parseNostr(tempList[0]);
        if (parsedData) setSaleData(parsedData);
      } catch (e) { }
      relay.close()
    }
  }, [checkValidity, data.id, data.output, parseNostr, router.query.signedpsbt]);

  useEffect(() => {
    if (connectRelay && data && !saleData) connectRelay();
  }, [connectRelay, data, saleData]);
  return (
    <div className="flex min-h-screen justify-center relative lg:justify-start pt-8 lg:py-16  items-center lg:items-start flex-wrap">
      <div
        className={`w-full lg:w-5/12   flex justify-center lg:justify-start`}
      >
        <div className=" h-[350px] w-[350px] lg:w-[400px] lg:h-[400px] md:h-[300px] md:w-[300px] services-gradient border-4 center border-brand_red overflow-hidden relative">
          {/* <BsDownload
            onClick={handleSave}
            className="absolute top-5 gradient p-2 center text-white cursor-pointer right-5 z-10 rounded-full text-3xl font-extrabold"
          /> */}
          {!db?.flagged && !db?.banned ? (
            <>
              {data.content_type?.includes("image") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  style={{ objectFit: "contain", imageRendering: "pixelated" }}
                  className={`overflow-hidden w-full`}
                  alt="ordinal"
                  src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${data.id}`}
                />
              ) : (
                <>
                  {data.content_type?.includes("video") ? (
                    <video muted autoPlay>
                      <source
                        src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${data.id}`}
                      />
                    </video>
                  ) : (
                    <iframe
                      referrerPolicy="no-referrer"
                      sandbox="allow-scripts allow-same-origin"
                      className={`overflow-hidden`}
                      src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${data.id}`}
                    ></iframe>
                  )}
                </>
              )}
            </>
          ) : (
            <p className="text-white">
              Item has been {db?.banned ? " Banned" : " Flagged"}
            </p>
          )}
        </div>
      </div>
      <div className="w-full lg:w-7/12 lg:px-6  flex flex-col pt-6 lg:pt-0">
        <p className="text-3xl text-brand_red font-extrabold uppercase flex ">
          {data.title}{" "}
          {db?.collectionId?.verified && (
            <Tooltip title="Part of a verified collection">
              <div>
                <BsFillPatchCheckFill className="pl-4 text-yellow-500 text-4xl" />
              </div>
            </Tooltip>
          )}
          {!db?.flagged && !db?.banned && (
            <Tooltip title="Flag inappropriate Content">
              <span
                onClick={flagContent}
                className="ml-12 cursor-pointer text-white"
              >
                <AiFillFlag />
              </span>
            </Tooltip>
          )}
        </p>
        {db && (
          <div>
            <Link
              href={`/collections/${encodeURIComponent(
                db?.collectionId?.slug
              )}`}
            >
              <p className="text-white tracking-wider hover:underline uppercase font-semibold text-sm">
                {db?.name}
              </p>
            </Link>
          </div>
        )}
        <p className="text-brand_blue font-semibold text-sm">
          {data.timestamp}
        </p>

        <div className="w-full center flex-wrap pt-3">
          <div className="w-6/12 md:w-4/12 xl:w-3/12  p-2">
            <div className="text-white border-brand_red border-2 rounded-xl bg-brand_black text-center p-2">
              <p className="text-xs text-gray-500">Inscription ID</p>
              <span id="inscription_id" className="hidden">
                {data.id}
              </span>
              <p className=" text-sm pt-1 flex items-center justify-center">
                <span>{shortForm(data.id)} </span>
                <AiOutlineCopy
                  className="text-xl ml-3 cursor-pointer"
                  onClick={() =>
                    copy(data.id, { message: "copied to clipboard" })
                  }
                />
              </p>
            </div>
          </div>
          <div className="w-6/12 md:w-4/12 xl:w-3/12  p-2">
            <div className="text-white border-brand_red border-2 rounded-xl bg-brand_black text-center p-2">
              <p className="text-xs text-gray-500">Address</p>
              <span id="address" className="hidden">
                {data.address}
              </span>
              <p className=" text-sm pt-1 flex items-center justify-center">
                <span>{shortForm(data?.address)} </span>
                <AiOutlineCopy
                  className="text-xl ml-3 cursor-pointer"
                  onClick={() =>
                    copy(data.address, { message: "copied to clipboard" })
                  }
                />
              </p>
            </div>
          </div>
          <div className="w-6/12 md:w-4/12 xl:w-3/12  p-2">
            <div className="text-white border-brand_red border-2 rounded-xl bg-brand_black text-center p-2">
              <p className="text-xs text-gray-500">Number</p>
              <p className=" text-sm pt-1 flex items-center justify-center">
                <span>{data.inscription_number} </span>
                <AiOutlineCopy
                  className="text-xl ml-3 cursor-pointer"
                  onClick={() =>
                    copy(data.inscription_number, {
                      message: "copied to clipboard",
                    })
                  }
                />
              </p>
            </div>
          </div>
          <div className="w-6/12 md:w-4/12 xl:w-3/12  p-2">
            <div className="text-white border-brand_red border-2 rounded-xl bg-brand_black text-center p-2">
              <p className="text-xs text-gray-500">Content Type</p>
              <p className=" text-sm pt-1 flex items-center justify-center capitalize">
                <span>{data.content_type.split("/")[0]} </span>
              </p>
            </div>
          </div>
          <div className="w-6/12 md:w-4/12 xl:w-3/12  p-2">
            <div className="text-white border-brand_red border-2 rounded-xl bg-brand_black text-center p-2">
              <p className="text-xs text-gray-500">Offset</p>
              <p className=" text-sm pt-1 flex items-center justify-center capitalize">
                <span>{data.offset} </span>
              </p>
            </div>
          </div>
          <div className="w-6/12 md:w-4/12 xl:w-3/12  p-2">
            <div className="text-white border-brand_red border-2 rounded-xl bg-brand_black text-center p-2">
              <p className="text-xs text-gray-500">Value</p>
              <p className=" text-sm pt-1 flex items-center justify-center capitalize">
                <span>{data.output_value} </span>
              </p>
            </div>
          </div>
          <div className="w-6/12 md:w-4/12 xl:w-3/12  p-2">
            <div className="text-white border-brand_red border-2 rounded-xl bg-brand_black text-center p-2">
              <p className="text-xs text-gray-500">UTXO</p>
              <p className=" text-sm pt-1 flex items-center justify-center">
                <span>{shortForm(data?.output)} </span>
                <AiOutlineCopy
                  className="text-xl ml-3 cursor-pointer"
                  onClick={() =>
                    copy(data?.output, {
                      message: "copied to clipboard",
                    })
                  }
                />
              </p>
            </div>
          </div>
          {db?.collectionId?.name ? (
            <div className="w-6/12 md:w-4/12 xl:w-3/12  p-2">
              <Link
                prefetch={false}
                href={`/collections/${encodeURIComponent(
                  db.collectionId.slug
                )}`}
              >
                <div className="text-white border-brand_red border-2 rounded-xl bg-brand_black text-center p-2">
                  <p className="text-xs text-gray-500">Collection</p>
                  <p className=" text-sm pt-1 flex items-center justify-center">
                    <span>{db?.collectionId.name}</span>
                  </p>
                </div>{" "}
              </Link>
            </div>
          ) : (
            <></>
          )}
          {saleData?.price ? (
            <div className="w-6/12 md:w-4/12 xl:w-3/12  p-2">
              <div className="text-white border-brand_red border-2 rounded-xl bg-brand_black text-center p-2">
                <p className="text-xs text-gray-500">Price</p>
                <p className=" text-sm pt-1 flex items-center justify-center">
                  <span>{saleData.price} BTC </span>
                </p>
              </div>
            </div>
          ) : (
            <></>
          )}
          {saleData?.signedPsbt ? (
            <div className="w-6/12 md:w-4/12 xl:w-3/12  p-2">
              <div className="text-white border-brand_red border-2 rounded-xl bg-brand_black text-center p-2">
                <p className="text-xs text-gray-500">PSBT</p>
                <p className=" text-sm pt-1 flex items-center justify-center">
                  <span>
                    {saleData?.signedPsbt && shortForm(saleData?.signedPsbt)}{" "}
                  </span>
                  <AiOutlineCopy
                    className="text-xl ml-3 cursor-pointer"
                    onClick={() =>
                      copy(saleData.signedPsbt, {
                        message: "copied to clipboard",
                      })
                    }
                  />
                </p>
              </div>
            </div>
          ) : (
            <></>
          )}
          {saleData?.signedPsbt ? (
            <>
              <div className="w-6/12 md:w-4/12 xl:w-3/12  p-2">
                <div className="text-white border-brand_red border-2 rounded-xl bg-brand_red text-center p-2">
                  <p className="text-xs text-red-200">Ordscan Link</p>
                  <p className=" text-sm pt-1 flex items-center justify-center">
                    <span>Copy</span>
                    <AiOutlineCopy
                      className="text-xl ml-3 cursor-pointer"
                      onClick={() =>
                        copy(
                          `${window.location.origin}/search/${data.id}?signedpsbt=${saleData?.signedPsbt}`
                        )
                      }
                    />
                  </p>
                </div>
              </div>
              <div className="w-6/12 md:w-4/12 xl:w-3/12  p-2">
                <div className="text-white border-brand_red border-2 rounded-xl bg-brand_black text-center p-2">
                  <p className="text-xs text-gray-500">Openordex Link</p>
                  <p className=" text-sm pt-1 flex items-center justify-center">
                    <span>Open</span>
                    <Link
                      href={`https://openordex.org/inscription?number=${data.id}`}
                      target="#"
                    >
                      <BiLinkExternal className="text-xl ml-3 cursor-pointer" />
                    </Link>
                  </p>
                </div>
              </div>
            </>
          ) : (
            <></>
          )}
        </div>
        {Number(data.output_value)  && !loading ? (
          <AddPadding data={data} saleData={saleData} />
        ) : (
          <></>
        )}
        {saleData?.signedPsbt && saleData?.price && !loading ? (
          <Buy data={data} saleData={saleData} />
        ) : (
          // <></>
          <></>
        )}
        <Sale data={data} setSaleData={setSaleData} saleData={ saleData} />
        <div className="flex justify-center">
          <button
            onClick={(e) => dispatch(setOrdinal(null))}
            className="m-6 z-[1] left-0 bg-brand_blue text-white text-3xl p-2 rounded-xl"
          >
            <Link
              prefetch={false}
              href={`/search/${encodeURIComponent(
                Number(data.inscription_number) - 1
              )}`}
            >
              <MdNavigateBefore className="text-white fill-white" />
            </Link>
          </button>
          <button
            onClick={(e) => dispatch(setOrdinal(null))}
            className="m-6 z-[1] right-0 bg-brand_blue text-white text-3xl p-2 rounded-xl"
          >
            <Link
              prefetch={false}
              href={`/search/${encodeURIComponent(
                Number(data.inscription_number) + 1
              )}`}
            >
              <MdNavigateNext className="text-white fill-white" />
            </Link>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Ordinal;
