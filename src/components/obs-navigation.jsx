import React, { useState, useEffect } from "react";
import {
  Typography,
  Fab,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Box,
} from "@mui/material";
import { ChevronLeft, Language } from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import { rangeArray, pad } from "../utils/obj-functions";
import { obsHierarchy } from "../constants/obsHierarchy";
import useBrowserData from "../hooks/useBrowserData";
import useMediaPlayer from "../hooks/useMediaPlayer";
import { obsLangData } from "../constants/obs-langs";

const SerieGridBar = ({ title, subtitle }) => (
  <ImageListItemBar title={title} subtitle={subtitle} />
);

const getTitleFromMd = (md) => {
  let retVal = "";
  if (md?.length) {
    const regExpr = /# .*\.\s*(\S.*)\n/;
    const found = md.match(regExpr);
    retVal = found?.[1]
    if (!found) { // Now search for a title without number ID string
      const regExpr2 = /#\s*(\S.*)\n/;
      const found2 = md.match(regExpr2);
      retVal = found2?.[1]  
    }
  }
  return retVal;
};

const OBSNavigation = ({ onExitNavigation }) => {
  const { size, width } = useBrowserData();
  const { verseText, selectedLanguage } = useMediaPlayer();
  const [curLevel, setCurLevel] = useState(1);
  const [level1, setLevel1] = useState(1);
  const [level2, setLevel2] = useState();
  const [curStory, setCurStory] = useState("");

  const handleClick = (ev, id) => {
    if (curLevel === 1) {
      setLevel1(id);
      setCurLevel(2);
    } else if (curLevel === 2) {
      setLevel2(id);
      setCurLevel(3);
    }
    // Note: Level 3+ navigation can be added here if needed
  };

  useEffect(() => {
    if (level2 && verseText) {
      setCurStory(verseText[level2 - 1] || "");
    }
  }, [verseText, level2]);

  const navigateUp = (level) => {
    if (level === 0) {
      onExitNavigation();
    } else {
      setCurLevel(level);
    }
  };

  const handleReturn = () => {
    if (curLevel > 2) {
      navigateUp(2);
    } else if (curLevel > 1) {
      navigateUp(curLevel - 1);
    } else {
      onExitNavigation();
    }
  };

  const validIconList = [];

  if (curLevel === 1) {
    obsHierarchy.forEach((obj, iconInx) => {
      validIconList.push({
        key: iconInx,
        imgSrc: `/navIcons/${obj.img}`,
        title: obj.title,
        isBookIcon: false,
      });
    });
  } else if (curLevel === 2) {
    const curObj = obsHierarchy[level1];
    const beg = curObj.beg;
    const end = beg + curObj.count - 1;
    rangeArray(beg, end).forEach((inx) => {
      const checkMd = verseText?.[inx - 1] || "";
      const title = getTitleFromMd(checkMd);
      validIconList.push({
        key: inx,
        imgSrc: `/obsIcons/obs-en-${pad(inx)}-01.jpg`,
        title,
        isBookIcon: false,
      });
    });
  }

  const rootLevel = curLevel === 1;

  const getGridConfig = () => {
    if (curLevel === 3) return { cols: 1, rowHeight: width / 1.77 };

    const configs = {
      xs: rootLevel
        ? { cols: 2, rowHeight: width / 2 }
        : { cols: 1, rowHeight: width / 1.77 },
      sm: rootLevel
        ? { cols: 3, rowHeight: width / 3 }
        : { cols: 2, rowHeight: width / 3.55 },
      md: rootLevel
        ? { cols: 4, rowHeight: width / 4 }
        : { cols: 2, rowHeight: width / 3.55 },
      lg: rootLevel
        ? { cols: 4, rowHeight: width / 4 }
        : { cols: 2, rowHeight: width / 3.55 },
      xl: rootLevel
        ? { cols: 5, rowHeight: width / 5 }
        : { cols: 3, rowHeight: width / 5.33 },
    };

    return configs[size] || { cols: 3, rowHeight: undefined };
  };

  const { cols: useCols, rowHeight } = getGridConfig();

  const getNameLabel = (nameObj) => {
    if (nameObj?.en && nameObj?.en === nameObj?.n) return nameObj?.n;
    if (nameObj?.n && nameObj?.en) return `${nameObj?.n} - ${nameObj?.en}`;
    return nameObj?.n || nameObj?.en || "";
  };

  const nameLabel =
    Object.keys(obsLangData)
      .filter((lKey) =>  obsLangData[lKey].publishedID === selectedLanguage)
      .map((lKey) =>
        getNameLabel({
          n: obsLangData[lKey].nm,
          en: obsLangData[lKey].eNm,
        }),
      )[0] || "";
  return (
    <div>
      {curLevel > 1 ? (
        <Typography variant="h6" sx={{ pl: 2, mb: 2 }}>
          <Fab onClick={handleReturn} color="primary" size="small">
            <ChevronLeft />
          </Fab>
        </Typography>
      ) : (
        <Typography variant="h6" sx={{ pl: 2, mb: 2 }}>
          OBS Navigation - {nameLabel}
          <Fab
            onClick={handleReturn}
            color="primary"
            size="small"
            sx={{ ml: 2 }}
          >
            <Language />
          </Fab>
        </Typography>
      )}

      <ImageList rowHeight={rowHeight} cols={useCols}>
        {validIconList.map((iconObj) => {
          const { key, imgSrc, title, subtitle } = iconObj;
          return (
            <ImageListItem
              onClick={(ev) => handleClick(ev, key)}
              key={key}
              sx={{ cursor: "pointer" }}
            >
              <img src={imgSrc} alt={title} loading="lazy" />
              <SerieGridBar title={title} subtitle={subtitle} />
            </ImageListItem>
          );
        })}
      </ImageList>

      {curLevel === 3 && (
        <Box sx={{ padding: 3 }}>
          <ReactMarkdown>{curStory}</ReactMarkdown>
        </Box>
      )}
    </div>
  );
};

export default OBSNavigation;
