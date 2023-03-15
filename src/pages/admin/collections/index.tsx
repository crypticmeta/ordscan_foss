import React from "react";
import Collections from "components/Collections";
function CollectionsPage({data}) {
  return (
    <div className="min-h-screen custom-container">
      <Collections colls={ data.collections} />
    </div>
  );
}

// This gets called on every request
export async function getServerSideProps() {
  let data = {
    featuredCollections: [],
    collections: []
  };
  // Fetch data from external data source
  try {
    const res2: any = await fetch(
      `${process.env.NEXT_PUBLIC_API}/collection`
    );

    const response2 = (await res2?.json()) || {};
    data = {
      featuredCollections:
        response2.data.collections.filter((a) => a.featured) || [],
        collections: response2.data.collections || [],
    };
  } catch (e) {
    console.error(e, "ERR");
  }
  // Pass data to the page via props
  return { props: { data } };
}
export default CollectionsPage;
