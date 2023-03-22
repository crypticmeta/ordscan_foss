import {
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Switch,
} from "@mui/material";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { notify } from "utils/notifications";
import { useRouter } from "next/router";
import csv from 'csvtojson'
import type { Collection } from "types";

  interface Inscription {
    id: string;
    number: string;
  }
function Form() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [description, setDescription] = useState("");
  const [coverImg, setCoverImg] = useState("");
  const [password, setPassword] = useState("");
  const [discord, setDiscord] = useState("");
  const [twitter, setTwitter] = useState("");
  const [status, setStatus] = useState("inscribed");
  const [type, setType] = useState("image");
  const [featured, setFeatured] = useState("false");
  const [verified, setVerified] = useState("true");
  const [collectionLive, setcollectionLive] = useState("false");
  const [website, setWebsite] = useState("");
  const [tags, setTags] = useState("");
  const [mode, setMode] = useState("add");
  const [csvInput, setCsvInput] = useState(true)
  const [collection, setCollection] = useState<Collection>(null);
  const [inscriptions, setInscriptions] = useState([]);
  const [editInscriptions, setEditInscriptions] = useState(false);
  const [newJSON, setNewJSON] = useState<Inscription>(null);
  const [listUpdate, setListUpdate] = useState(true)

  //add inscriptions
  const [newInscriptionsCSV, setNewInscriptionsCSV] = useState("");
  const [namingPattern, setNamingPattern] = useState("");
  const [inscripted, setInscripted] = useState(0)

  const handleSubmit = async () => {
    if (name && slug && totalItems && description && coverImg && password) {
      if (router?.query?.slug) {
        return handleCollectionUpdate();
      }
      await axios
        .post(`${process.env.NEXT_PUBLIC_API}/collection/create`, {
          name,
          slug,
          supply: totalItems,
          description,
          inscription_icon: coverImg,
          password,
          discord_link: discord,
          twitter_link: twitter,
          status,
          featured,
          icon_type: type,
          website_link: website,
          collectionLive,
          verified,
          tags: tags.split(","),
        })
        .then((res) => {
          notify({ type: "success", message: "added successfully" });
          router.push(`/admin/collections/`);
        })
        .catch((err) => {
          if (err.response?.data?.message)
            notify({
              type: "error",
              message: JSON.stringify(err.response.data.message),
            });
          else
            notify({
              type: "error",
              message: JSON.stringify(err.response.data.message),
            });
        });
    } else {
      notify({ type: "error", message: "Incomplete collection data" });
    }
  };
  const handleCollectionUpdate = async () => {
    if (name && slug && totalItems && description && coverImg && password) {
      await axios
        .post(`${process.env.NEXT_PUBLIC_API}/collection/update`, {
          name,
          slug,
          supply: totalItems,
          description,
          inscription_icon: coverImg,
          password,
          discord_link: discord,
          twitter_link: twitter,
          status,
          featured,
          icon_type: type,
          website_link: website,
          collectionLive,
          verified,
          tags: tags.split(","),
          _id: collection._id,
        })
        .then((res) => {
          notify({ type: "success", message: "updated successfully" });
          router.push(`${router.asPath.replace("/update", "")}`);
        })
        .catch((err) => {
          if (err.response?.data?.message)
            notify({
              type: "error",
              message: JSON.stringify(err?.response.data.message),
            });
          else
            notify({
              type: "error",
              message: JSON.stringify(err?.response?.data?.message),
            });
        });
    } else {
      notify({ type: "error", message: "Incomplete update data" });
    }
  };
  const handleInscriptionsUpdate = async () => {
    if (namingPattern && newJSON && password && !listUpdate) {
      await axios
        .post(
          `${process.env.NEXT_PUBLIC_API}/inscription/create`,
          {
            password,
            namingPattern: namingPattern,
            idList: newJSON,
            collectionId: collection._id,
          }
        )
        .then((res) => {
          notify({ type: "success", message: "added successfully" });
          setNamingPattern("");
          setNewInscriptionsCSV("");
          setNewJSON(null);
          setPassword("");
          getCollection();
        })
        .catch((err) => {
          console.error(err);
          if (err.response?.data?.message)
            notify({
              type: "error",
              message: JSON.stringify(err.response.data.message),
            });
          else
            notify({
              type: "error",
              message: JSON.stringify(err.response.data.message),
            });
        });
    } else if (namingPattern && newJSON && password && listUpdate) {
      await axios
        .post(`${process.env.NEXT_PUBLIC_API}/inscription/update`, {
          password,
          namingPattern: namingPattern,
          idList: newJSON,
          collectionId: collection._id,
        })
        .then((res) => {
          notify({ type: "success", message: "List updated successfully" });
          setNamingPattern("");
          setNewInscriptionsCSV("");
          setNewJSON(null);
          setPassword("");
          getCollection();
        })
        .catch((err) => {
          console.error(err);
          if (err.response?.data?.message)
            notify({
              type: "error",
              message: JSON.stringify(err.response.data.message),
            });
          else
            notify({
              type: "error",
              message: JSON.stringify(err.response.data.message),
            });
        });
    } else {
      notify({ type: "error", message: "Incomplete data" });
    }
  };

  const handleCSVSubmit = () => {
  
    if ((csvInput && !newInscriptionsCSV.includes("number")) || !newInscriptionsCSV.includes("id")) {
     return  notify({type:"error", message:"Make sure the text contains number and ID"})
    }
    if(csvInput)
    csv()
      .fromString(newInscriptionsCSV)
      //@ts-ignore
        .then((jsonObj) => setNewJSON(jsonObj));
    else
      setNewJSON(JSON.parse(newInscriptionsCSV))
  }
  const handleChange = (event: SelectChangeEvent) => {
    setStatus(event.target.value as string);
  };
  const handleType = (event: SelectChangeEvent) => {
    setType(event.target.value as string);
  };
  const handleFeaturedChange = (event: SelectChangeEvent) => {
    setFeatured(event.target.value as unknown as string);
  }; const handleVerifiedChange = (event: SelectChangeEvent) => {
    setVerified(event.target.value as unknown as string);
  };
  const handlecollectionLiveChange = (event: SelectChangeEvent) => {
    setcollectionLive(event.target.value as unknown as string);
  };
  const getInscriptions = useCallback(async () => {
    if (collection?._id) {
      await axios
        .get(
          `${process.env.NEXT_PUBLIC_API}/inscription?collectionId=${collection._id}&_sort=name:1&_limit=1`
        )
        .then((res) => {
          setInscriptions(res.data.data.inscriptions);
          setInscripted(res.data.data.total);
        })
        .catch((err) => {
          notify({ type: "error", message: "Error getting data" });
        });
    }
  }, [collection]);
  const getCollection = useCallback(async () => {
    if (router.query.slug) {
      await axios
        .get(
          `${process.env.NEXT_PUBLIC_API}/collection?slug=${router.query.slug}`
        )
        .then((res) => {
          setCollection(res.data.data.collections[0]);
          setMode("edit");
        })
        .catch((err) => {
          notify({ type: "error", message: "Error getting data" });
        });
    }
  }, [router]);
  useEffect(() => {
    if (collection?._id) getInscriptions();
  }, [ collection]);
  useEffect(() => {
    if (router.query.slug) {
      getCollection();
    }
  }, [getCollection, router]);

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setSlug(collection.slug);
      setDescription(collection.description);
      setDiscord(collection.discord_link || "");
      setTwitter(collection.twitter_link || "");
      setWebsite(collection.website_link || "");
      setTotalItems(collection.supply || 0);
      setStatus(collection.status);
      setCoverImg(collection.inscription_icon);
      setFeatured(String(collection.featured));
      setVerified(String(collection.verified));
      setType(collection.icon_type || "image");
      setcollectionLive(String(collection.collectionLive));
      setTags(collection.tags.join(","))
    }
  }, [collection]);

  return (
    <div className="custom-container text-white">
      <div className="text-3xl text-center pb-6 capitalize flex flex-col">
        <h2>
          {mode === "edit" ? "update" : "create"} {collection?.name}{" "}
          {editInscriptions ? "Inscription List" : "Collection"}
        </h2>
        <p className="text-lg bg-blue-300 text-brand_black py-2">
          There are <span className="text-blue-900">{inscripted}</span> in DB.
          There should be{" "}
          <span className="text-blue-900">{collection?.supply}</span>
        </p>
        {inscripted === collection?.supply && editInscriptions && (
          <p className="bg-red-300 text-red-900 py-2 text-base">
            Are you sure you want to add more items?
          </p>
        )}
      </div>
      {!editInscriptions ? (
        <div className="collection-form">
          <div className="name+slug flex flex-wrap justify-center items-center mb-3">
            <div className="w-full h-full md:w-6/12 lg:w-7/12 flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
              <input
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
                placeholder={"Enter collection Name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className=" text-xs md:text-base bg-brand_black w-full px-3 py-3 focus:outline-none rounded border-white border text-white"
              />
            </div>
            <div className="w-full h-full md:w-6/12 lg:w-5/12 flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
              <input
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
                placeholder={"Enter a slug"}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className=" text-xs md:text-base bg-brand_black w-full px-3 py-3 focus:outline-none rounded border-white border text-white"
              />
            </div>
          </div>
          <div className="totalItems+verified flex flex-wrap justify-center items-center mb-3">
            <div className="w-full h-full md:w-6/12 lg:w-7/12  flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
              <input
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
                placeholder={"Supply"}
                type="number"
                value={totalItems > 0 ? totalItems : ""}
                onChange={(e) =>
                  Number(e.target.value) > 0 &&
                  setTotalItems(Number(e.target.value))
                }
                className=" text-xs md:text-base bg-brand_black w-full px-3 py-3 focus:outline-none rounded border-white border text-white"
              />
            </div>
            <div className="w-full h-full md:w-6/12 lg:w-5/12 flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
              <FormControl fullWidth color="primary">
                <InputLabel id="verified">Verified</InputLabel>
                <Select
                  color="primary"
                  labelId="verified"
                  id="verified"
                  value={verified}
                  label="verified"
                  onChange={(e) => {
                    //@ts-ignore
                    handleVerifiedChange(e);
                  }}
                  variant="outlined"
                >
                  <MenuItem value={"true"}>True</MenuItem>
                  <MenuItem value={"false"}>False</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>
          <div className="description flex flex-wrap justify-center items-center mb-3">
            <div className="w-full flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
              <textarea
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
                rows={5}
                placeholder={"Enter Project Description"}
                value={description}
                maxLength={1000}
                onChange={(e) => setDescription(e.target.value)}
                className=" text-xs md:text-base bg-brand_black w-full px-3 py-3 focus:outline-none rounded border-white border text-white"
              />
            </div>
          </div>
          <div className="status+featured flex flex-wrap justify-center items-center mb-3">
            <div className="w-full h-full md:w-6/12 lg:w-7/12 flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
              <FormControl fullWidth color="primary">
                <InputLabel id="type">Type</InputLabel>
                <Select
                  color="primary"
                  labelId="type"
                  id="type"
                  value={type}
                  label="type"
                  onChange={(e) => handleType(e)}
                  variant="outlined"
                >
                  <MenuItem value={"image"}>Image</MenuItem>
                  <MenuItem value={"video"}>Video</MenuItem>
                  <MenuItem value={"audio"}>Audio</MenuItem>
                  <MenuItem value={"text"}>Text</MenuItem>
                  <MenuItem value={"file"}>File</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div className="w-full h-full md:w-6/12 lg:w-5/12 flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
              <FormControl fullWidth color="primary">
                <InputLabel id="show">Show</InputLabel>
                <Select
                  color="primary"
                  labelId="show"
                  id="show"
                  value={collectionLive}
                  label="Show"
                  onChange={(e) => {
                    //@ts-ignore
                    handlecollectionLiveChange(e);
                  }}
                  variant="outlined"
                >
                  <MenuItem value={"true"}>True</MenuItem>
                  <MenuItem value={"false"}>False</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>
          <div className="status+featured flex flex-wrap justify-center items-center mb-3">
            <div className="w-full h-full md:w-6/12 lg:w-7/12 flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
              <FormControl fullWidth color="primary">
                <InputLabel id="status">Status</InputLabel>
                <Select
                  color="primary"
                  labelId="Status"
                  id="status"
                  value={status}
                  label="Status"
                  onChange={(e) => handleChange(e)}
                  variant="outlined"
                >
                  <MenuItem value={"upcoming"}>Upcoming</MenuItem>
                  <MenuItem value={"ongoing"}>Ongoing</MenuItem>
                  <MenuItem value={"inscribed"}>Inscribed</MenuItem>
                </Select>
              </FormControl>
            </div>

            <div className="w-full h-full md:w-6/12 lg:w-5/12 flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
              <FormControl fullWidth color="primary">
                <InputLabel id="status">Featured</InputLabel>
                <Select
                  color="primary"
                  labelId="Featured"
                  id="featured"
                  value={featured}
                  label="Featured"
                  onChange={(e) => {
                    //@ts-ignore
                    handleFeaturedChange(e);
                  }}
                  variant="outlined"
                >
                  <MenuItem value={"true"}>True</MenuItem>
                  <MenuItem value={"false"}>False</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>
          <div className="discord+twitter flex flex-wrap justify-center items-center mb-3">
            <div className="w-full h-full md:w-6/12 lg:w-7/12 flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
              <input
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
                placeholder={"Enter Discord Link"}
                type="url"
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                className=" text-xs md:text-base bg-brand_black w-full px-3 py-3 focus:outline-none rounded border-white border text-white"
              />
            </div>
            <div className="w-full h-full md:w-6/12 lg:w-5/12 flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
              <input
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
                placeholder={"Enter Twitter link"}
                value={twitter}
                type="url"
                onChange={(e) => setTwitter(e.target.value)}
                className=" text-xs md:text-base bg-brand_black w-full px-3 py-3 focus:outline-none rounded border-white border text-white"
              />
            </div>
          </div>
          <div className="website+tags flex flex-wrap justify-center items-center mb-3">
            <div className="w-full h-full md:w-6/12 lg:w-7/12 flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
              <input
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
                placeholder={"Enter Website Link"}
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className=" text-xs md:text-base bg-brand_black w-full px-3 py-3 focus:outline-none rounded border-white border text-white"
              />
            </div>
            <div className="w-full h-full md:w-6/12 lg:w-5/12 flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
              <input
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
                placeholder={"Enter Tags"}
                value={tags}
                type="text"
                onChange={(e) => setTags(e.target.value)}
                className=" text-xs md:text-base bg-brand_black w-full px-3 py-3 focus:outline-none rounded border-white border text-white"
              />
            </div>
          </div>
          <div className="password+submit flex flex-wrap justify-center items-center mb-3">
            <div className="w-full h-full md:w-6/12 lg:w-7/12 flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
              <input
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
                placeholder={"Enter Your Password"}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className=" text-xs md:text-base bg-brand_black w-full px-3 py-3 focus:outline-none rounded border-white border text-white"
              />
            </div>
            <div className="w-full h-full md:w-6/12 lg:w-5/12 flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
              <input
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
                placeholder={"Enter Cover inscriptionID"}
                value={coverImg}
                onChange={(e) => setCoverImg(e.target.value)}
                className=" text-xs md:text-base bg-brand_black w-full px-3 py-3 focus:outline-none rounded border-white border text-white"
              />
            </div>
          </div>
          <div className="center">
            <button
              onClick={() => handleSubmit()}
              className="bg-brand_blue text-white mx-2 text-xl px-6 capitalize py-2 rounded hover:border-brand_black hover:text-brand_black border-2"
            >
              {mode === "edit" ? "Update" : "Add"} Collection
            </button>
            {mode === "edit" ? (
              <button
                onClick={() => setEditInscriptions(true)}
                className="bg-brand_black text-white mx-2 text-xl px-6 capitalize py-2 rounded hover:border-brand_blue hover:text-brand_blue border-2"
              >
                {"Update"} Inscription List
              </button>
            ) : (
              <></>
            )}
          </div>
        </div>
      ) : (
        <div className="inscription-form">
          <div className="inscriptionsCSV flex flex-wrap justify-center items-center mb-3">
            <div className="flex justify-between items-center w-full">
              <label className="text-left w-full">
                Add Inscription CSV here
              </label>
              <FormGroup>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="CSV"
                  onChange={() => setCsvInput(!csvInput)}
                />
              </FormGroup>
              <FormGroup>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Update"
                  onChange={() => setListUpdate(!listUpdate)}
                />
              </FormGroup>
            </div>
            <div className="w-full flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
              <textarea
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCSVSubmit();
                  }
                }}
                rows={10}
                placeholder={"Enter Inscriptions CSV List here"}
                value={newInscriptionsCSV}
                onChange={(e) => setNewInscriptionsCSV(e.target.value)}
                className=" text-xs md:text-base bg-brand_black w-full px-3 py-3 focus:outline-none rounded border-white border text-white"
              />
            </div>
          </div>
          {newJSON && (
            <>
              <div className="inscriptionsJSON flex flex-wrap justify-center items-center mb-3">
                <label className="text-left w-full">Generated JSON</label>
                <div className="w-full flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
                  <textarea
                    readOnly={true}
                    rows={10}
                    value={JSON.stringify(newJSON)}
                    className=" text-xs md:text-base bg-brand_black w-full px-3 py-3 focus:outline-none rounded border-white border text-white"
                  />
                </div>
              </div>
              <div className="password+namingpattren flex flex-wrap justify-center items-center mb-3">
                <div className="w-full h-full md:w-6/12 lg:w-7/12 flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
                  <input
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleInscriptionsUpdate();
                      }
                    }}
                    placeholder={"Enter Password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className=" text-xs md:text-base bg-brand_black w-full px-3 py-3 focus:outline-none rounded border-white border text-white"
                  />
                </div>
                <div className="w-full h-full md:w-6/12 lg:w-5/12 flex sm:px-6 lg:pl-0 py-1 justify-between items-center my-3 lg:my-0">
                  <input
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleInscriptionsUpdate();
                      }
                    }}
                    placeholder={"Enter Naming Pattern"}
                    value={namingPattern}
                    onChange={(e) => setNamingPattern(e.target.value)}
                    className=" text-xs md:text-base bg-brand_black w-full px-3 py-3 focus:outline-none rounded border-white border text-white"
                  />
                </div>
              </div>
            </>
          )}
          <div className="center">
            {newJSON && password && namingPattern && (
              <button
                onClick={() => handleInscriptionsUpdate()}
                className="bg-brand_blue text-white mx-2 text-xl px-6 capitalize py-2 rounded hover:border-brand_black hover:text-brand_black border-2"
              >
                Submit New Inscriptions
              </button>
            )}
            <button
              onClick={() => handleCSVSubmit()}
              className="bg-brand_blue text-white mx-2 text-xl px-6 capitalize py-2 rounded hover:border-brand_black hover:text-brand_black border-2"
            >
              generate {newJSON && "new"} JSON
            </button>
            {mode === "edit" ? (
              <button
                onClick={() => setEditInscriptions(false)}
                className="bg-brand_black text-white mx-2 text-xl px-6 capitalize py-2 rounded hover:border-brand_blue hover:text-brand_blue border-2"
              >
                Update Collection
              </button>
            ) : (
              <></>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Form;
