import React from "react";
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Paper,
  Stack,
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  Stop,
  VolumeUp,
  VolumeOff,
  ExpandMore,
} from "@mui/icons-material";
import useMediaPlayer from "../hooks/useMediaPlayer";

const AudioPlayer = ({
  storyIndex,
  audioUrl,
  storyTitle,
  episodeTimings,
  onMinimize,
}) => {
  const {
    isPlaying,
    isLoaded,
    duration,
    currentPosition,
    currentStoryIndex,
    volume,
    loadAudioFile,
    playAudio,
    pauseAudio,
    stopAudio,
    seekTo,
    setVolume,
  } = useMediaPlayer();

  const [previousVolume, setPreviousVolume] = React.useState(1);

  // Load audio when component mounts or story changes
  React.useEffect(() => {
    if (
      audioUrl &&
      (currentStoryIndex === null || currentStoryIndex !== storyIndex)
    ) {
      loadAudioFile(storyIndex, audioUrl);
    }
  }, [storyIndex, audioUrl, currentStoryIndex, loadAudioFile]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const handleStop = () => {
    stopAudio();
  };

  const handleSeek = (event, newValue) => {
    seekTo(newValue);
  };

  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
  };

  const handleMuteToggle = () => {
    if (volume > 0) {
      setPreviousVolume(volume);
      setVolume(0);
    } else {
      setVolume(previousVolume || 1);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!audioUrl) {
    return null;
  }

  // Create marks for episode boundaries
  const marks = episodeTimings
    ? episodeTimings.map((timing) => ({
        value: parseFloat(timing.pos),
        label: "", // No label for cleaner look
      }))
    : [];

  return (
    <Paper
      elevation={8}
      sx={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        p: { xs: 2, sm: 2.5 },
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        borderTop: "2px solid",
        borderColor: "#0f3460",
        zIndex: 1000,
        backdropFilter: "blur(10px)",
      }}
    >
      <Stack spacing={1.5}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {storyTitle && (
            <Typography
              variant="subtitle1"
              noWrap
              sx={{
                color: "#eee",
                fontWeight: 600,
                letterSpacing: "0.5px",
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                flex: 1,
              }}
            >
              {storyTitle}
            </Typography>
          )}
          {onMinimize && (
            <IconButton
              onClick={onMinimize}
              size="medium"
              sx={{
                color: "#fff",
                bgcolor: "rgba(15, 52, 96, 0.6)",
                ml: 2,
                transition: "all 0.3s ease",
                "&:hover": {
                  bgcolor: "rgba(26, 77, 122, 0.8)",
                  transform: "translateY(2px)",
                },
                border: "2px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
              }}
              aria-label="Minimize audio player"
            >
              <ExpandMore fontSize="medium" />
            </IconButton>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconButton
            onClick={handlePlayPause}
            disabled={!isLoaded}
            sx={{
              bgcolor: isPlaying ? "#e94560" : "#0f3460",
              color: "#fff",
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              transition: "all 0.3s ease",
              "&:hover": {
                bgcolor: isPlaying ? "#d63447" : "#1a4d7a",
                transform: "scale(1.05)",
              },
              "&:disabled": {
                bgcolor: "#2a2a3e",
                color: "#555",
              },
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            {isPlaying ? (
              <Pause sx={{ fontSize: 28 }} />
            ) : (
              <PlayArrow sx={{ fontSize: 28 }} />
            )}
          </IconButton>

          <IconButton
            onClick={handleStop}
            disabled={!isLoaded}
            sx={{
              bgcolor: "#0f3460",
              color: "#fff",
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              transition: "all 0.3s ease",
              "&:hover": {
                bgcolor: "#1a4d7a",
                transform: "scale(1.05)",
              },
              "&:disabled": {
                bgcolor: "#2a2a3e",
                color: "#555",
              },
              boxShadow: "0 3px 8px rgba(0,0,0,0.3)",
            }}
          >
            <Stop sx={{ fontSize: 20 }} />
          </IconButton>

          <Box sx={{ flexGrow: 1, mx: { xs: 1, sm: 2 } }}>
            <Slider
              value={currentPosition || 0}
              max={duration || 100}
              onChange={handleSeek}
              disabled={!isLoaded}
              marks={marks}
              aria-label="Audio position"
              sx={{
                color: "#e94560",
                height: 6,
                "& .MuiSlider-thumb": {
                  width: 16,
                  height: 16,
                  backgroundColor: "#fff",
                  border: "2px solid #e94560",
                  boxShadow: "0 2px 6px rgba(233,69,96,0.5)",
                  "&:hover, &.Mui-focusVisible": {
                    boxShadow: "0 0 0 8px rgba(233,69,96,0.16)",
                  },
                  "&:before": {
                    boxShadow: "0 2px 12px rgba(233,69,96,0.4)",
                  },
                },
                "& .MuiSlider-track": {
                  border: "none",
                  background:
                    "linear-gradient(90deg, #e94560 0%, #ff6b7a 100%)",
                },
                "& .MuiSlider-rail": {
                  opacity: 0.3,
                  backgroundColor: "#4a4a5e",
                },
                "& .MuiSlider-mark": {
                  width: 2,
                  height: 10,
                  backgroundColor: "rgba(255, 255, 255, 0.4)",
                  borderRadius: 1,
                  opacity: 0.6,
                  "&.MuiSlider-markActive": {
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    opacity: 0.8,
                  },
                },
              }}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mt: 0.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "#aaa",
                  fontWeight: 500,
                  fontSize: "0.7rem",
                }}
              >
                {formatTime(currentPosition)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#aaa",
                  fontWeight: 500,
                  fontSize: "0.7rem",
                }}
              >
                {formatTime(duration)}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              minWidth: 140,
              gap: 1,
            }}
          >
            <IconButton
              onClick={handleMuteToggle}
              disabled={!isLoaded}
              size="small"
              sx={{
                color: volume > 0 ? "#6a6a7a" : "#4a4a5a",
                transition: "all 0.2s ease",
                "&:hover": {
                  color: "#8a8a9a",
                  transform: "scale(1.1)",
                },
              }}
            >
              {volume > 0 ? <VolumeUp /> : <VolumeOff />}
            </IconButton>
            <Slider
              value={volume || 0}
              max={1}
              step={0.01}
              onChange={handleVolumeChange}
              disabled={!isLoaded}
              aria-label="Volume"
              sx={{
                color: "#5a5a6a",
                height: 4,
                "& .MuiSlider-thumb": {
                  width: 12,
                  height: 12,
                  backgroundColor: "#6a6a7a",
                  border: "2px solid #5a5a6a",
                  "&:hover, &.Mui-focusVisible": {
                    boxShadow: "0 0 0 6px rgba(90,90,106,0.16)",
                  },
                },
                "& .MuiSlider-track": {
                  border: "none",
                  backgroundColor: "#5a5a6a",
                },
                "& .MuiSlider-rail": {
                  opacity: 0.3,
                  backgroundColor: "#3a3a4a",
                },
              }}
            />
          </Box>
        </Box>

        {!isLoaded && audioUrl && (
          <Typography
            variant="caption"
            sx={{
              color: "#888",
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            Loading audio...
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};

export default AudioPlayer;
