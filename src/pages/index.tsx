import React, { useState } from "react";
import Head from "next/head";
import Featured from "components/Homepage/Featured";
import Recent from "components/Homepage/Recent";
import Orderbook from "components/Homepage/Orderbook";
import Collections from "components/Homepage/Collections";
import Hooks from "components/Homepage/Hooks";
function Explorer({ data }) {
  return (
    <div className="custom-container  text-white">
      {data.featuredCollections.length > 0 && (
        <Featured featured={data.featuredCollections} />
      )}

      <Orderbook />
      {data.collections.length > 0 && (
        <Collections collections={data.collections} />
      )}
      {/* <Hooks/> */}
      {data.recent.length > 0 && <Recent recent={data.recent} />}

    </div>
  );
}

// This gets called on every request
export async function getServerSideProps({req, res}) {
   res.setHeader(
     "Cache-Control",
     "public, s-maxage=60, stale-while-revalidate=59"
   );

  let data = {
    recent: [],
    featuredCollections: [],
    collections: []
  };
  // Fetch data from external data source
  try {
    const res: any = await fetch(`https://ordapi.xyz/feed`);
    const response = await res.json();
    const res2: any = await fetch(
      `${process.env.NEXT_PUBLIC_API}/collection?collectionLive=true&_sort=updated_at:-1&_limit=12`
    );

    const response2 = (await res2?.json()) || {};
    const res3: any = await fetch(
      `${process.env.NEXT_PUBLIC_API}/collection?collectionLive=true&featured=true&_limit=12`
    );

    const response3 = (await res3?.json()) || {};

    data = {
      recent: response?.rss.channel.item.slice(0, 11) || [],
      featuredCollections:
        response3.data.collections.filter((a) => a.featured) || [],
      collections:
        [
          ...response3.data.collections.filter((a) => a.verified),
          ...response2.data.collections,
        ] || [],
    };
  } catch (e) {
    console.error(e, "ERR");
  }
  // Pass data to the page via props
  return { props: { data } };
}

export default Explorer;
