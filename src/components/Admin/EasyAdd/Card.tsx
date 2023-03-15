import Modal from '@mui/material/Modal';
import React, { useState } from 'react'
import axios from 'axios'
import { notify } from 'utils/notifications';
function Card({ item, dbNameList, dbSlugList }) {
  const [password, setPassword] = useState("")
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("image");
   const handleOpen = () => {
     setOpen(true);
     getContent()
   };
  const handleClose = () => setOpen(false);

  const addCollection = async () => {
    try {
      const inscriptions:any = await axios.get(
      `https://raw.githubusercontent.com/ordinals-wallet/ordinals-collections/main/collections/${item.slug}/inscriptions.json`
      ).catch(err => { return });
      const createInscriptionsData = {
        idList: inscriptions.data,
        naminPattern: item.name,
        password,
        collectionId:""
      }
      await axios.post(`${process.env.NEXT_PUBLIC_API}/collection/create`, {
        name: item.name,
        slug: item.slug,
        supply: item.supply,
        discord_link: item.discord_link,
        website_link: item.website_link,
        twitter_link: item.twitter_link,
        inscription_icon: item.inscription_icon,
        collectionLive: true,
        icon_type: type,
        password
    })
      .then(async res => {
        notify({type:"success", message:"Collection added successfully. Adding inscriptions now."})
        const collection_id = res.data.data._id
        createInscriptionsData.collectionId = collection_id;
        await axios.post(`${process.env.NEXT_PUBLIC_API}/inscription/create`, createInscriptionsData)
          .then(res => {
            notify({ type: "success", message: res.data.message })
            handleClose()
            setPassword("")
          }).catch(err => {
          notify({type:"error", message: err.response.data.message})
        })
      }).catch(err => {
        console.error(err.response, 'err creating collection')
      notify({type:"error", message:err.response.data.message})
    })
    } catch (e) {
      
   }
  }
  
  const getContent = async () => {
    await axios.get(`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.inscription_icon}`)
      .then(res => {
        const icon_type = res.headers["content-type"];
        if (icon_type.includes("image")) setType("image");
        else if (icon_type.includes("audio")) setType("audio");
        else if (icon_type.includes("video")) setType("video");
        else if (icon_type.includes("text/plain")) setType("text");
        else setType("file");
    })
  }
  if (dbNameList.includes(item.name) || dbSlugList.includes(item.slug))
    return <></>
  else
    return (
      <div className=" overflow-hidden text-white p-3">
        <div className="services-gradient rounded shadow brightness-90 hover:brightness-110">
          <div className=" max-h-[350px] max-w-[280px]  md:max-h-[350px] md:max-w-[280px] ">
            <iframe
              referrerPolicy="no-referrer"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
              className={`overflow-hidden w-full`}
              src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.inscription_icon}`}
            ></iframe>
          </div>
          <div className="p-3 bg-brand_black">
            <h3>{item.name}</h3>
          </div>
          <div className="center bg-brand_black">
            <button
              onClick={handleOpen}
              className="bg-brand_red text-white px-4 py-1"
            >
              Add Collection
            </button>
          </div>
        </div>
        {open ? (
          <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="List Inscription For Sale"
            aria-describedby="List Inscription For Sale"
          >
            <div className="center min-h-screen bg-black bg-opacity-80">
              <div className="w-full md:w-8/12 lg:w-6/12 custom-container bg-brand_black border border-brand_red">
                <h2 className="text-white text-center">
                  Adding <span className="text-brand_red">{item.name}</span>{" "}
                  Collection
                </h2>
                <div className="py-4 center flex-col">
                  <div className="py-2 max-w-[200px]">
                    <>
                      {type === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          style={{
                            objectFit: "contain",
                            imageRendering: "pixelated",
                          }}
                          className={`overflow-hidden w-full`}
                          alt="ordinal"
                          src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.inscription_icon}`}
                        />
                      ) : (
                        <>
                          {type === "video" ? (
                            <video muted autoPlay>
                              <source
                                src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.inscription_icon}`}
                              />
                            </video>
                          ) : (
                            <iframe
                              referrerPolicy="no-referrer"
                              sandbox="allow-scripts allow-same-origin"
                              className={`overflow-hidden`}
                              src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.inscription_icon}`}
                            ></iframe>
                          )}
                        </>
                      )}
                    </>
                  </div>
                  <input
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                    className="bg-transparent text-white focus:outline-none w-full  border border-brand_red px-4 py-1"
                    placeholder="password"
                  />
                </div>

                <div className="center">
                  <button
                    onClick={() => addCollection()}
                    className="m-6 z-[1] left-0 bg-brand_red text-white text-xl px-6 py-2 rounded  hover:bg-red-800"
                  >
                    Add
                  </button>

                  <button
                    onClick={handleClose}
                    className="m-6 z-[1] left-0 bg-brand_red text-white text-xl px-6 py-2 rounded  hover:bg-red-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        ) : (
          <></>
        )}
      </div>
    );
}

export default Card