import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Typography,
  TextField,
  Autocomplete,
  ImageList,
  ImageListItem,
  CssBaseline,
  Toolbar,
  Paper,
  Divider,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import SimpleAppBar from "./simple-app-bar";
import { obsLangData, obsOldFormat } from "../constants/obs-langs";
import useBrowserData from "../hooks/useBrowserData";
import useMediaPlayer from "../hooks/useMediaPlayer";
import regionsData from "../constants/regions.json";

const capitalizeFirstLetter = (str = "") =>
  str.charAt(0).toUpperCase() + str.slice(1);

const getNameLabel = (nameObj) => {
  if (nameObj?.en && nameObj?.en === nameObj?.n) return nameObj?.n;
  if (nameObj?.n && nameObj?.en) return `${nameObj?.n} - ${nameObj?.en}`;
  return nameObj?.n || nameObj?.en || "";
};

const removeDash = (str) => str.replace(/-/gi, "");

export default function SettingsView({ onLangClick }) {
  const { i18n } = useTranslation();
  const { size } = useBrowserData();
  const mediaPlayer = useMediaPlayer();
  const { loadAllZip, setSelectedLanguage, setSelectedRegion } = mediaPlayer;
  const selectedLanguage = mediaPlayer.selectedLanguage;
  const selectedRegionFromContext = mediaPlayer.selectedRegion;
  const mediaState = {
    availableLanguages: mediaPlayer.availableLanguages,
    languageData: mediaPlayer.languageData,
    languageNames: mediaPlayer.languageNames,
  };

  // Helper function to get language names from ZIP data
  const getLanguageNames = (langCode) => {
    const names = mediaState.languageNames?.[langCode];
    if (!names) return null;
    return names;
  };

  // Helper function to get language category from ZIP data
  const getLanguageCategory = (langCode) => {
    const langData = mediaState.languageData?.[langCode];
    if (!langData) return null;

    // Check NT first, then OT
    const testament = langData.nt || langData.ot;
    if (!testament?.category) return null;

    return testament.category;
  };

  // Get color based on category
  const getCategoryColor = (category) => {
    const colors = {
      "with-timecode": "#020054", // Same blue as currently
      syncable: "#87CEEB", // Light blue
      "audio-only": "#FFB347", // Light orange
      "text-only": "#D3D3D3", // Light grey
      "incomplete-timecode": "#FF6B6B", // Light red
    };
    return colors[category] || "#020054"; // Default to dark blue
  };
  const defaultLang = "en";
  const [activeLang, setActiveLang] = useState(defaultLang);
  const [selectedLocLang, setSelectedLocLang] = useState({
    value: defaultLang,
    label: "English",
    orgId: "en",
  });
  const [selectedRegion, setSelectedRegionLocal] = useState({
    label: "Open Bible Stories",
    value: "Open Bible Stories",
    category: "Default",
  });

  // Load ALL.zip on mount
  useEffect(() => {
    const initZip = async () => {
      try {
        await loadAllZip();
      } catch (error) {
        console.error("Failed to load ALL.zip:", error);
      }
    };
    initZip();
  }, [loadAllZip]);

  const availableLangOptions = useMemo(() => {
    return Object.keys(obsLangData).map((lKey) => {
      const nameLabel = getNameLabel({
        n: obsLangData[lKey].nm,
        en: obsLangData[lKey].eNm,
      });
      return {
        value: removeDash(lKey),
        label: nameLabel || obsLangData[lKey].nm || obsLangData[lKey].eNm,
        orgId: obsLangData[lKey].publishedID,
      };
    });
  }, []);

  const regionOptions = useMemo(() => {
    const options = [];

    // Add default option
    options.push({
      label: "Open Bible Stories",
      value: "Open Bible Stories",
      category: "Default",
      langCodes: null, // null means show all OBS languages
    });

    // Add bridge languages
    if (regionsData.bridgeLanguages) {
      Object.keys(regionsData.bridgeLanguages).forEach((region) => {
        options.push({
          label: region,
          value: region,
          category: "Bridge Languages",
          langCodes: regionsData.bridgeLanguages[region],
        });
      });
    }

    // Add India regions
    if (regionsData.india) {
      Object.keys(regionsData.india).forEach((region) => {
        options.push({
          label: `India: ${region}`,
          value: `India: ${region}`,
          category: "India",
          langCodes: regionsData.india[region],
        });
      });
    }

    // Add Spanish sphere
    if (regionsData.spanishSphere) {
      Object.keys(regionsData.spanishSphere).forEach((region) => {
        options.push({
          label: region,
          value: region,
          category: "Spanish Sphere",
          langCodes: regionsData.spanishSphere[region],
        });
      });
    }

    // Add Myanmar sphere
    if (regionsData.myanmarSphere) {
      Object.keys(regionsData.myanmarSphere).forEach((region) => {
        options.push({
          label: region,
          value: region,
          category: "Myanmar",
          langCodes: regionsData.myanmarSphere[region],
        });
      });
    }

    // Add other regions
    if (regionsData.otherRegions) {
      Object.keys(regionsData.otherRegions).forEach((region) => {
        options.push({
          label: region,
          value: region,
          category: "Other Regions",
          langCodes: regionsData.otherRegions[region],
        });
      });
    }

    return options;
  }, []);

  // Initialize selected region from context
  useEffect(() => {
    if (selectedRegionFromContext) {
      const regionOption = regionOptions.find(
        (opt) => opt.value === selectedRegionFromContext,
      );
      if (regionOption) {
        setSelectedRegionLocal(regionOption);
      }
    }
  }, [selectedRegionFromContext, regionOptions]);

  useEffect(() => {
    if (selectedLanguage && selectedLanguage !== selectedLocLang?.orgId) {
      const curValue = availableLangOptions.find(
        (obj) => obj.orgId === selectedLanguage,
      );
      if (curValue) {
        setSelectedLocLang(curValue);
        setActiveLang(curValue.orgId);
      }
    }
  }, [selectedLanguage, availableLangOptions]);

  // Get the languages to display based on selected region
  const displayLanguages = useMemo(() => {
    // If "Open Bible Stories" is selected, show all OBS languages
    if (!selectedRegion || selectedRegion.value === "Open Bible Stories") {
      return Object.keys(obsLangData);
    }

    // Otherwise, filter based on region's language codes
    const regionLangCodes = selectedRegion.langCodes || [];
    const availableLangCodes = mediaState.availableLanguages || [];

    console.log("Selected region:", selectedRegion.value);
    console.log("Region lang codes:", regionLangCodes);
    console.log("Available lang codes from ZIP:", availableLangCodes);

    // If no ZIP data loaded yet, show the region languages anyway
    if (availableLangCodes.length === 0) {
      console.log("No ZIP data, showing all region languages");
      return regionLangCodes;
    }

    // Find intersection of region languages and available languages from ZIP
    const filteredLangCodes = regionLangCodes.filter((code) =>
      availableLangCodes.includes(code),
    );

    console.log("Filtered lang codes:", filteredLangCodes);

    return filteredLangCodes;
  }, [selectedRegion, mediaState.availableLanguages]);

  const useCols = useMemo(() => {
    const colMap = {
      xs: 2,
      sm: 3,
      md: 3,
      lg: 4,
      xl: 5,
    };
    return colMap[size] || 3;
  }, [size]);

  const handleLangClick = (langCode) => {
    // For OBS languages, use the existing logic
    if (selectedRegion?.value === "Open Bible Stories") {
      const checkValue = removeDash(langCode);
      const curValue = availableLangOptions.find(
        (obj) => removeDash(obj.orgId) === checkValue,
      );
      if (curValue) {
        setSelectedLocLang(curValue);
        setSelectedLanguage(curValue.orgId);
        onLangClick?.();
      }
    } else {
      // For region languages, use the language code directly
      setActiveLang(langCode);
      onLangClick?.();
    }
  };

  const handleButtonClick = () => {
    // Simulate a click on the current value
    handleLangClick(selectedLocLang.value);
  };

  const handleAutocompleteChange = (event, newValue) => {
    if (newValue) {
      setSelectedLocLang(newValue);
      setSelectedLanguage(newValue.value);
    }
  };

  const handleRegionChange = (event, newValue) => {
    setSelectedRegionLocal(newValue);
    if (newValue?.value) {
      setSelectedRegion(newValue.value);
    }
  };

  const showHeader = true;
  return (
    <Box sx={{ pt: 3 }}>
      <CssBaseline />
      {showHeader && (
        <SimpleAppBar position="fixed">
          <Toolbar>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1 }}
            >
              Open Bible Stories
            </Typography>
            <Button
              variant="contained"
              color="error"
              aria-label="Lang settings"
              onClick={handleButtonClick}
              startIcon={<CloseIcon />}
            ></Button>
          </Toolbar>
        </SimpleAppBar>
      )}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: "#f5f5f5" }}>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 600, color: "#020054" }}
          >
            Language Selection
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography
            variant="subtitle1"
            component="h3"
            gutterBottom
            sx={{ mt: 2, mb: 1, fontWeight: 500 }}
          >
            Filter by Region
          </Typography>

          <Autocomplete
            id="region-autocomplete"
            disablePortal
            options={regionOptions}
            groupBy={(option) => option.category}
            sx={{
              width: "100%",
              backgroundColor: "white",
              mb: 3,
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#020054",
                },
                "&:hover fieldset": {
                  borderColor: "#020054",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#020054",
                },
              },
            }}
            renderInput={(params) => <TextField {...params} label="Region" />}
            value={selectedRegion}
            onChange={handleRegionChange}
          />

          <Typography
            variant="subtitle1"
            component="h3"
            gutterBottom
            sx={{ mt: 3, mb: 1, fontWeight: 500 }}
          >
            Selected Language
          </Typography>

          <Autocomplete
            id="lang-autocomplete"
            disablePortal
            options={availableLangOptions}
            getOptionDisabled={(option) => option?.value === i18n.language}
            sx={{
              width: "100%",
              backgroundColor: "white",
              mb: 2,
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#020054",
                },
                "&:hover fieldset": {
                  borderColor: "#020054",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#020054",
                },
              },
            }}
            renderInput={(params) => (
              <TextField {...params} label="Languages" />
            )}
            value={selectedLocLang}
            onChange={handleAutocompleteChange}
          />
        </Paper>

        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          sx={{ fontWeight: 600, color: "#020054", mb: 2 }}
        >
          Available Languages{" "}
          {selectedRegion?.value !== "Open Bible Stories" &&
            `(${displayLanguages.length})`}
        </Typography>
        <ImageList
          rowHeight={120}
          cols={useCols}
          gap={12}
          sx={{ overflowY: "clip" }}
        >
          {displayLanguages.map((lng) => {
            // Check if this is OBS language or region language
            const isOBSLanguage =
              selectedRegion?.value === "Open Bible Stories";

            let shortLang, title, isActive, isDisabled, langCode;

            if (isOBSLanguage) {
              // OBS language display (existing logic)
              const lData = availableLangOptions.find(
                (obj) => obj.value === removeDash(lng),
              );

              shortLang = capitalizeFirstLetter(lng) || "unknown";
              title = lData?.label || "";

              if (lng.length > 3) {
                shortLang = capitalizeFirstLetter(lng.slice(0, 2));
                const countryCode = lng.slice(3);
                title = `${lData?.label} (${countryCode})`;
              }

              isActive = activeLang === lData?.orgId;
              isDisabled =
                obsOldFormat.includes(lng) ||
                obsOldFormat.includes(lData?.value);
              langCode = lData?.orgId;
            } else {
              // Region language display (from regions.json)
              langCode = lng;

              // Get language names from ZIP data
              const names = getLanguageNames(lng);

              if (names?.vernacular || names?.english) {
                const vernacularName = names.vernacular;
                const englishName = names.english;

                // Format display similar to OBS languages
                if (
                  vernacularName &&
                  englishName &&
                  vernacularName !== englishName
                ) {
                  title = `${vernacularName} - ${englishName}`;
                } else {
                  title = vernacularName || englishName;
                }

                shortLang = lng.slice(0, 3).toUpperCase();
              } else {
                // Fallback if language not found in ZIP data
                shortLang = lng.slice(0, 3).toUpperCase();
                title = lng;
              }

              // Check if this language is in availableLanguages (from ZIP)
              const isAvailable = mediaState.availableLanguages?.includes(lng);
              isActive = activeLang === lng;
              isDisabled = !isAvailable;
            }

            // Get category-based color for region languages
            let bkgdColor;
            if (isActive) {
              bkgdColor = "#4CAF50"; // Green for active
            } else if (isOBSLanguage) {
              bkgdColor = "#020054"; // Dark blue for OBS languages
            } else {
              // For region languages, use category color
              const category = getLanguageCategory(lng);
              bkgdColor = category ? getCategoryColor(category) : "#020054";
            }

            return (
              <ImageListItem
                key={lng}
                onClick={
                  isDisabled ? undefined : () => handleLangClick(langCode)
                }
                sx={{
                  opacity: isDisabled ? 0.5 : 1,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  borderRadius: 2,
                  overflow: "hidden",
                  boxShadow: isActive ? 3 : 1,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    opacity: isDisabled ? 0.5 : 0.9,
                    transform: isDisabled ? "none" : "translateY(-4px)",
                    boxShadow: isDisabled ? 1 : 4,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: "30px",
                    backgroundColor: bkgdColor,
                    color: "white",
                    textAlign: "center",
                    py: 1,
                    fontWeight: 600,
                  }}
                >
                  {shortLang}
                </Typography>
                <Typography
                  sx={{
                    pt: 1.5,
                    fontSize: "13px",
                    backgroundColor: "#444",
                    color: "white",
                    textAlign: "center",
                    px: 1,
                    minHeight: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {title}
                </Typography>
              </ImageListItem>
            );
          })}
        </ImageList>
      </Box>
    </Box>
  );
}
