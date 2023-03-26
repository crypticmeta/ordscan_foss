import React, { useEffect, useRef, useState } from 'react'
import { AiFillHome, AiOutlineClose, AiOutlineMenu } from "react-icons/ai";
import {FaDiscord} from 'react-icons/fa'
import Link from "next/link"
import { BsTwitter } from 'react-icons/bs';
import { saveAs } from "file-saver";
function Navbar() {

  const [open, setOpen] = useState(false);
  const MobileNav = { true: "translateX(0%)", false: "translateX(100%)" };
  var style = {
    //@ts-ignore
    transform: MobileNav[open],
    boxShadow: open ? "-8px -2px 21px 7px rgba(0,0,0,0.75)" : "none",
  };

  const menuRef = useRef();

  const handleClickOutside = event => {
    //@ts-ignore
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);




  return (
    <div className="text-white flex justify-between w-full custom-container text-3xl">
      <div className="flex">
        <Link href="/" >
          <p className="text-brand_red">Ordinal Novus</p>
        </Link>
        <a target="#" href="https://blokmoon.com">
          <span className="text-xs pl-2">By Blokmoon</span>
        </a>
      </div>
      <div className="text-3xl text-white ">
        <div className="cursor-pointer">
          <AiOutlineMenu onClick={() => setOpen(!open)} />
        </div>
      </div>
      <aside
        ref={menuRef}
        style={style}
        className=" fixed right-0 top-0 bottom-0 z-50 min-h-screen w-10/12 md:w-6/12 lg:w-4/12  bg-brand_secondary transition-all p-6  duration-700"
      >
        <div className="flex text-white items-center space-x-8">
          <p className=" text-2xl md:text-3xl font-extrabold">OrdinalNovus</p>
          <div className="flex space-x-4 text-2xl md:text-3xl ">
            <Link
              onClick={() => setOpen(false)}
              target="#"
              href="https://twitter.com/OrdinalNovus"
            >
              <BsTwitter />
            </Link>
            <Link
              onClick={() => setOpen(false)}
              target="#"
              href="https://discord.gg/UCgMuJ3uGx"
            >
              {" "}
              <FaDiscord />{" "}
            </Link>
          </div>
          <div className="text-3xl  p-2 cursor-pointer text-white  ">
            <AiOutlineClose onClick={() => setOpen(!open)} className="" />
          </div>
        </div>
        <div className="text-sm pt-2 text-red-200">
          Built by{" "}
          <span className="bg-red-800 cursor-pointer hover:bg-red-900 px-2 py-1">
            <a target="_blank" href="https://blokmoon.com" rel="noreferrer">
              Blokmoon
            </a>
          </span>
        </div>
        {/* <div className="text-sm pt-6">
          <p className="text-gray-200 pb-3">Having issues indexing ORD?</p>
          <p className="text-xs pb-1">
            Download latest ORD Index file. Ord Version 0.5.0
          </p>
          <button className="bg-white text-brand_black uppercase font-thin px-4 py-2 text-xs">
            <a href="https://get.massive.app/01GSF51KKAG2QCH4Z5C81HDJP6?secret=wuUapxMNtvDHnWtx">
              Download
            </a>
          </button>
        </div> */}
        {/* <div className="text-sm pt-6">
          <p className="text-gray-200 pb-3">TOOLS</p>
          <button className="bg-white text-brand_black uppercase font-thin px-4 py-2 text-xs">
            <Link href="/tools/fee-alert">Fee Alert</Link>
          </button>
        </div> */}
      </aside>
    </div>
  );
}

export default Navbar