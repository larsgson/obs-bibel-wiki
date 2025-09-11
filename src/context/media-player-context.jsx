import React, { useState, useEffect, useCallback } from "react";
import { apiSetStorage, apiGetStorage } from "../utils/api";
import { pad } from "../utils/obj-functions";
import { obsLangData } from "../constants/obs-langs";

const MediaPlayerContext = React.createContext([{}, () => {}]);

const MediaPlayerProvider = ({ children }) => {
  const [state, setState] = useState({
    isPlaying: false,
    selectedLanguage: "en",
    navHist: null,
    imgPosOBS: {},
    verseText: {},
    langUrl: null,
  });
  const [localVerseText,setLocalVerseText] = React.useState({})

  const updateState = (updates) => {
    // ToDo: Fix the updates of verseText to happen one level lower
    setState((prevState) => ({ ...prevState, ...updates }));
  };

  // const fetchImagePositions = useCallback(
  //   async (index) => {
  //     try {
  //       const response = await fetch(`data/img_pos${pad(index + 1)}.json`);
  //       const data = await response.json();
  //       updateState({
  //         imgPosOBS: {
  //           ...state.imgPosOBS,
  //           [index]: data,
  //         },
  //       });
  //     } catch (error) {
  //       console.error(
  //         `Failed to fetch image positions for story ${index + 1}:`,
  //         error,
  //       );
  //     }
  //   },
  //   [],
  // );

  const fetchStoryText = useCallback(
    async (url, index) => {
      try {
        const response = await fetch(
          `${url}/raw/branch/master/content/${pad(index + 1)}.md`,
        );
        const data = await response.text();
        setLocalVerseText((prev) => ({
          ...prev,
          [index]: data,
        }))
      } catch (error) {
        console.error(`Failed to fetch story text for index ${index}:`, error);
      }
    },
    [],
  );

  useEffect(() => { // Export the value of localVerseText as state.verseText
    updateState({verseText: {...localVerseText}})
  },[localVerseText]);

  // Load language URL when selected language changes
  useEffect(() => {
    const loadLanguageUrl = async () => {
      const lang = obsLangData[state.selectedLanguage]?.publishedID;
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
        await fetchStoryText(state.langUrl, i);
      }
    };

    if ((state.langUrl) && (state.langUrl.length>0)) {
      console.log("newLangUrl "+state.langUrl)
      loadAllStoryTexts();
    }
  }, [state.langUrl]);

  // Load image positions for English stories
  // useEffect(() => {
  //   const loadAllImagePositions = async () => {
  //     // const maxStories = 50
  //     const maxStories = 2
  //     for (let i = 0; i < maxStories; i++) {
  //       await fetchImagePositions(i);
  //     }
  //   };

  //   if (state.selectedLanguage === "en") {
  //     loadAllImagePositions();
  //   }
  // }, [state.selectedLanguage, fetchImagePositions]);

  // Initialize stored data on mount
  useEffect(() => {
    const initializeStoredData = async () => {
      try {
        const [selectedLanguage, navHist] = await Promise.all([
          apiGetStorage("selectedLanguage"),
          apiGetStorage("navHist"),
        ]);

        updateState({
          selectedLanguage: selectedLanguage || "en",
          navHist: navHist || null,
        });
      } catch (error) {
        console.error("Failed to load stored data:", error);
      }
    };

    initializeStoredData();
  }, []);

  const togglePlay = () => {
    updateState({ isPlaying: !state.isPlaying });
  };

  const setSelectedLanguage = async (newLanguage) => {
    try {
      await apiSetStorage("selectedLanguage", newLanguage);
      updateState({ selectedLanguage: newLanguage });
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
    },
  };

  return (
    <MediaPlayerContext.Provider value={value}>
      {children}
    </MediaPlayerContext.Provider>
  );
};

export { MediaPlayerContext, MediaPlayerProvider };
