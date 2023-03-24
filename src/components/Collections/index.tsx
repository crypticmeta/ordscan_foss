import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import usePagination from "components/Others/Pagination";
import Stack from "@mui/material/Stack";
import Pagination from "@mui/material/Pagination";
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
function Collections(): JSX.Element {
  const router = useRouter();
  const [collectionList, setCollectionList] = useState([]);
  const [totalCollection, setTotalCollection] = useState(0)
  const [itemPerPage, setItemPerPage] = useState(12);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortByType, setSortByType] = useState(1);
  let [page, setPage] = useState(1);

  const getCollections = useCallback(async () => {
    await axios
      .get(
        `${
          process.env.NEXT_PUBLIC_API
        }/collection?_sort=${sortBy}:${sortByType}&_limit=${itemPerPage}&_start=${page}${
          sortBy === "minimum" || sortBy === "maximum" ? "&parsedAll=true" : ""
        }`
      )
      .then((res) => {
        setCollectionList(res.data.data.collections);
        setTotalCollection(res.data.data.total)
      })
      .catch((err) => {
        notify({ type: "error", message: "Error getting data" });
      });
  }, [sortBy, sortByType, itemPerPage, page]);

  const count = Math.ceil(totalCollection / itemPerPage);
  const _DATA = usePagination(
    collectionList.sort((a, b) => b.verified - a.verified),
    itemPerPage
  );

  const handleChange = (e, p) => {
    setPage(p);
    _DATA.jump(p);
  };

  useEffect(() => {
    getCollections();
  }, [page, sortBy]);

  const handlesortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value as unknown as string);
  };
  return (
    <div className="pt-6">
      <div className="flex justify-between items-center">
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
              <MenuItem value={"name"}>Name</MenuItem>
              <MenuItem value={"minimum"}>Lowest Inscription</MenuItem>
              {/* <MenuItem value={"maximum"}>Highest Inscription</MenuItem> */}
              <MenuItem value={"supply"}>Supply</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>
      <div className="flex items-center justify-center flex-wrap">
        {_DATA?.currentData()?.length > 0 &&
          _DATA?.currentData()?.map((item) => (
            <div
              key={item._id}
              className="w-[300px] h-[400px] overflow-hidden text-white p-3"
            >
              <Link
                href={`/collections/${encodeURIComponent(item.slug)}`}
              >
                <div className="bg-brand_black rounded h-full shadow brightness-90 hover:brightness-110">
                  <p className="hidden">{item.icon_type}</p>
                  <div className="h-[280px]  center overflow-hidden relative">
                    {item?.featured && (
                      <div className="absolute top-0 left-0 bg-brand_blue text-xs p-2">
                        Featured
                      </div>
                    )}
                    {item?.verified && (
                      <div className="absolute top-0 right-0 bg-yellow-500 text-xs p-2">
                        Verified
                      </div>
                    )}
                    {item?.icon_type === "image" || !item?.icon_type ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        style={{
                          objectFit: "contain",
                          imageRendering: "pixelated",
                        }}
                        className={`overflow-hidden w-full`}
                        alt="ordinal"
                        src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.inscription_icon}`}
                      />
                    ) : (
                      <>
                        {item?.type === "video" ? (
                          <video muted autoPlay>
                            <source
                              src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.inscription_icon}`}
                            />
                          </video>
                        ) : (
                          <iframe
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            sandbox="allow-scripts allow-same-origin"
                            allow=""
                            className={`overflow-hidden bg-white center no-scrollbar`}
                            src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.inscription_icon}`}
                          ></iframe>
                        )}
                      </>
                    )}
                  </div>
                  <div className="p-3 font-bold text-brand_red flex flex-col justify-evenly">
                    <div className="text-xs lg:text-lg text-gray-200 flex justify-between">
                      <span>{item.name}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Supply: <span>{item.supply}</span>
                    </div>
                    {item?.minimum && item?.maximum && (
                      <div className="text-xs text-gray-500">
                        Range: #<span>{item.minimum}</span> - #
                        <span>{item.maximum}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
      </div>
      {/* <Stack spacing={2}>
        <Pagination
          
          count={count}
          size={"large"}
          variant="outlined"
          shape="rounded"
          onChange={handleChange}
        />
      </Stack> */}
    </div>
  );
}

export default Collections;
