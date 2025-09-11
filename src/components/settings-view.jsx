import { useState, useMemo } from "react";
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
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import SimpleAppBar from "./simple-app-bar";
import { obsLangData } from "../constants/obs-langs";
import useBrowserData from "../hooks/useBrowserData";
import useMediaPlayer from "../hooks/useMediaPlayer";

const capitalizeFirstLetter = (str = "") =>
  str.charAt(0).toUpperCase() + str.slice(1);

const getNameLabel = (nameObj) => {
  if (nameObj?.en && nameObj?.en === nameObj?.n) return nameObj?.n;
  if (nameObj?.n && nameObj?.en) return `${nameObj?.n} - ${nameObj?.en}`;
  return nameObj?.n || nameObj?.en || "";
};

const removeDash = (str) => str.replace(/-/gi, "");

export default function SettingsView({ onConfirmClick, initialSettingsMode }) {
  const { i18n } = useTranslation();
  const { size } = useBrowserData();
  const { setSelectedLanguage } = useMediaPlayer();
  const defaultLang = "eng";
  const activeLang = defaultLang;
  const [selectedLocLang, setSelectedLocLang] = useState({
    value: "eng",
    label: "English",
    origId: "eng",
  });

  const availableLangOptions = useMemo(() => {
    return Object.keys(obsLangData).map((lKey) => {
      const nameLabel = getNameLabel({
        n: obsLangData[lKey].nm,
        en: obsLangData[lKey].eNm,
      });
      return {
        value: removeDash(lKey),
        label: nameLabel || obsLangData[lKey].nm || obsLangData[lKey].eNm,
        orgId: obsLangData[lKey].publishedID
      };
    });
  }, []);

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

  const handleLangClick = (langKey) => {
    const checkValue = removeDash(langKey);
    const curValue = availableLangOptions.find(
      (obj) => obj.value === checkValue,
    );
    if (curValue) {
      console.log(curValue)
      setSelectedLocLang(curValue);
      setSelectedLanguage(curValue.orgId);
      onConfirmClick?.();
    }
  };

  const handleConfirmClick = () => {
    onConfirmClick?.();
    console.log(selectedLocLang)
    // Simulate a click on the current value
    handleLangClick(selectedLocLang.value)    
  };

  const handleAutocompleteChange = (event, newValue) => {
    if (newValue) {
      setSelectedLocLang(newValue);
      setSelectedLanguage(newValue.value);
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
              OBS Wiki
            </Typography>
            <Button
              variant="contained"
              color="error"
              aria-label="confirm settings"
              onClick={handleConfirmClick}
              startIcon={<CloseIcon />}
            >
              Cancel
            </Button>
          </Toolbar>
        </SimpleAppBar>
      )}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Selected Languages
        </Typography>

        <Autocomplete
          id="lang-autocomplete"
          disablePortal
          options={availableLangOptions}
          getOptionDisabled={(option) => option?.value === i18n.language}
          sx={{
            width: "100%",
            backgroundColor: "lightgrey",
            mb: 3,
          }}
          renderInput={(params) => <TextField {...params} label="Languages" />}
          value={selectedLocLang}
          onChange={handleAutocompleteChange}
        />
        <ImageList
          rowHeight={120}
          cols={useCols}
          gap={9}
          sx={{ overflowY: "clip" }}
        >
          {Object.keys(obsLangData).map((lng) => {
            const lData = availableLangOptions.find(
              (obj) => obj.value === removeDash(lng),
            );

            let shortLang = capitalizeFirstLetter(lng) || "unknown";
            let title = lData?.label || "";

            if (lng.length > 3) {
              shortLang = capitalizeFirstLetter(lng.slice(0, 2));
              const countryCode = lng.slice(3);
              title = `${lData?.label} (${countryCode})`;
            }

            const isActive = activeLang === lng;
            const bkgdColor = isActive ? "lightblue" : "#020054";

            return (
              <ImageListItem
                key={lng}
                onClick={() => handleLangClick(lng)}
                sx={{
                  cursor: "pointer",
                  "&:hover": {
                    opacity: 0.8,
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
