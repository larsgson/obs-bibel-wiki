import { obsStoryList } from '../constants/obsHierarchy'
import { lang2to3letters } from '../constants/languages'

const bibleDataEnOBSStory = {
  freeType: false,
  curPath: "",
  title: "Open Bible Stories",
  description: "",
  image: {
      origin: "Local",
      filename: ""
  },
  language: "en",
  langID: "en",
  mediaType: "audio",
  episodeList: obsStoryList,
  uniqueID: "uW.OBS.en"
}

export const langVersion = {
  as: "irv", 
  bn: "irv", 
  en: "esv", 
  gu: "irv", 
  har: "hb", 
  hi: "irv", 
  kn: "irv", 
  ml: "irv", 
  mr: "irv", 
  ne: "ulb", 
  ory: "irv", 
  pu: "irv", 
  ta: "irv", 
  te: "irv", 
  ur: "irv", 
}

export const selectAudioBible = (lang) => 
lang === "en" 
  ? "en-audio-bible-WEB" 
  : lang === "es" 
  ? "es-audio-bible-WordProject" 
  : lang === "fr" 
  ? "fr-audio-bible-WordProject" 
  : lang === "hu" 
  ? "hu-audio-bible-WordProject" 
  : lang === "lu" 
  ? "lu-audio-bible-WordProject" 
  : lang === "ro" 
  ? "ro-audio-bible-WordProject" 
  : lang === "es" 
  ? "es-audio-bible-WordProject" 
  : lang === "de" 
  ? "de-audio-bible-ML"
  : `audio-bible-bb-project-${lang}` 

export const limitToNT = [ "xyz" ] // To Do - get this info from Bible Brain

export const navLangList = [ "en", "es"]

export const getSerie = (lang,serId) => {
  const checkObj = {
    "en-audio-OBS": bibleDataEnOBSStory,
  }
  const is3LetterLang = (lang.length > 2)
  const curLang = is3LetterLang ? lang : lang2to3letters[lang]
  if (checkObj[serId]) return checkObj[serId]
  else {
    const useVersion = langVersion[lang]
    const usePath = "https://vachan.sgp1.cdn.digitaloceanspaces.com/audio_bibles/"
    let curPath = ""
    if (useVersion) {
      curPath = `${usePath}${curLang}/${useVersion}/` 
    } else {
      curPath = `${usePath}${curLang}/`
    }
    const useLimitedList = limitToNT.includes(lang)
    const vachanServerType = (lang === "en")
    return {
      bibleBookList: useLimitedList ? newTestamentList : fullBibleList,
      vachanServerType,
      curPath,
      title: "Audio Bibel",
      uniqueID: `Vachan-${lang}`,
      description: "Public domain",
      language: lang,
      langID: lang,
      mediaType: "bible",
      image: {
        origin: "Local",
        filename: "pics/Bible_OT.png"
      }
    }
  }
}

export const serieLang = (id) => {
  const checkSpecialId = "audio-bible-bb-project-"
  if (id?.indexOf(checkSpecialId) === 0) {
    const curLangId = id.substring(checkSpecialId.length,id.length)
    return curLangId || "eng"
  } else {
    const checkObj = {
      "en-audio-OBS": "eng",
    }
    return checkObj[id] || "eng"
  }
}

export const serieNavLang = (id) => {
  const checkSpecialId = "audio-bible-bb-project-"
  if (id?.indexOf(checkSpecialId) === 0) {
    const curLangId = id.substring(checkSpecialId.length,id.length)
    const adaptLangObj = {
      "spa": "es",
      "eng": "en",
      "esp": "es",
      "por": "pt-br",
      "fra": "fr",
      "deu": "de",
      "ger": "de",
    }
    return adaptLangObj[curLangId] || "en"
  } else {
    const checkObj = {
      "en-audio-OBS": "en",
    }
    return checkObj[id] || "en"
  }
}

export const serieNaviType =(id) => {
  const checkObj = {
    "en-audio-OBS": "audioStories",
  }
  return checkObj[id] || "audioBible"
}
