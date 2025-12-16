import React, { useState, useEffect, useCallback, useRef } from "react";
import { Howl } from "howler";
import JSZip from "jszip";
import { apiSetStorage, apiGetStorage } from "../utils/api";
import { pad } from "../utils/obj-functions";
import { langType } from "../constants/lang-info";

const MediaPlayerContext = React.createContext([{}, () => {}]);

const MediaPlayerProvider = ({ children }) => {
  const [state, setState] = useState({
    isPlaying: false,
    selectedLanguage: null,
    selectedRegion: "Open Bible Stories", // Default region
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
    availableLanguages: [], // Languages extracted from ALL.zip
    languageData: {}, // Full language data with ot/nt categories and bible-data.json
    languageNames: {}, // Language names (n=English, v=vernacular) from summary.json
    isLoadingZip: false,
    zipLoadError: null,
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

  // Load and extract language list and data from ALL.zip
  const loadAllZip = useCallback(async () => {
    updateState({ isLoadingZip: true, zipLoadError: null });

    try {
      const response = await fetch("/ALL.zip");
      if (!response.ok) {
        throw new Error(`Failed to load ALL.zip: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(arrayBuffer);

      // Extract summary.json
      const summaryFile = zipContent.file("summary.json");
      if (!summaryFile) {
        throw new Error("summary.json not found in ALL.zip");
      }

      const summaryText = await summaryFile.async("text");
      const summaryData = JSON.parse(summaryText);

      // Extract language list from nested structure
      // Structure: canons -> nt/ot -> category -> langCode
      const languages = new Set();

      if (summaryData.canons) {
        // Check both nt and ot
        ["nt", "ot"].forEach((testament) => {
          if (summaryData.canons[testament]) {
            const testamentData = summaryData.canons[testament];
            // Iterate through categories
            Object.keys(testamentData).forEach((category) => {
              if (typeof testamentData[category] === "object") {
                // Get all language codes in this category
                Object.keys(testamentData[category]).forEach((langCode) => {
                  languages.add(langCode);
                });
              }
            });
          }
        });
      }

      const languagesArray = Array.from(languages);

      // Extract language names from summary.json structure
      const languageNames = {};
      if (summaryData.canons) {
        ["nt", "ot"].forEach((testament) => {
          if (summaryData.canons[testament]) {
            const testamentData = summaryData.canons[testament];
            Object.keys(testamentData).forEach((category) => {
              if (typeof testamentData[category] === "object") {
                Object.keys(testamentData[category]).forEach((langCode) => {
                  const langInfo = testamentData[category][langCode];
                  if (langInfo && langInfo.n && langInfo.v) {
                    // Store the first occurrence (priority: with-timecode first)
                    if (!languageNames[langCode]) {
                      languageNames[langCode] = {
                        english: langInfo.n,
                        vernacular: langInfo.v,
                      };
                    }
                  }
                });
              }
            });
          }
        });
      }

      // Build languageData structure
      const languageData = {};
      const categories = [
        "with-timecode",
        "syncable",
        "audio-only",
        "text-only",
      ];
      const testaments = ["ot", "nt"];

      // Iterate through all languages
      for (const langCode of languagesArray) {
        languageData[langCode] = {};

        // For each testament (ot/nt)
        for (const testament of testaments) {
          // Check categories in priority order
          for (const category of categories) {
            // Pattern: [ot or nt]/[category]/[iso lang code]/[distinct ID]/bible-data.json
            const pathPrefix = `${testament}/${category}/${langCode}/`;

            // Find all files matching this pattern
            const matchingFiles = [];
            zipContent.forEach((relativePath, file) => {
              if (
                relativePath.startsWith(pathPrefix) &&
                relativePath.endsWith("/bible-data.json")
              ) {
                matchingFiles.push(relativePath);
              }
            });

            // Use the first matching file found
            if (matchingFiles.length > 0) {
              const filePath = matchingFiles[0];
              // Extract distinct ID from path
              const pathParts = filePath.split("/");
              const distinctId = pathParts[3]; // [testament]/[category]/[langCode]/[distinctId]/bible-data.json

              try {
                const fileContent = await zipContent
                  .file(filePath)
                  .async("text");
                const data = JSON.parse(fileContent);

                languageData[langCode][testament] = {
                  category: category,
                  distinctId: distinctId,
                  data: data,
                };

                // Found for this testament, break category loop
                break;
              } catch (parseError) {
                console.error(`Failed to parse ${filePath}:`, parseError);
              }
            }
          }
        }

        // Clean up if no data found for this language
        if (Object.keys(languageData[langCode]).length === 0) {
          delete languageData[langCode];
        }
      }

      updateState({
        availableLanguages: languagesArray,
        languageData: languageData,
        languageNames: languageNames,
        isLoadingZip: false,
        zipLoadError: null,
      });

      return {
        languages: languagesArray,
        languageData,
        languageNames,
        zipContent,
      };
    } catch (error) {
      console.error("Failed to load ALL.zip:", error);
      updateState({
        isLoadingZip: false,
        zipLoadError: error.message,
      });
      throw error;
    }
  }, []);

  // Get file from zip by path
  const getFileFromZip = useCallback(async (zipContent, filePath) => {
    try {
      const file = zipContent.file(filePath);
      if (!file) {
        throw new Error(`File not found in zip: ${filePath}`);
      }
      return await file.async("text");
    } catch (error) {
      console.error(`Failed to extract file ${filePath}:`, error);
      throw error;
    }
  }, []);

  // Get language list from zip
  const getLanguagesFromZip = useCallback(async () => {
    try {
      const { languages } = await loadAllZip();
      return languages;
    } catch (error) {
      console.error("Failed to get languages from zip:", error);
      return [];
    }
  }, [loadAllZip]);

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

  // Load language URL when selected language changes (only for OBS)
  useEffect(() => {
    const loadLanguageUrl = async () => {
      const lang = state.selectedLanguage;
      if (!lang) return;

      // Only load OBS content if "Open Bible Stories" region is selected
      if (state.selectedRegion !== "Open Bible Stories") {
        return;
      }

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
  }, [state.selectedLanguage, state.selectedRegion]);

  // Load story texts when language URL is available (only for OBS)
  useEffect(() => {
    const loadAllStoryTexts = async () => {
      const maxStories = 50;
      for (let i = 0; i < maxStories; i++) {
        await fetchStoryText(state.langUrl, i, state.selectedLanguage);
      }
    };

    if (
      state.langUrl &&
      state.langUrl.length > 0 &&
      state.selectedLanguage &&
      state.selectedRegion === "Open Bible Stories"
    ) {
      console.log("newLangUrl " + state.langUrl);
      loadAllStoryTexts();
    }
  }, [
    state.langUrl,
    state.selectedLanguage,
    state.selectedRegion,
    fetchStoryText,
  ]);

  // Initialize stored data on mount
  useEffect(() => {
    const initializeStoredData = async () => {
      try {
        const [selectedLanguage, langIsSelected, selectedRegion] =
          await Promise.all([
            apiGetStorage("selectedLanguage"),
            apiGetStorage("langIsSelected"),
            apiGetStorage("selectedRegion"),
          ]);
        updateState({
          selectedLanguage: selectedLanguage,
          langIsSelected: langIsSelected || false,
          selectedRegion: selectedRegion || "Open Bible Stories",
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

  const setSelectedRegion = async (newRegion) => {
    try {
      await apiSetStorage("selectedRegion", newRegion);
      updateState({ selectedRegion: newRegion });
    } catch (error) {
      console.error("Failed to save selected region:", error);
    }
  };

  const value = {
    state,
    actions: {
      togglePlay,
      setSelectedLanguage,
      setSelectedRegion,
      updateState,
      loadAudioFile,
      playAudio,
      pauseAudio,
      stopAudio,
      seekTo,
      setVolume,
      loadAllZip,
      getFileFromZip,
      getLanguagesFromZip,
    },
  };

  return (
    <MediaPlayerContext.Provider value={value}>
      {children}
    </MediaPlayerContext.Provider>
  );
};

export { MediaPlayerContext, MediaPlayerProvider };
