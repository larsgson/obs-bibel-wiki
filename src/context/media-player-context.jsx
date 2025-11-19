import React, { useState, useEffect, useCallback, useRef } from "react";
import { Howl } from "howler";
import { apiSetStorage, apiGetStorage } from "../utils/api";
import { pad } from "../utils/obj-functions";
import { langType } from "../constants/lang-info";

const MediaPlayerContext = React.createContext([{}, () => {}]);

const MediaPlayerProvider = ({ children }) => {
  const [state, setState] = useState({
    isPlaying: false,
    selectedLanguage: null,
    navHist: null,
    imgPosOBS: {},
    verseText: {},
    structuredStories: {}, // New: structured episodes for audio playback
    episodeTimings: {}, // New: exact timing data for each episode
    langUrl: null,
    currentStoryIndex: null,
    duration: 0,
    currentPosition: 0,
    isLoaded: false,
    volume: 1,
    isStopped: false, // Track when audio has been stopped or ended
  });
  const [localVerseText, setLocalVerseText] = React.useState({});
  const [localStructuredStories, setLocalStructuredStories] = React.useState(
    {},
  );
  const [localEpisodeTimings, setLocalEpisodeTimings] = React.useState({});

  // Refs for Howler audio player
  const soundRef = useRef(null);
  const positionIntervalRef = useRef(null);

  const updateState = (updates) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  };

  const parseMarkdownIntoEpisodes = useCallback((markdown) => {
    // Parse markdown to extract episodes (image + text pairs)
    const episodes = [];
    const lines = markdown.split("\n");
    let currentEpisode = null;
    let storyTitle = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Extract story title (H1)
      if (line.startsWith("# ") && !storyTitle) {
        storyTitle = line.substring(2).trim();
        continue;
      }

      // Check if line contains an image
      const imageMatch = line.match(/!\[.*?\]\((.*?)\)/);
      if (imageMatch) {
        // Save previous episode if exists
        if (currentEpisode && currentEpisode.text.trim()) {
          episodes.push(currentEpisode);
        }

        // Start new episode
        currentEpisode = {
          imageUrl: imageMatch[1],
          text: "",
        };
      } else if (currentEpisode && line) {
        // Add text to current episode
        currentEpisode.text += (currentEpisode.text ? "\n" : "") + line;
      }
    }

    // Add last episode
    if (currentEpisode && currentEpisode.text.trim()) {
      episodes.push(currentEpisode);
    }

    return {
      title: storyTitle,
      episodes: episodes,
    };
  }, []);

  const fetchStoryText = useCallback(
    async (url, index, selectedLanguage) => {
      try {
        const response = await fetch(
          `${url}/raw/branch/master/content/${pad(index + 1)}.md`,
        );
        const data = await response.text();
        setLocalVerseText((prev) => ({
          ...prev,
          [index]: data,
        }));

        // If language has full audio support, also parse into structured episodes
        if (langType[selectedLanguage]?.hasAudio === "full") {
          const structured = parseMarkdownIntoEpisodes(data);
          setLocalStructuredStories((prev) => ({
            ...prev,
            [index]: structured,
          }));

          // Load episode timing data from JSON file
          try {
            const timingResponse = await fetch(
              `/data/img_pos${pad(index + 1)}.json`,
            );
            if (timingResponse.ok) {
              const timingData = await timingResponse.json();
              setLocalEpisodeTimings((prev) => ({
                ...prev,
                [index]: timingData,
              }));
            } else {
              console.warn(`No timing data found for story ${index + 1}`);
            }
          } catch (timingError) {
            console.error(
              `Failed to load timing data for story ${index + 1}:`,
              timingError,
            );
          }
        }
      } catch (error) {
        console.error(`Failed to fetch story text for index ${index}:`, error);
      }
    },
    [parseMarkdownIntoEpisodes],
  );

  useEffect(() => {
    // Export the value of localVerseText as state.verseText
    updateState({ verseText: { ...localVerseText } });
  }, [localVerseText]);

  useEffect(() => {
    // Export structured stories to state
    updateState({ structuredStories: { ...localStructuredStories } });
  }, [localStructuredStories]);

  useEffect(() => {
    // Export episode timings to state
    updateState({ episodeTimings: { ...localEpisodeTimings } });
  }, [localEpisodeTimings]);

  // Load language URL when selected language changes
  useEffect(() => {
    const loadLanguageUrl = async () => {
      const lang = state.selectedLanguage;
      if (!lang) return;

      const params = new URLSearchParams({
        subject: "Open Bible Stories",
        stage: "prod",
        lang,
      });

      try {
        const response = await fetch(
          `https://git.door43.org/api/v1/catalog/search?${params}`,
        );
        if (!response.ok) {
          throw new Error(`Failed to search collections: ${response.status}`);
        }

        const result = await response.json();
        const url = result?.data[0]?.repo?.html_url;
        updateState({ langUrl: url });
      } catch (error) {
        console.error("Failed to fetch language URL:", error);
      }
    };

    if (state.selectedLanguage) {
      loadLanguageUrl();
    }
  }, [state.selectedLanguage]);

  // Load story texts when language URL is available
  useEffect(() => {
    const loadAllStoryTexts = async () => {
      const maxStories = 50;
      for (let i = 0; i < maxStories; i++) {
        await fetchStoryText(state.langUrl, i, state.selectedLanguage);
      }
    };

    if (state.langUrl && state.langUrl.length > 0 && state.selectedLanguage) {
      console.log("newLangUrl " + state.langUrl);
      loadAllStoryTexts();
    }
  }, [state.langUrl, state.selectedLanguage, fetchStoryText]);

  // Initialize stored data on mount
  useEffect(() => {
    const initializeStoredData = async () => {
      try {
        const [selectedLanguage, langIsSelected] = await Promise.all([
          apiGetStorage("selectedLanguage"),
          apiGetStorage("langIsSelected"),
        ]);
        updateState({
          selectedLanguage: selectedLanguage,
          langIsSelected: langIsSelected || false,
        });
      } catch (error) {
        console.error("Failed to load stored data:", error);
      }
    };

    initializeStoredData();
  }, []);

  // Update playback position during playback
  useEffect(() => {
    if (state.isPlaying && soundRef.current) {
      positionIntervalRef.current = setInterval(() => {
        if (soundRef.current && soundRef.current.playing()) {
          updateState({ currentPosition: soundRef.current.seek() });
        }
      }, 100);
    } else {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    }

    return () => {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    };
  }, [state.isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
      if (soundRef.current) {
        soundRef.current.unload();
      }
    };
  }, []);

  // Load audio file for a specific story
  const loadAudioFile = useCallback(
    (storyIndex, audioUrl) => {
      if (soundRef.current) {
        soundRef.current.unload();
      }

      soundRef.current = new Howl({
        src: [audioUrl],
        html5: true,
        preload: true,
        volume: state.volume,
        onload: () => {
          updateState({
            isLoaded: true,
            duration: soundRef.current.duration(),
            currentPosition: 0,
            currentStoryIndex: storyIndex,
            isStopped: false,
          });
        },
        onloaderror: (id, error) => {
          console.error(`Error loading audio file:`, error);
          updateState({ isLoaded: false, isPlaying: false });
        },
        onplay: () => {
          updateState({ isPlaying: true });
        },
        onend: () => {
          updateState({
            isPlaying: false,
            currentPosition: 0,
            isStopped: true,
          });
        },
        onstop: () => {
          updateState({ isPlaying: false, isStopped: true });
        },
        onpause: () => {
          updateState({ isPlaying: false });
        },
      });
    },
    [state.volume],
  );

  // Play audio
  const playAudio = useCallback(() => {
    if (soundRef.current && state.isLoaded) {
      soundRef.current.play();
      updateState({ isPlaying: true, isStopped: false });
    }
  }, [state.isLoaded]);

  // Pause audio
  const pauseAudio = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.pause();
      updateState({ isPlaying: false });
    }
  }, []);

  // Stop audio
  const stopAudio = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.stop();
      updateState({ isPlaying: false, currentPosition: 0 });
    }
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }, [state.isPlaying, playAudio, pauseAudio]);

  // Seek to position
  const seekTo = useCallback(
    (position) => {
      if (soundRef.current && state.isLoaded) {
        soundRef.current.seek(position);
        updateState({ currentPosition: position });
      }
    },
    [state.isLoaded],
  );

  // Set volume
  const setVolume = useCallback((volume) => {
    if (soundRef.current) {
      soundRef.current.volume(volume);
    }
    updateState({ volume });
  }, []);

  const setSelectedLanguage = async (newLanguage) => {
    try {
      await apiSetStorage("selectedLanguage", newLanguage);
      updateState({ selectedLanguage: newLanguage });
      await apiSetStorage("langIsSelected", true);
      updateState({ langIsSelected: true });
    } catch (error) {
      console.error("Failed to save selected language:", error);
    }
  };

  const value = {
    state,
    actions: {
      togglePlay,
      setSelectedLanguage,
      updateState,
      loadAudioFile,
      playAudio,
      pauseAudio,
      stopAudio,
      seekTo,
      setVolume,
    },
  };

  return (
    <MediaPlayerContext.Provider value={value}>
      {children}
    </MediaPlayerContext.Provider>
  );
};

export { MediaPlayerContext, MediaPlayerProvider };
