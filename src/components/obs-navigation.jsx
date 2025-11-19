import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Typography,
  Fab,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Box,
  IconButton,
} from "@mui/material";
import {
  ChevronLeft,
  Language,
  PlayArrow,
  ExpandMore,
} from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import { rangeArray, pad } from "../utils/obj-functions";
import { obsHierarchy, obsStoryList } from "../constants/obsHierarchy";
import useBrowserData from "../hooks/useBrowserData";
import useMediaPlayer from "../hooks/useMediaPlayer";
import { obsLangData } from "../constants/obs-langs";
import { langType } from "../constants/lang-info";
import AudioPlayer from "./audio-player";
import MinimizedAudioPlayer from "./minimized-audio-player";

const SerieGridBar = ({ title, subtitle }) => (
  <ImageListItemBar title={title} subtitle={subtitle} />
);

const getTitleFromMd = (md) => {
  let retVal = "";
  if (md?.length > 0) {
    const regExpr = /#[\s|\d|\.]*(.*)\n/;
    const found = md.match(regExpr);
    retVal = found?.[1];
    if (!found) {
      // Now search for a title without number ID string
      const regExpr2 = /#\s*(\S.*)\n/;
      const found2 = md.match(regExpr2);
      retVal = found2?.[1];
      if (!found2) {
        const regExpr3 = /\s*(\S.*)\n/;
        const found3 = md.match(regExpr3);
        retVal = found3?.[1];
        if (!found3) {
          const regExpr4 = /.*(\w.*)\n/;
          const found4 = md.match(regExpr4);
          retVal = found4?.[1] || "";
        }
      }
    }
  }
  return retVal;
};

const Image = (props) => <img {...props} style={{ maxWidth: "100%" }} />;

const OBSNavigation = ({ onExitNavigation }) => {
  const { size, width } = useBrowserData();
  const {
    verseText,
    selectedLanguage,
    updateState,
    structuredStories,
    episodeTimings,
    currentPosition,
    duration,
    isPlaying,
    currentStoryIndex,
    stopAudio,
    isStopped,
    loadAudioFile,
  } = useMediaPlayer();
  const [curLevel, setCurLevel] = useState(1);
  const [level1, setLevel1] = useState(1);
  const [level2, setLevel2] = useState();
  const [curStory, setCurStory] = useState("");
  const [isAudioPlayerVisible, setIsAudioPlayerVisible] = useState(true);
  const [userMinimizedPlayer, setUserMinimizedPlayer] = useState(false);
  const [showEpisodeDescription, setShowEpisodeDescription] = useState(false);

  const handleClick = (ev, id) => {
    if (curLevel === 1) {
      setLevel1(id);
      setCurLevel(2);
    } else if (curLevel === 2) {
      // Check if we're entering a different story than the one currently playing
      const clickedStoryIndex = id - 1; // Convert to 0-based index
      const isDifferentStory =
        currentStoryIndex !== null && currentStoryIndex !== clickedStoryIndex;

      if (isPlaying && isDifferentStory) {
        // Stop playback when entering a different story
        stopAudio();
      }

      // Reset userMinimizedPlayer when navigating to a different story or first story
      if (isDifferentStory || currentStoryIndex === null) {
        setUserMinimizedPlayer(false);
      }

      setLevel2(id);
      setCurLevel(3);
      // Reset isStopped and load audio when entering a new story for languages with full audio
      if (langType[selectedLanguage]?.hasAudio === "full") {
        updateState({ isStopped: false });
        const storyIndex = id - 1; // Convert to 0-based index
        const audioUrl = obsStoryList[storyIndex]?.filename;
        if (audioUrl) {
          loadAudioFile(storyIndex, audioUrl);
        }
      }
    }
    // Note: Level 3+ navigation can be added here if needed
  };

  useEffect(() => {
    if (level2 && verseText) {
      setCurStory(verseText[level2 - 1] || "");
    }
    // Only reset audio player visibility when navigating to a story, unless user minimized it
    if (level2 !== null && currentStoryIndex !== null) {
      const isCurrentStory = level2 - 1 === currentStoryIndex;
      if (isCurrentStory && !userMinimizedPlayer) {
        setIsAudioPlayerVisible(true);
      }
    } else if (level2 !== null && !userMinimizedPlayer) {
      setIsAudioPlayerVisible(true);
    }
  }, [verseText, level2, currentStoryIndex, userMinimizedPlayer]);

  // Calculate which episode to show based on exact timing data
  const currentEpisodeIndex = useMemo(() => {
    const hasFullAudio = langType[selectedLanguage]?.hasAudio === "full";
    if (!hasFullAudio) return 0;

    // Use currentStoryIndex if available (for when audio is playing), otherwise use level2
    const storyIndex =
      currentStoryIndex !== null
        ? currentStoryIndex
        : level2
          ? level2 - 1
          : null;
    if (storyIndex === null) return 0;

    const timingData = episodeTimings[storyIndex];
    if (!timingData || timingData.length === 0) {
      return 0;
    }

    // Find the episode whose start time is closest to but not greater than currentPosition
    let episodeIndex = 0;
    for (let i = 0; i < timingData.length; i++) {
      const episodeStartTime = parseFloat(timingData[i].pos);
      if (currentPosition >= episodeStartTime) {
        episodeIndex = i;
      } else {
        break;
      }
    }

    return episodeIndex;
  }, [
    currentStoryIndex,
    level2,
    currentPosition,
    episodeTimings,
    selectedLanguage,
  ]);

  // Get current episode data
  const currentEpisodeData = useMemo(() => {
    if (!level2) return null;

    const hasFullAudio = langType[selectedLanguage]?.hasAudio === "full";
    if (!hasFullAudio) return null;

    const storyData = structuredStories[level2 - 1];
    if (!storyData || !storyData.episodes || storyData.episodes.length === 0) {
      return null;
    }

    return storyData.episodes[currentEpisodeIndex];
  }, [level2, structuredStories, currentEpisodeIndex, selectedLanguage]);

  const navigateUp = (level) => {
    if (level === 0) {
      onExitNavigation();
    } else {
      setCurLevel(level);
      // Don't stop audio when navigating up
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
      .filter((lKey) => obsLangData[lKey].publishedID === selectedLanguage)
      .map((lKey) =>
        getNameLabel({
          n: obsLangData[lKey].nm,
          en: obsLangData[lKey].eNm,
        }),
      )[0] || "";

  // Get audio URL and title for current story (level 3)
  // level2 is 1-based (story numbers 1-50), obsStoryList is 0-based, so subtract 1
  const currentAudioUrl =
    curLevel === 3 && level2 != null
      ? obsStoryList[level2 - 1]?.filename
      : null;
  const currentStoryTitle =
    curLevel === 3 && level2 != null ? obsStoryList[level2 - 1]?.title : null;

  // Handler for play button - navigates to currently playing story
  const handlePlayButtonClick = () => {
    if (currentStoryIndex !== null) {
      // Navigate to the playing story
      const storyNumber = currentStoryIndex + 1; // Convert to 1-based
      setLevel2(storyNumber);
      setCurLevel(3);
      setIsAudioPlayerVisible(true);
    }
  };

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
          OBS - {nameLabel}
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
      {/* Button to reopen audio player when closed at level 3 */}
      {curLevel === 3 &&
        langType[selectedLanguage]?.hasAudio === "full" &&
        !isAudioPlayerVisible &&
        !isStopped &&
        currentAudioUrl && (
          <MinimizedAudioPlayer
            storyIndex={level2 - 1}
            structuredStories={structuredStories}
            episodeTimings={episodeTimings[level2 - 1]}
            currentEpisodeIndex={currentEpisodeIndex}
            onClick={() => {
              setIsAudioPlayerVisible(true);
              setUserMinimizedPlayer(false);
            }}
          />
        )}
      {/* Minimized player to navigate to currently playing story from higher levels */}
      {curLevel < 3 &&
        currentStoryIndex !== null &&
        !isStopped &&
        langType[selectedLanguage]?.hasAudio === "full" && (
          <MinimizedAudioPlayer
            storyIndex={currentStoryIndex}
            structuredStories={structuredStories}
            episodeTimings={episodeTimings[currentStoryIndex]}
            currentEpisodeIndex={currentEpisodeIndex}
            onClick={handlePlayButtonClick}
          />
        )}
      <Box
        sx={curLevel > 1 ? { pl: "2px", pr: "1px" } : { pl: "4px", pr: "2px" }}
      >
        {curLevel === 3 ? (
          langType[selectedLanguage]?.hasAudio === "full" &&
          currentEpisodeData &&
          isAudioPlayerVisible ? (
            // Display single episode synchronized with audio
            <Box
              sx={{
                mb: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  overflow: "hidden",
                  borderRadius: "8px",
                }}
              >
                <img
                  key={currentEpisodeIndex}
                  src={currentEpisodeData.imageUrl}
                  alt={`Episode ${currentEpisodeIndex + 1}`}
                  style={{
                    maxWidth: "100%",
                    display: "block",
                    animation:
                      currentPosition > 0 && isPlaying
                        ? `kenBurns${(currentEpisodeIndex % 4) + 1} ${
                            duration && episodeTimings[level2 - 1]
                              ? (() => {
                                  const timings = episodeTimings[level2 - 1];
                                  const nextIndex = currentEpisodeIndex + 1;
                                  const currentStart = parseFloat(
                                    timings[currentEpisodeIndex].pos,
                                  );
                                  const nextStart =
                                    nextIndex < timings.length
                                      ? parseFloat(timings[nextIndex].pos)
                                      : duration;
                                  return nextStart - currentStart;
                                })()
                              : 10
                          }s linear forwards`
                        : "none",
                  }}
                />
                <style>
                  {`
                    @keyframes kenBurns1 {
                      0% { transform: scale(1) translate(0, 0); }
                      100% { transform: scale(1.15) translate(-3%, -2%); }
                    }
                    @keyframes kenBurns2 {
                      0% { transform: scale(1) translate(0, 0); }
                      100% { transform: scale(1.12) translate(2%, -3%); }
                    }
                    @keyframes kenBurns3 {
                      0% { transform: scale(1) translate(0, 0); }
                      100% { transform: scale(1.18) translate(-2%, 2%); }
                    }
                    @keyframes kenBurns4 {
                      0% { transform: scale(1) translate(0, 0); }
                      100% { transform: scale(1.14) translate(3%, 1%); }
                    }
                  `}
                </style>
              </Box>

              <IconButton
                onClick={() =>
                  setShowEpisodeDescription(!showEpisodeDescription)
                }
                sx={{
                  mt: 0.5,
                  p: 0.5,
                  bgcolor: "#444 !important",
                  border: "2px solid rgba(30, 30, 30, 0.95)",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                  "&:hover": {
                    bgcolor: "#555 !important",
                    borderColor: "rgba(80, 80, 80, 0.95)",
                    transform: "scale(1.05)",
                    boxShadow: "0 3px 12px rgba(0,0,0,0.6)",
                  },
                }}
                aria-label={
                  showEpisodeDescription
                    ? "Hide description"
                    : "Show description"
                }
              >
                <ExpandMore
                  sx={{
                    fontSize: 20,
                    color: "#eee",
                    fill: "#000",
                    transition: "all 0.3s ease",
                    transform: showEpisodeDescription
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                  }}
                />
              </IconButton>

              <Box
                sx={{
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  maxHeight: showEpisodeDescription ? "600px" : "0",
                  opacity: showEpisodeDescription ? 1 : 0,
                  mt: showEpisodeDescription ? 0.5 : 0,
                  width: "100%",
                }}
              >
                <ReactMarkdown
                  children={currentEpisodeData.text}
                  components={{
                    img: ({ node, ...props }) => (
                      <img style={{ maxWidth: "100%" }} {...props} />
                    ),
                  }}
                />
              </Box>

              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 2,
                  textAlign: "center",
                  color: "text.secondary",
                }}
              >
                Episode {currentEpisodeIndex + 1} of{" "}
                {structuredStories[level2 - 1]?.episodes?.length || 0}
              </Typography>
            </Box>
          ) : (
            // Display full story markdown (fallback, when no audio, or when player is closed)
            <ReactMarkdown
              children={curStory}
              components={{
                img: ({ node, ...props }) => (
                  <img style={{ maxWidth: "100%" }} {...props} />
                ),
              }}
            />
          )
        ) : (
          <ImageList rowHeight={rowHeight} cols={useCols}>
            {validIconList.map((iconObj) => {
              const { key, imgSrc, title, subtitle } = iconObj;
              return (
                <ImageListItem
                  onClick={(ev) => handleClick(ev, key)}
                  key={key}
                  sx={{ cursor: "pointer" }}
                >
                  <img
                    src={imgSrc}
                    alt={title}
                    loading="lazy"
                    sx={{ maxWidth: 1 }}
                  />
                  <SerieGridBar title={title} subtitle={subtitle} />
                </ImageListItem>
              );
            })}
          </ImageList>
        )}
      </Box>
      {/* Audio player for story playback */}
      {curLevel === 3 &&
        currentAudioUrl &&
        langType[selectedLanguage]?.hasAudio === "full" &&
        isAudioPlayerVisible && (
          <AudioPlayer
            storyIndex={level2 - 1}
            audioUrl={currentAudioUrl}
            storyTitle={currentStoryTitle}
            episodeTimings={episodeTimings[level2 - 1]}
            onMinimize={() => {
              setIsAudioPlayerVisible(false);
              setUserMinimizedPlayer(true);
            }}
          />
        )}
    </div>
  );
};

export default OBSNavigation;
