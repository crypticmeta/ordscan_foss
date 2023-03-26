import Head from "next/head";
import React, { useEffect, useState } from "react";

function Meta({ title, description, url }) {

  return (
    <Head>
      {/* Basic meta tags */}
      <title key={"title"}>{title}</title>
      <meta name="keywords" content="OrdinalNovus, NFT, non-fungible tokens, Bitcoin, ordinals, inscriptions, marketplace, explorer, digital art, blockchain, NFT trading, NFT collecting"/>
      <link rel="shortcut icon" href="/favicon.ico" />
      <meta charSet="utf-8" />
      <meta key={"description"} name="description" content={description} />
      <meta name="viewport" content="width=device-width" />
      <meta name="robots" content="index,follow" />
      <meta name="theme-color" content="#000000" />

      {/* Open Graph meta tags */}
      <meta key={"og:type"} property="og:type" content="website" />
      <meta key={"og:title"} property="og:title" content={title} />
      <meta
        key={"og:description"}
        property="og:description"
        content={description}
      />
      <meta
        key={"og:image"}
        property="og:image"
        content={`${
          process.env.NEXT_PUBLIC_API
        }/generate-image?url=${encodeURIComponent(url)}`}
      />
      <meta key={"og:url"} property="og:url" content={url} />
      <meta
        key={"og:site_name"}
        property="og:site_name"
        content="Ordinalnovus"
      />

      {/* Twitter cards */}
      <meta
        key={"twitter:card"}
        name="twitter:card"
        content="summary_large_image"
      />
      <meta key={"twitter:site"} name="twitter:site" content="@OrdinalNovus" />
      <meta key={"twitter:title"} name="twitter:title" content={title} />
      <meta
        key={"twitter:description"}
        name="twitter:description"
        content={description}
      />
      <meta
        key={"twitter:image"}
        name="twitter:image"
        content={`${
          process.env.NEXT_PUBLIC_API
        }/generate-image?url=${encodeURIComponent(url)}`}
      />
      <meta key={"twitter:url"} name="twitter:url" content={url} />
      <meta name="twitter:cta" content="View on Ordinalnovus" />
    </Head>
  );
}

export default Meta;
