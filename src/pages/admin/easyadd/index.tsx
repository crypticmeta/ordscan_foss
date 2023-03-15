import React, { useCallback, useEffect, useState } from "react";
import EasyAdd from "components/Admin/EasyAdd";
function EasyAddPage() {
  const [data, setData] = useState(null);
  const getCollections =  useCallback(async () => {
      // Fetch data from external data source
      let tempData = {
        githubCollections: [],
        dbSlugList: [],
        dbNameList:[]
      };
      try {
        const res: any = await fetch(
          `https://raw.githubusercontent.com/orenyomtov/openordex/main/static/collections.json`
        );
        let response = await res.json();
        const res2: any = await fetch(
          `${process.env.NEXT_PUBLIC_API}/collection`
        );

        const tempNameList = [];
        const tempSlugList = [];

        const response2 = (await res2?.json()) || {};
        response2.data.collections.map(item => {
          tempNameList.push(item.name);
          tempSlugList.push(item.slug);
        })
        const tempCollections = []
        response.map(item => {
          if (!tempNameList.includes(item.name) && !tempSlugList.includes(item.slug)) {
            tempCollections.push(item)
          }
        })
        tempData = {
          githubCollections: tempCollections || [],
          dbNameList: tempNameList || [],
          dbSlugList: tempSlugList||[]
        };
        setData(tempData);
      } catch (e) {
        console.error(e, "ERR");
      }
    }, []);

  useEffect(() => {
    getCollections();
  }, [getCollections]);

  return (
    <div className="min-h-screen custom-container">
      {data?.githubCollections.length > 0 && <EasyAdd data={data} />}
    </div>
  );
}

export default EasyAddPage;
