import Head from "next/head";
import React, { useEffect, useState } from "react";

function Meta({ title, description, url }) {
  const [image, setImage] = useState(null);

  // Fetch the screenshot of the URL using the provided API
  useEffect(() => {
    async function generateImage() {
      try {
        const response = await fetch(
          `/api/generate-image?url=${encodeURIComponent(url)}`
        );
        if (response.ok) {
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          setImage(imageUrl);
        }
      } catch (error) {
        console.error("Error generating image:", error);
      }
    }
    generateImage();
  }, [url]);

  return (
    <Head>
      {/* Basic meta tags */}
      <title key={"title"}>{title}</title>
      <meta charSet="utf-8" />
      <meta key={"description"} name="description" content={description} />
      <meta name="viewport" content="width=device-width" />
      <meta name="robots" content="index,follow" />
      <meta name="theme-color" content="#000000" />

      {/* Favicon and touch icons */}
      <link
        rel="icon"
        href="/img/favicon/android-chrome-192x192.png"
        type="image/png"
      />
      <link rel="android-touch-icon" href="img/appIcon.png" />
      <link
        rel="apple-touch-icon"
        href="/img/favicon/android-chrome-192x192.png"
      />

      {/* Open Graph meta tags */}
      <meta key={"og:type"} property="og:type" content="website" />
      <meta key={"og:title"} property="og:title" content={title} />
      <meta
        key={"og:description"}
        property="og:description"
        content={description}
      />
      <meta key={"og:image"} property="og:image" content={image} />
      <meta key={"og:url"} property="og:url" content={url} />
      <meta key={"og:site_name"} property="og:site_name" content="Magic Eden" />

      {/* Twitter cards */}
      <meta
        key={"twitter:card"}
        name="twitter:card"
        content="summary_large_image"
      />
      <meta key={"twitter:site"} name="twitter:site" content="@MagicEden" />
      <meta key={"twitter:title"} name="twitter:title" content={title} />
      <meta
        key={"twitter:description"}
        name="twitter:description"
        content={description}
      />
      <meta key={"twitter:image"} name="twitter:image" content={image} />
      <meta key={"twitter:url"} name="twitter:url" content={url} />
      <meta name="twitter:cta" content="View on Magic Eden" />
    </Head>
  );
}

export default Meta;
