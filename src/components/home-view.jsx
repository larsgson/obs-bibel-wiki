import React from "react";
import { useTranslation } from "react-i18next";
import { Typography, Grid, ImageList, ImageListItem } from "@mui/material";
import { isEmptyObj } from "../utils/obj-functions";
import { getChIcon } from "../utils/icon-handler";
import useMediaPlayer from "../hooks/useMediaPlayer";
import useBrowserData from "../hooks/useBrowserData";
import HistoryView from "./history-view";
import { getSerie, serieNavLang, serieNaviType } from "../utils/dynamic-lang";

const HomeView = ({ onStartPlay }) => {
  const { navHist, startPlay, curPlay, syncImgSrc, syncVerseText } =
    useMediaPlayer();
  const { width } = useBrowserData();
  const isPlaying = !isEmptyObj(curPlay);
  const { t, i18n } = useTranslation();
  const lng = i18n.language;

  const handleHistoryClick = (obj) => {
    const useLevel0 = obj?.ep?.topIdStr;
    const useCh = obj?.ep?.id;
    const langID = obj?.ep?.langID || obj?.ep?.lang;
    const curSerie = {
      ...getSerie(langID, useLevel0),
      language: langID,
    };

    if (serieNaviType(useLevel0) === "audioStories") {
      startPlay(useLevel0, useCh, curSerie, obj?.ep);
    }
  };
  const dailyList = navHist
    ? Object.keys(navHist)
        .filter((key) => {
          const navObj = navHist[key];
          const useLevel0 = navObj?.topIdStr;
          return serieNaviType(useLevel0) === "videoPlan";
        })
        .map((key) => {
          const navObj = navHist[key];
          const useLevel0 = navObj?.topIdStr;
          const useLng = serieNavLang(useLevel0);
          return {
            key,
            id: key,
            image: navObj.image,
            langID: useLng,
            title: t(navObj.title, { lng: useLng }),
            descr: t(navObj.descr, { lng: useLng }),
            ep: navHist[key],
          };
        })
    : [];

  const myList = navHist
    ? Object.keys(navHist)
        .filter((key) => {
          const navObj = navHist[key];
          const useLevel0 = navObj?.topIdStr;
          const serNType = serieNaviType(useLevel0);
          return ["audioBible", "audioStories", "videoSerie"].includes(
            serNType,
          );
        })
        .map((key) => {
          const navObj = navHist[key];
          const useLevel0 = navObj?.topIdStr;
          const serNType = serieNaviType(useLevel0);

          if (serNType === "audioBible") {
            const { bookObj, id: useCh, bk } = navObj;
            const { level1: useLevel1, level2: useLevel2 } = bookObj || {};
            const epObj = getChIcon(
              useCh,
              useLevel0,
              useLevel1,
              useLevel2,
              bookObj,
              useCh,
            );
            return {
              key,
              id: key,
              imageSrc: epObj.imgSrc,
              title: epObj.title,
              descr: `${bk} ${useCh}`,
              ep: navHist[key],
            };
          } else if (serNType === "audioStories") {
            return {
              key,
              id: key,
              imageSrc: navObj?.image?.filename,
              title: navObj.title,
              descr: navObj.subtitle,
              ep: navHist[key],
            };
          } else if (["videoSerie", "videoPlan"].includes(serNType)) {
            const useLng = serieNavLang(useLevel0);
            return {
              key,
              id: key,
              image: navObj.image,
              title: t(navObj.title, { lng: useLng }),
              descr: t(navObj.descr, { lng: useLng }),
              ep: navHist[key],
            };
          }
          return null;
        })
        .filter(Boolean)
    : [];
  const showSyncImage =
    isPlaying && ["audio", "bible"].includes(curPlay?.curSerie?.mediaType);

  const getExtFilename = (fname) =>
    fname?.slice(((fname?.lastIndexOf(".") - 1) >>> 0) + 2);
  const isVideoSrc = getExtFilename(syncImgSrc)?.toLowerCase() === "mp4";
  return (
    <div>
      {!isPlaying && (
        <Typography variant="h4" component="h1">
          Today
        </Typography>
      )}

      {showSyncImage && (
        <>
          <ImageList rowHeight="auto" sx={{ maxWidth: "500px" }} cols={1}>
            <ImageListItem>
              {!isVideoSrc ? (
                <img src={syncImgSrc} alt="Sync content" />
              ) : (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  width={width}
                  src={syncImgSrc}
                  aria-label="Sync video content"
                />
              )}
            </ImageListItem>
          </ImageList>
          <Typography variant="body1" sx={{ maxWidth: "500px", mb: 2 }}>
            {syncVerseText}
          </Typography>
        </>
      )}

      {!isPlaying && myList.length > 0 && (
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h5" component="h2" sx={{ pt: 3, mb: 2 }}>
              Continue
            </Typography>
            <HistoryView
              onClick={handleHistoryClick}
              epList={myList}
              lng={lng}
            />
          </Grid>
        </Grid>
      )}
    </div>
  );
};

export default HomeView;
