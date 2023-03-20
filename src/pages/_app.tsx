import { AppProps } from 'next/app';
import Head from 'next/head';
import { FC, useEffect, useState } from 'react';
import Notifications from '../components/Notification'
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../styles/globals.css";
import Navbar from "../components/Layout/Navbar"
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Mixpanel } from 'utils/mixpanel';
import axios from 'axios'
import Meta from 'components/Layout/Meta';
import Loading from "components/Others/Loading"
import { Router } from "next/router";
import { Provider } from "react-redux";
import {store, persistor} from 'stores';
import Input from 'components/Explorer/Input';

import { PersistGate } from "redux-persist/integration/react";


//connect wallet HIRO
import { Connect } from "@stacks/connect-react";
import { useAuth } from "../common/use-auth";
import { AppContext } from "../common/context";
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#296ff0",
    },
  },
});
const App: FC<AppProps> = ({ Component, pageProps }) => {
  const { authOptions, state, authResponse, appPrivateKey, handleSignOut } =
    useAuth();
  const [ip, setIP] = useState("");
  const getData = async()=>{
        const res = await axios.get('https://geolocation-db.com/json/')
    setIP(res.data.IPv4||"none")
    if (res.data.IPv4) Mixpanel.identify(res.data.IPv4);
    }
  useEffect(() => {
    getData()
  }, [])

  
    function getInstalledWalletName() {
      const wallets = [];
      // if (typeof window.unisat !== "undefined") {
      //   wallets.push("Unisat");
      // }

      //@ts-ignore
      if (window?.StacksProvider?.psbtRequest) {
        wallets.push("Hiro");
      }

      // if (
      //   window?.BitcoinProvider?.signTransaction?.toString()?.includes("Psbt")
      // ) {
      //   wallets.push("Xverse");
      // }
      localStorage.setItem("btc-wallets", JSON.stringify(wallets));
    }
    const [loading, setLoading] = useState(false);
    useEffect(() => {
      Router.events.on("routeChangeStart", () => {
        getInstalledWalletName();
        setLoading(true)
      });
      Router.events.on("routeChangeComplete", () => {
        getInstalledWalletName();
        setLoading(false)
      });
      Router.events.on("routeChangeError", () => {
        getInstalledWalletName();
        setLoading(false)
      });
      return () => {
        Router.events.off("routeChangeStart", () => {
          getInstalledWalletName();
          setLoading(true)
        });
        Router.events.off("routeChangeComplete", () => {
          getInstalledWalletName();
          setLoading(false)
        });
        Router.events.off("routeChangeError", () => {
          getInstalledWalletName();
          setLoading(false)
        });
      };
    }, [Router.events]);
  
  useEffect(() => { 
  getInstalledWalletName()
  }, [ip])
  
  

  
    return (
      <ThemeProvider theme={darkTheme}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <Connect authOptions={authOptions}>
              <AppContext.Provider value={state}>
                <div className="relative">
                  <Meta
                    title="Ordscan"
                    description={`Ordscan is an explorer, marketplace and a one stop solution for all your ordinal needs!`}
                    image={"https://ordscan.xyz/assets/images/screen.png"}
                  />
                  <Notifications />
                  <Analytics />
                  <div
                    style={{ zIndex: -1 }}
                    className="fixed top-0 bottom-0 right-0 left-0"
                  >
                    {// eslint-disable-next-line @next/next/no-img-element
                    <img
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      src="/assets/images/Services.png"
                      alt="bg"
                    />}
                  </div>
                  <div className="relative z-[1] bg-blue-00 ">
                    <Navbar />
                    <Input />
                    {loading ? (
                      <div className="center min-h-[50vh]">
                        <Loading />
                      </div>
                    ) : (
                      <Component {...pageProps} />
                    )}
                  </div>
                </div>
              </AppContext.Provider>
            </Connect>
          </PersistGate>
        </Provider>
      </ThemeProvider>
    );
};

export default App;
