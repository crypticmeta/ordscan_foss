import Link from 'next/link';
import React, { useState } from 'react'
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import usePagination from 'components/Others/Pagination';
import Card from './Card';
interface EasyAdd {
  data: any;
}

function EasyAdd({ data }: EasyAdd): JSX.Element {
  const [githubCollections, setGithubCollections] = useState(data.githubCollections|| [])
  const [itemPerPage, setItemPerPage] = useState(12);
  let [page, setPage] = useState(1);
  const count = Math.ceil(githubCollections.length / itemPerPage);
  const _DATA = usePagination(githubCollections, itemPerPage);

  const handleChange = (e, p) => {
    setPage(p);
    _DATA.jump(p);
  };
  return (
    <div>
      <Stack spacing={2}>
        <Pagination
          count={count}
          size={"large"}
          variant="outlined"
          shape="rounded"
          onChange={handleChange}
        />
      </Stack>
      <div className="flex items-center justify-center flex-wrap">
        {_DATA?.currentData().length > 0 &&
          _DATA
            ?.currentData()
          .map((item) => <Card key={item.slug} item={item} dbSlugList={data.dbSlugList} dbNameList={data.dbNameList } />)}
      </div>
    </div>
  );
}

export default EasyAdd