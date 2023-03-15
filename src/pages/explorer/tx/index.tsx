import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
function Explorer() {
  const router = useRouter();
  useEffect(() => {
    router.push("/explorer");
  }, []);

  return <div></div>;
}
export default Explorer;
