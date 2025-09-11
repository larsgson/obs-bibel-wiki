import * as React from "react";
import { useTheme, ThemeProvider } from "@mui/material/styles";
import SettingsView from "./settings-view";
import ObsNavigattion from "./obs-navigation";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import useMediaPlayer from "../hooks/useMediaPlayer";
import useBrowserData from "../hooks/useBrowserData";
import { isEmptyObj } from "../utils/obj-functions";

const defaultBackgroundStyle = {
  height: "auto",
  minHeight: "100vh",
  background: "#181818",
  padding: 0,
  color: "whitesmoke",
};

export default function OBSApp() {
  const theme = useTheme();
  const { startPlay, curPlay, selectedLanguage, langIsSelected } = useMediaPlayer();
  const isPlaying = !isEmptyObj(curPlay);
  const { size } = useBrowserData();
  const isMobileSize = size === "sm" || size === "xs";
  const [menuValue, setMenuValue] = React.useState(2);

  const ref = React.useRef(null);

  React.useEffect(() => {
    if (isMobileSize && ref.current) {
      ref.current.ownerDocument.body.scrollTop = 0;
      // setMessages(refreshMessages());
    }
  }, [menuValue, isMobileSize]);

  React.useEffect(() => {
    // No need to select language on initial load - reset menu value to 1
    if (langIsSelected && (menuValue===2)) setMenuValue(1)
  }, [langIsSelected]);

  const handleStartBiblePlay = (topIdStr, curSerie, bookObj, id) => {
    const { bk } = bookObj;
    const curEp = { bibleType: true, bk, bookObj, id };
    startPlay(topIdStr, id, curSerie, curEp);
  };

  const handleTopClick = () => {
    setMenuValue(2);
  };

  const settingsMenuIndex = 2;
  return (
    <div style={defaultBackgroundStyle}>
      <ThemeProvider theme={theme}>
        {!isPlaying && isMobileSize && selectedLanguage && (
          <Box sx={{ pb: 7 }} ref={ref}>
            <CssBaseline />
            {menuValue === settingsMenuIndex && (
              <SettingsView onConfirmClick={() => setMenuValue(1)} />
            )}
            {menuValue === 1 && (
              <ObsNavigattion
                onExitNavigation={handleTopClick}
                onStartPlay={handleStartBiblePlay}
              />
            )}
          </Box>
        )}
        {!isPlaying && !selectedLanguage && (
          <SettingsView onConfirmClick={() => setMenuValue(1)} />
        )}
        {!isPlaying && !isMobileSize && selectedLanguage && (
          <Box sx={{ display: "flex" }}>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
              {menuValue === settingsMenuIndex && (
                <SettingsView onConfirmClick={() => setMenuValue(1)} />
              )}
              {menuValue === 1 && (
                <ObsNavigattion
                  onExitNavigation={handleTopClick}
                  onStartPlay={handleStartBiblePlay}
                />
              )}
            </Box>
          </Box>
        )}
        {isPlaying && menuValue === settingsMenuIndex && (
          <SettingsView onConfirmClick={() => setMenuValue(1)} />
        )}
        {isPlaying && menuValue === 1 && (
          <ObsNavigattion
            onExitNavigation={handleTopClick}
            onStartPlay={handleStartBiblePlay}
          />
        )}
      </ThemeProvider>
    </div>
  );
}
