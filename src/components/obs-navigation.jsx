import React, { useState, useEffect } from 'react'
import Typography from '@mui/material/Typography'
import Fab from '@mui/material/Fab'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ImageList from '@mui/material/ImageList'
import ImageListItem from '@mui/material/ImageListItem'
import ImageListItemBar from '@mui/material/ImageListItemBar'
import ReactMarkdown from 'react-markdown'
import { rangeArray, pad } from '../utils/obj-functions'
import { obsHierarchy, obsTitles, obsStoryList } from '../constants/obsHierarchy'
import useBrowserData from '../hooks/useBrowserData'
import useMediaPlayer from '../hooks/useMediaPlayer'

const bibleData = {
  freeType: false,
  curPath: "",
  title: "Open Bible Stories",
  description: "",
  image: {
      origin: "Local",
      filename: ""
  },
  language: "eng",
  mediaType: "bible",
  episodeList: obsStoryList,
  uniqueID: "uW.OBS.en"
}

const SerieGridBar = (props) => {
  // eslint-disable-next-line no-unused-vars
  const { classes, title, subtitle } = props
  return (
      <ImageListItemBar
        title={title}
        subtitle={subtitle}
      />
  )
}

const OBSNavigation = (props) => {
  // eslint-disable-next-line no-unused-vars
  const { size, width } = useBrowserData()
  const { verseText } = useMediaPlayer()
  const { onExitNavigation, onStartPlay } = props
  // const curSerie = (curPlay!=null) ? curPlay.curSerie : undefined
  const curSerie = bibleData
  const [curLevel, setCurLevel] = useState(1)
  const [level1, setLevel1] = useState(1)
  const [level2, setLevel2] = useState()
  // eslint-disable-next-line no-unused-vars
  const [curStory,setCurStory] = useState("")

  // eslint-disable-next-line no-unused-vars
  const handleClick = (ev,id,_isBookIcon) => {
    if (curLevel===1){
      setLevel1(id)
      setCurLevel(2)
    } else if (curLevel===2){
      // onStartPlay(curSerie,id,level1)
      setLevel2(id)
      setCurLevel(3)
    } else {
      // ToDo: Maybe we can allow navigation inside the stories here?
      // onStartPlay(curSerie,bookObj,id)
    }
  }

  useEffect(() => {
    if (level2) {
      setCurStory(verseText[level2-1])
    }
  }, [verseText,level2])

  const navigateUp = (level) => {
    if (level===0){
      onExitNavigation()
    } else {
      setCurLevel(level)
    }
  }

  const handleReturn = () => {
    if (curLevel>2){
      navigateUp(2)
    } else
    if (curLevel>1){
      navigateUp(curLevel-1)
    } else {
      onExitNavigation()
    }
  }

  let validIconList = []
  if (curLevel===1){
    obsHierarchy.map((obj,iconInx) => {
      const curIconObj = {
        key: iconInx,
        imgSrc: `/navIcons/${obj.img}`,
        title: obj.title,
        // subtitle: "test",
        isBookIcon: false
      }
      validIconList.push(curIconObj)
    })
  }
  if (curLevel===2){
    const curObj = obsHierarchy[level1]
    const beg = curObj.beg
    const end = beg + curObj.count -1
    rangeArray(beg,end).forEach(inx => {
      const curIconObj = {
        key: inx,
        imgSrc: `/obsIcons/obs-en-${pad(inx)}-01.jpg`,
        title: obsTitles[inx-1],
        isBookIcon: false
      }
      validIconList.push(curIconObj)
    })
  }

  const rootLevel = (curLevel===1)
  let useCols = 3
  let rowHeight = undefined
  if (curLevel===3) {
    useCols = 1
    rowHeight = width / 1.77
  } else if (size==="xs") {
    if (rootLevel) {
      useCols = 2
      rowHeight = width / 2
    } else {
      useCols = 1
      rowHeight = width / 1.77
    }
  } else if (size==="sm") {
    if (rootLevel) {
      useCols = 3
      rowHeight = width / 3
    } else {
      useCols = 2
      rowHeight = width / 3.55
    }
  } else if (size==="md" || size==="lg") {
    if (rootLevel) {
      useCols = 4
      rowHeight = width / 4
    } else {
      useCols = 2
      rowHeight = width / 3.55
    }
  } else if (size==="xl") {
    if (rootLevel) {
      useCols = 5
      rowHeight = width / 5
    } else {
      useCols = 3
      rowHeight = width / 5.33
    }
  }
  return (
    <div>
      <Fab
        onClick={handleReturn}
        color="primary"
      >
        <ChevronLeft />
      </Fab>
      {(curLevel<=2) && (
      <>
        <Typography
          type="title"
        >OBS Navigation</Typography>
        <ImageList
          rowHeight={rowHeight}
          cols={useCols}
        >
        {validIconList.map(iconObj => {
          const {key,imgSrc,title,subtitle,isBookIcon} = iconObj
          return (
            <ImageListItem
              onClick={(ev) => handleClick(ev,key,isBookIcon)}
              key={key}
            >
              <img
                src={imgSrc}
                alt={title}/>
              <SerieGridBar
                title={title}
                subtitle={subtitle}
              />
            </ImageListItem>
          )
        })}
        </ImageList>
      </>)}
      {(curLevel===3) && (
      <>
        <Typography
          type="title"
        >{obsTitles[level2-1]}</Typography>
        <ReactMarkdown>
          {curStory}
        </ReactMarkdown>
      </>)}
    </div>
  )
}

export default OBSNavigation
