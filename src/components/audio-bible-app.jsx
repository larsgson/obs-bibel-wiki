import * as React from 'react';
import { styled, useTheme, ThemeProvider } from '@mui/material/styles'
import SettingsView from './settings-view'
import ObsNavigattion from './obs-navigation'
import HomeView from './home-view'
import SimpleAppBar from './simple-app-bar'
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import HomeIcon from '@mui/icons-material/Home'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import useMediaPlayer from '../hooks/useMediaPlayer'
import useBrowserData from '../hooks/useBrowserData'
import { isEmptyObj } from '../utils/obj-functions'

const drawerWidth = 240;
const topLevelNavItems = [
  {text: "Home", icon: <HomeIcon/>},
  {text: "Bible", icon: <MenuBookIcon/>}
]

const defaultBackgroundStyle = {
  height: 'auto',
  minHeight: '100vh',
  background: '#181818',
  padding: 0,
  color: 'whitesmoke',
}

const ToggleMiniListItem = (index,isActive,wide,text,icon,onClickMenu) => (
  <ListItem key={text} disablePadding sx={{ display: 'block' }}>
    <ListItemButton
      onClick={()=>onClickMenu(index)}
      sx={[
        {minHeight: 48,px: 2.5},
        wide
          ? {justifyContent: 'initial'}
          : {justifyContent: 'center'},
        isActive && {backgroundColor: '#3e3e3e'}
      ]}
    >
      <ListItemIcon
        sx={[
          {minWidth: 0, justifyContent: 'center'},
          wide
            ? {mr: 3}
            : {mr: 'auto'},
            isActive 
            ? {color: 'white'}
            : {color: 'darkgrey'},
        ]}
      >
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={text}
        sx={[wide
            ? {opacity: 1}
            : {opacity: 0},
            isActive 
            ? {color: 'white'}
            : {color: 'lightgrey'},
        ]}
      />
    </ListItemButton>
  </ListItem>
)

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    variants: [
      {
        props: ({ open }) => open,
        style: {
          ...openedMixin(theme),
          '& .MuiDrawer-paper': openedMixin(theme),
        },
      },
      {
        props: ({ open }) => !open,
        style: {
          ...closedMixin(theme),
          '& .MuiDrawer-paper': closedMixin(theme),
        },
      },
    ],
  }),
);

export default function AudioBibleNavigationApp() {
  const theme = useTheme();
  // const { navHist, startPlay, curPlay, selectedCountry, confirmedCountry} = useMediaPlayer()
  const { navHist, startPlay, curPlay, selectedCountry } = useMediaPlayer()
  const confirmedCountry = true
  const isPlaying = !isEmptyObj(curPlay)
  const { size, width } = useBrowserData()
  const isMobileSize = (size === "sm" || size === "xs")
  const [menuValue, setMenuValue] = React.useState(2)
  const [emptyList, setEmptyList] = React.useState(true)
  const [open, setOpen] = React.useState(false)

  const ref = React.useRef(null);

  React.useEffect(() => {
    if ((emptyList) && (navHist)) {
      setEmptyList(false)
      console.log("no longer empty list")
      setMenuValue(1)
    }
  },[navHist,emptyList,setEmptyList,setMenuValue])

  React.useEffect(() => {
    if ((isMobileSize) && (ref.current)) {
      (ref.current).ownerDocument.body.scrollTop = 0;
    // setMessages(refreshMessages());
    }
  }, [menuValue,isMobileSize]);

  React.useEffect(() => {
    console.log(menuValue)
  }, [menuValue]);

  const handleStartBiblePlay = (topIdStr,curSerie,bookObj,id) => {
    const {bk} = bookObj
    const curEp = {bibleType: true,bk,bookObj,id}
    startPlay(topIdStr,id,curSerie,curEp)
  }
  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);
  const handleClickMenu = (inx) => setMenuValue(inx)
  const settingsMenuIndex = topLevelNavItems.length
  return (
    <div style={defaultBackgroundStyle}>
      <ThemeProvider theme={theme}>
        {!isPlaying && isMobileSize && confirmedCountry && (
          <Box sx={{ pb: 7 }} ref={ref}>
            <CssBaseline />
            {(menuValue===settingsMenuIndex) && (
              <SettingsView
                initialSettingsMode={true}
                onConfirmClick={()=>setMenuValue(1)}
              />
            )}
            {(menuValue===1) && (<ObsNavigattion
                onExitNavigation={() => console.log("onExitNavigation - ObsNavigattion")}
                onStartPlay={handleStartBiblePlay}
            />)}
            {(menuValue===0) && (<HomeView
              onExitNavigation={() => console.log("onExitNavigation - Top")}
              onAddNavigation={()=>setMenuValue(1)}
              onStartPlay={handleStartBiblePlay}
            />)}
          </Box>
        )}
        {!isPlaying && !confirmedCountry && (
          <SettingsView 
            initialSettingsMode={true}
            onConfirmClick={()=>setMenuValue(1)}
          />
        )}
        {!isPlaying && !isMobileSize && confirmedCountry && (
          <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <SimpleAppBar position="fixed" open={open}>
              <Toolbar>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  onClick={handleDrawerOpen}
                  edge="start"
                  sx={[
                    {
                      marginRight: 5,
                    },
                    open && { display: 'none' },
                  ]}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap component="div">
                  OBS Bibel Wiki
                </Typography>
              </Toolbar>
            </SimpleAppBar>
            <Drawer variant="permanent" open={open} PaperProps={{ sx: { backgroundColor: "#282828" } }}>
              <DrawerHeader>
                <IconButton 
                  onClick={handleDrawerClose} 
                  sx={{color:'whitesmoke', backgroundColor:'#3e3e3e'}}
                >
                  {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </IconButton>
              </DrawerHeader>
              <Divider />
              <List >
                {topLevelNavItems.map((item,inx) => ToggleMiniListItem(
                  inx,
                  (inx===menuValue),
                  open,
                  item.text,
                  item.icon,
                  handleClickMenu
                ))}
                {ToggleMiniListItem( 
                  settingsMenuIndex,
                  (menuValue===settingsMenuIndex),
                  open,
                  "Settings",
                  <MenuIcon/>,
                  handleClickMenu
                )}
              </List>
              <Divider />
              <List>
              </List>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
              <DrawerHeader />
              {(menuValue===settingsMenuIndex) && (
                <SettingsView
                  initialSettingsMode={true}
                  onConfirmClick={()=>setMenuValue(1)}
                />
              )}
              {(menuValue===1) && (<ObsNavigattion
                onExitNavigation={() => console.log("onExitNavigation - ObsNavigattion")}
                onStartPlay={handleStartBiblePlay}
              />)}
            </Box>
          </Box>
        )}
        {isPlaying && (menuValue===2) && (
          <SettingsView
            initialSettingsMode={true}
            onConfirmClick={()=>setMenuValue(1)}
          />
        )}
        {isPlaying && (menuValue===1) && (<ObsNavigattion
            onExitNavigation={() => console.log("onExitNavigation - ObsNavigattion")}
            onStartPlay={handleStartBiblePlay}
        />)}
      </ThemeProvider>
    </div>
);
}
