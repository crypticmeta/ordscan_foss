import Modal from "@mui/material/Modal";
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { notify } from "utils/notifications";
import { shortForm } from "utils/shortForm";
import { AiOutlineCopy } from "react-icons/ai";
import copy from "copy-to-clipboard";
function Card({ item }) {
  const [password, setPassword] = useState("");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("image");
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const moderate = useCallback(async (decision: string) => {
    await axios.post(
      `${process.env.NEXT_PUBLIC_API}/inscription/moderate`,
      {
        _id: item._id,
        flagged: false,
        banned: decision === "ban" ? true : false,
        password,
      }
    ).then(res => {
      handleClose();
      notify({type:"success", message:"successfully updated inscription"})
    }).catch(err=>notify({type:"error", message:"Error updating inscription"}));
  }, [item._id, password]);

  const getContent = useCallback(async () => {
    await axios
      .get(`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.id}`)
      .then((res) => {
        const icon_type = res.headers["content-type"];
        if (icon_type.includes("image")) setType("image");
        else if (icon_type.includes("audio")) setType("audio");
        else if (icon_type.includes("video")) setType("video");
        else if (icon_type.includes("text/plain")) setType("text");
        else setType("file");
      });
  }, []);

  useEffect(() => {
    getContent();
  }, [getContent]);

  return (
    <div className=" overflow-hidden text-white p-3">
      <div className="services-gradient rounded shadow brightness-90 hover:brightness-110">
        <div className="w-[300px] h-[350px] overflow-hidden relative">
          {type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              style={{
                objectFit: "fill",
                imageRendering: "pixelated",
              }}
              className={`overflow-hidden w-full h-full`}
              alt="ordinal"
              src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.id}`}
            />
          ) : (
            <>
              {type === "video" ? (
                <video muted autoPlay>
                  <source
                    src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.id}`}
                  />
                </video>
              ) : (
                <iframe
                  referrerPolicy="no-referrer"
                  sandbox="allow-scripts allow-same-origin"
                  className={`overflow-hidden`}
                  src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.id}`}
                ></iframe>
              )}
            </>
          )}
        </div>
        <div className="p-3 bg-brand_black">
          <h3>{item.collectionId?.name || " No Collection "}</h3>
          <div className="flex text-xs py-2 items-center">
            <span>{shortForm(item.id)} </span>
            <AiOutlineCopy
              className="text-xl ml-3 cursor-pointer"
              onClick={() => copy(item.id, { message: "copied to clipboard" })}
            />
          </div>
        </div>
        <div className="center bg-brand_black">
          <button
            onClick={handleOpen}
            className="bg-brand_red text-white px-4 py-1"
          >
            Moderate
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
                Moderating Flagged Item
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
                        src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.id}`}
                      />
                    ) : (
                      <>
                        {type === "video" ? (
                          <video muted autoPlay>
                            <source
                              src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.id}`}
                            />
                          </video>
                        ) : (
                          <iframe
                            referrerPolicy="no-referrer"
                            sandbox="allow-scripts allow-same-origin"
                            className={`overflow-hidden`}
                            src={`${process.env.NEXT_PUBLIC_PROVIDER}/content/${item.id}`}
                          ></iframe>
                        )}
                      </>
                    )}
                  </>
                </div>
                <div className="flex text-xs text-white py-2 items-center">
                  <span>{shortForm(item.id)} </span>
                  <AiOutlineCopy
                    className="text-xl ml-3 cursor-pointer"
                    onClick={() =>
                      copy(item.id, { message: "copied to clipboard" })
                    }
                  />
                </div>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent text-white focus:outline-none w-full  border border-brand_red px-4 py-1"
                  placeholder="password"
                />
              </div>

              <div className="center">
                <button
                  onClick={() => moderate("ban")}
                  className="m-6 z-[1] left-0 bg-red-600 text-white text-xl px-6 py-2 rounded  hover:bg-red-800"
                >
                  BAN
                </button>
                <button
                  onClick={() => moderate("unflag")}
                  className="m-6 z-[1] left-0 bg-brand_blue text-white text-xl px-6 py-2 rounded  hover:bg-red-800"
                >
                  UNFLAG
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

export default Card;
