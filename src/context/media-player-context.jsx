import React, { useState, useEffect, useCallback  } from 'react'
import { apiSetStorage, apiGetStorage, apiObjGetStorage, apiObjSetStorage } from '../utils/api'
import { pad } from '../utils/obj-functions'
import { useTranslation } from 'react-i18next'
import { obsLangData } from '../constants/obs-langs'

const MediaPlayerContext = React.createContext([{}, () => {}])
const MediaPlayerProvider = (props) => {
  const [state, setState] = useState({ isPlaying: false })
  const { t, i18n } = useTranslation()
  const setStateKeyVal = (key,val) => setState(state => ({ ...state, [key]: val }))

  const [isPaused, setIsPaused] = useState(false)
  const [imgPosOBS, setImgPosOBS] = useState({})
  const [verseTextPosAudio, setVerseTextPosAudio] = useState([])
  const [verseText, setVerseText] = useState({})
  const [langUrl, setLangUrl] = useState()
  const [curLang,setCurLang] = useState("en")

  const fetchJSONDataFrom = useCallback(async (inx) => {
    const response = await fetch(`data/img_pos${pad(inx +1)}.json`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      }
    })
    const data = await response.json()
    setImgPosOBS((prev) => ({
      ...prev,
      [inx]: data,
    }))
  }, [])

  useEffect(() => {
    setStateKeyVal( "verseText", verseText )
  }, [verseText])

  const fetchTextFrom = useCallback(async (url, inx) => {
    const response = await fetch(`${url}/raw/branch/master/content/${pad(inx +1)}.md`)
    const data = await response.text()
    setVerseText((prev) => ({
      ...prev,
      [inx]: data,
    }))
  }, [])

  useEffect(() => {
    const lang = obsLangData[curLang]?.publishedID
    const params = new URLSearchParams({
      subject: 'Open Bible Stories',
      stage: 'prod',
      lang,
    })
    const getLangUrl = async () => {
      const langRes = await fetch(`https://git.door43.org/api/v1/catalog/search?${params}`)
      if (!langRes.ok) {
        throw new Error(`Failed to search collections: ${langRes.status}`)
      }
      // const usePath = "https://git.door43.org/api/v1/catalog/list/languages?subject=Open%20Bible%20Stories&stage=prod&lang=en"
      // const usePath = "https://git.door43.org/api/v1/catalog/list/languages?subject=Open%20Bible%20Stories&stage=prod"
      // const response = await fetch(usePath).then(response => response.json())
      console.log(langRes)
      const resText = await new Response(langRes.body).json()
      const useUrl = resText?.data[0]?.repo?.html_url
      console.log(params)
      console.log(resText?.data[0]) 
      // "content_format": "markdown"
      // "metadata_type": 
      console.log(useUrl) 
      setLangUrl(useUrl)
    }
    if ((curLang) && (curLang.length>0)) getLangUrl()
  }, [curLang])

  useEffect(() => {
    const getTextForAllStories = async () => {
      const maxStories = 50
      // const maxStories = 2
      for(let i=0; i < maxStories; i++) {
        // Wait for each task to finish
        await fetchTextFrom(langUrl,i)
      }      
    }
    console.log(langUrl)
    if ((langUrl) && (langUrl.length>0)) getTextForAllStories()
  }, [langUrl])

  useEffect(() => {
    const getDataForAllStories = async () => {
      const maxStories = 50
      for(let i=0; i < maxStories; i++) {
        // Wait for each task to finish
        await fetchJSONDataFrom(i)
      }      
    }
    if (curLang === "en") getDataForAllStories()
  }, [fetchJSONDataFrom])

  useEffect(() => {
    const getCurLang = async () => {
      const curLang = await apiGetStorage("selectedLanguage")
      if (curLang) {
        setStateKeyVal("selectedLanguage",curLang)
      }
    }
    const getNavHist = async () => {
      const navHist = await apiGetStorage("navHist")
      setState(prev => ({...prev, navHist}))
    }
    getCurLang()
    getNavHist()
  }, [])

  const togglePlay = () => {
//    state.isPlaying ? player.pause() : player.play()
    setStateKeyVal( "isPlaying", !state.isPlaying )
  }

  const skipToNextTrack = () => {
//    playTrack(newIndex)
  }

  const setSelectedLanguage = async (newLang) => {
    setStateKeyVal("selectedLanguage",newLang)
    await apiSetStorage("selectedLanguage",newLang)
    setCurLang(newLang)
    console.log(newLang)
  }

  const onFinishedPlaying = () => {
    console.log("onFinishedPlaying")
    if (state.curPlay) {
      apiObjSetStorage(state.curPlay,"mSec",state.curEp.begTimeSec * 1000) // Reset the position to beginning
      const {curSerie, curEp} = state.curPlay
      if (curSerie){
        if ((curSerie.episodeList!=null) && (curSerie.episodeList.length>0)
            && (curEp!=null)){
          // This serie has episodes
          let epInx = curEp.id
          epInx+=1
          let newPlayObj = {curSerie}
          apiObjSetStorage(newPlayObj,"curEp",epInx)
          if (curSerie.episodeList[epInx]!=null){
            newPlayObj.curEp=curSerie.episodeList[epInx]
          }
          setStateKeyVal( "curPlay", newPlayObj)
        } else {
          let newPlayObj
          setStateKeyVal( "curPlay", newPlayObj)
        }
      }
    }
  }

  const onStopPlaying = () => {
    setStateKeyVal( "curPlay", undefined )
    setStateKeyVal( "curSerie", undefined )
    setStateKeyVal( "curEp", undefined )
  }

  const value = {
    state: {
      ...state,
      isPaused,
    },
    actions: {
      setState,
      setSelectedLanguage,
    }
  }

  return (
    <MediaPlayerContext.Provider value={value}>
      {props.children}
    </MediaPlayerContext.Provider>
  )
}

//viewLibrary,

export {MediaPlayerContext, MediaPlayerProvider}
