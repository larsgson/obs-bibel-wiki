import React, { useMemo } from "react";
import { Box, IconButton } from "@mui/material";
import { PlayArrow, Pause } from "@mui/icons-material";
import useMediaPlayer from "../hooks/useMediaPlayer";

const MinimizedAudioPlayer = ({
  storyIndex,
  structuredStories,
  episodeTimings,
  currentEpisodeIndex,
  onClick,
}) => {
  const { isPlaying, playAudio, pauseAudio } = useMediaPlayer();

  // Get current episode data
  const currentEpisodeData = useMemo(() => {
    if (storyIndex === null || storyIndex === undefined) return null;

    const storyData = structuredStories[storyIndex];
    if (!storyData || !storyData.episodes || storyData.episodes.length === 0) {
      return null;
    }

    const episodeIndex =
      currentEpisodeIndex >= 0 &&
      currentEpisodeIndex < storyData.episodes.length
        ? currentEpisodeIndex
        : 0;

    return storyData.episodes[episodeIndex];
  }, [storyIndex, structuredStories, currentEpisodeIndex]);

  const handlePlayPause = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const handleContainerClick = (e) => {
    // Only navigate/expand if the click was directly on the container or image, not the button
    const isButton = e.target.closest("button");
    if (isButton) {
      return;
    }
    onClick();
  };

  if (!currentEpisodeData) {
    return null;
  }

  return (
    <Box
      onClick={handleContainerClick}
      sx={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 999,
        width: { xs: 200, sm: 240 },
        height: { xs: 130, sm: 150 },
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "scale(1.02)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
        },
      }}
    >
      {/* Episode Image as Background */}
      <Box
        component="img"
        src={currentEpisodeData.imageUrl}
        alt="Current episode"
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />

      {/* Play/Pause Button Overlay */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          background:
            "radial-gradient(circle, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 70%, transparent 100%)",
          pb: 0.5,
          pr: 0.5,
        }}
      >
        <IconButton
          onClick={handlePlayPause}
          sx={{
            bgcolor: "rgba(15, 52, 96, 0.85)",
            color: "#fff",
            width: { xs: 38, sm: 45 },
            height: { xs: 38, sm: 45 },
            transition: "all 0.3s ease",
            "&:hover": {
              bgcolor: "rgba(26, 77, 122, 0.95)",
              transform: "scale(1.1)",
            },
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          {isPlaying ? (
            <Pause sx={{ fontSize: { xs: 22, sm: 26 } }} />
          ) : (
            <PlayArrow sx={{ fontSize: { xs: 22, sm: 26 } }} />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

export default MinimizedAudioPlayer;
