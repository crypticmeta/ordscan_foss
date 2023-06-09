import React from 'react'
import CollectionPage from 'components/Collections/CollectionsPage'
import Meta from 'components/Layout/Meta';
function Index(props) {
  console.log(props.data.data, 'PROPS')
  return (
    <>
      <Meta
        title={`${props.data?.data?.collections[0]?.name} | Ordinal Novus`}
        description={`${props.data?.data?.collections[0]?.description}`}
        url={`${process.env.NEXT_PUBLIC_SITE_URL}/collections/${props.data?.data?.collections[0]?.slug}`}
      />
      <CollectionPage data={props.data} />
    </>
  );
}

// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps(ctx) {
  let collectionData = {};
//  const res: any = await fetch(`https://ordapi.xyz/feed`);
  try {
    const slug = ctx.params.slug;
    const res: any = await fetch(`${process.env.NEXT_PUBLIC_API}/collection?slug=${slug}&_limit=1`);
    collectionData = await res.json();

    // // Get the paths we want to pre-render based on posts
    // paths = posts.data.collections.map((collection, idx) => ({
    //   params: { slug: collection.slug },
    // }));
  } catch (e) {}

  return {
    props: {data: collectionData},
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 1000 seconds
    revalidate: 1000, // In seconds
  }
}
// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// the path has not been generated.
export async function getStaticPaths() {
  let paths = []
  try {
     const res: any = await fetch(
     `${process.env.NEXT_PUBLIC_API}/collection`
   );
  const posts = await res.json()

  // Get the paths we want to pre-render based on posts
   paths = posts.data.collections.map((collection, idx) => ({
    params: { slug: collection.slug },
  }));
  }
  catch(e){}

  // We'll pre-render only these paths at build time.
  // { fallback: 'blocking' } will server-render pages
  // on-demand if the path doesn't exist.
  return { paths:paths, fallback: 'blocking' }
}
export default Index