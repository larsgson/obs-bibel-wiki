import { useState } from 'react';
import { useTranslation } from 'react-i18next'
// import { navLangList } from '../constants/languages'
import SimpleAppBar from './simple-app-bar'
import ImageList from '@mui/material/ImageList'
import ImageListItem from '@mui/material/ImageListItem'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import NavCloseIcon from '@mui/icons-material/Close'
import CssBaseline from '@mui/material/CssBaseline'
import Toolbar from '@mui/material/Toolbar'
import { obsLangData } from '../constants/obs-langs'
import useBrowserData from '../hooks/useBrowserData'
import useMediaPlayer from '../hooks/useMediaPlayer'

const capitalizeFirstLetter = ([ first='', ...rest ]) => [ first.toUpperCase(), ...rest ].join('')

const getNameLabel = (nameObj) => {
  let label = ""
  if ((nameObj?.en) && (nameObj?.en === nameObj?.n)) {
    label = nameObj?.n
  } else if ((nameObj?.n) && (nameObj?.en)) {
    label = `${nameObj?.n} - ${nameObj?.en}`
  } else if (nameObj?.n) {
    label = nameObj?.n
  } else {
    label = nameObj?.en || ""
  }
  return label
}

const removeDash = (org) => org.replace(/-/gi, "")

export default function SettingsView({onConfirmClick,initialSettingsMode}) {
  const { t, i18n } = useTranslation();
  const { size } = useBrowserData()
  const { setSelectedLanguage, selectedLanguage } = useMediaPlayer()
  const defaultLang ="eng"
  const activeLang = defaultLang
  const [selectedLocLang,setSelectedLocLang] = useState({value: "eng", label: "English"})

  const availableLangOptions = []
  Object.keys(obsLangData).forEach(lKey => {
    const nameLabel = getNameLabel({
      n: obsLangData[lKey].nm,
      en: obsLangData[lKey].eNm,
    })
    availableLangOptions.push({
      value: removeDash(lKey),
      label: nameLabel || obsLangData[lKey].nm || obsLangData[lKey].eNm 
    }) 
  })
  let useCols = 3
  if (size==="xs") useCols = 2
  else if (size==="lg") useCols = 4
  else if (size==="xl") useCols = 5

  const handleLangClick = (l) => {
    const checkValue = removeDash(l)                                
    const curValue = availableLangOptions.find(obj => (obj.value === checkValue))
    console.log(curValue)                                
    setSelectedLocLang(curValue)
    setSelectedLanguage(curValue.value)
    onConfirmClick && onConfirmClick()
  }
  const handleConfirmClick = () => {
    console.log("confirm click")
    onConfirmClick && onConfirmClick()
    // Simulate a click on the current value
    handleLangClick(selectedLocLang.value)
  }
  // const showHeader = (!selectedLanguage) || initialSettingsMode
  const showHeader = true
  return (
    <Box sx={{ tp: 3 }}>
      <CssBaseline />
      {showHeader && (<SimpleAppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            OBS Wiki
          </Typography>
          <Button
            variant="contained"
            color="error"
            aria-label="confirm settings"
            onClick={handleConfirmClick}
            startIcon={<NavCloseIcon/>}
          >Cancel
          </Button>
        </Toolbar>
      </SimpleAppBar>)}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <div>Selected Languages</div>
          <br/>
          <Autocomplete
            id="lang-autocomplete"
            disablePortal
            options={availableLangOptions}
            getOptionDisabled={(option) =>option?.value === i18n.language}
            sx={{ 
              width: '100%',
              backgroundColor: "lightgrey"
            }}
            renderInput={(params) => <TextField {...params} label="Languages" />}
            value={selectedLocLang}
            onChange={(event, newValue) => {
              console.log(newValue)
              setSelectedLocLang(newValue) 
              setSelectedLanguage(newValue.value)
            }}
          />
          <br/>
          <ImageList
            rowHeight={120}
            cols={useCols}
            gap={9}
            sx={{overflowY: 'clip'}}
          >
            {Object.keys(obsLangData).map((lng) => {
              let nativeStr = ""
              let subtitle = undefined
              const lData2 = availableLangOptions.find(obj => (obj.value === removeDash(lng)))
              nativeStr = lData2?.label
              let title = nativeStr
              let shortLang = lng && capitalizeFirstLetter(lng) || "unknown"
              if (lng.length>3) {
                shortLang = capitalizeFirstLetter(lng.slice(0,2))
                const countryCode = lng.slice(3)
                title = `${lData2?.label} (${countryCode})`
              }
              const isActive = (activeLang === lng) 
              const bkgdColor = isActive ? 'lightblue' : `#020054`
              return (
                <span key={lng}>
                  <ImageListItem onClick={() => handleLangClick(lng)}>
                    <Typography 
                      sx={{ 
                        fontSize: '30px',
                        backgroundColor: bkgdColor
                      }}>
                      {shortLang}
                    </Typography>
                    <Typography 
                      sx={{ 
                        paddingTop: '12px',
                        fontSize: '13px',
                        backgroundColor: '#444' 
                      }}>
                      {title}
                    </Typography>
                    <Typography 
                      sx={{ 
                        fontSize: '11px',
                        backgroundColor: '#444',
                        paddingBottom: '8px',
                      }}>
                      {subtitle}
                    </Typography>
                  </ImageListItem>
                </span>
              )}
            )}
          </ImageList>
          <div 
            style={{
              paddingBottom: 30,
              // m: 1,
            }}
          >
          <br/>
        {/* <button onClick={() => window.open("https://github.com/larsgson/bibel-wiki/blob/main/roadmap.md", "_blank")}>
          Road map
        </button> */}
        </div>
      </Box>
    </Box>
  );
}
