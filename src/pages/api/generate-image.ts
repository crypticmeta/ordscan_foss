import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";

async function ss (req: NextApiRequest, res: NextApiResponse) {
  const { query } = req;
  const { url } = query;

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(String(url), { waitUntil: "networkidle2" });
    // Set viewport width and height
      await page.setViewport({ width: 1920, height: 1080 });
    const screenshotBuffer = await page.screenshot({ fullPage: false, type:"png" });
    await browser.close();
    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Cache-Control",
      "public, immutable, no-transform, s-maxage=31536000, max-age=31536000"
    );
    res.status(200).send(screenshotBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
};

export default ss  