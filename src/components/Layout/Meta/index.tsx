import Head from "next/head"
import React from 'react'

function Meta({title, description, image}) {
  return (
    <Head>
      <title key={"title"}>{title}</title>
      <meta charSet="utf-8" />
      <meta key={"description"} name="description" content={description} />
      <meta key={"og:image"} property="og:image" content={image} />
      <meta key={"og:title"} property="og:title" content={title} />
      <meta
        name="keywords"
        content="nft, ordinals, marketplace, crypto, bitcoin, satoshi, inscription, ordscan"
      />
      <meta property="og:type" content="website" />

      {/* <!-- Twitter cards --> */}
      <meta
        key={"twitter:card"}
        name="twitter:card"
        content="summary_large_image"
      />
      <meta key={"twitter:site"} name="twitter:site" content="@ordscanxyz" />
      <meta key={"twitter:title"} name="twitter:title" content={title} />
      <meta
        key={"twitter:description"}
        name="twitter:description"
        content={description}
      />
      <meta name="twitter:cta" content="View on Ordscan" />
      <meta key={"twitter:image"} name="twitter:image" content={image} />
    </Head>
  );
}

export default Meta