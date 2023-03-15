import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { notify } from "utils/notifications";
import Card from "./Card";
function Flgged() {
  const [flaggedItems, setFlaggedItems] = useState(null);
  const getFlaggedItems = useCallback(async () => {
    await axios
      .get(`${process.env.NEXT_PUBLIC_API}/inscription?flagged=true`)
        .then((res) => {
          setFlaggedItems(res.data.data.inscriptions);
      })
      .catch(err=> notify({type:'error', message:"Error getting flagged items"}))
  }, []);
    
    useEffect(() => {
        getFlaggedItems();
    }, [])
    

    return <div className="text-white center flex-wrap">
        {
            flaggedItems?.length > 0 ? (<>
                {
                    flaggedItems.map(item => (
                        <Card item={item} key={ item._id} />
                    ))
                }
            </>) : (<p className="text-center">No Flagged Items Present</p>)
      }
  </div>;
}
export default Flgged;
