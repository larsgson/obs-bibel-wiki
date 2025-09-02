import { serieNavLang, serieLang } from './dynamic-lang'
import { pad } from './obj-functions'
import i18n from "../constants/i18n";

const preNav = "./navIcons/"

export const getChIcon = (key,lev0,lev1,lev2,bookObj,ch) => {
  const navLang = serieNavLang(lev0)
  const curLang = serieLang(lev0)
  let checkIcon = "000-" + pad(lev1)
  if (lev2!=null) checkIcon = "00-" + pad(lev1) + lev2
  let imgSrc
  let title
  let subtitle
  let checkTitle
  const bk = (bookObj!=null)?bookObj.bk:null
  const johnVideoIcon = ((lev1==="7") && (lev2==="d") && (lev0.indexOf("audio-bible-bb-project-") === 0)) 
  const useJohnVideo = ((johnVideoIcon) && (langWithTimestampsSet.has(curLang)))
  if (bk!=null){ // level 3
// Book Icon - To Do - to be added in the future
//    imgSrc = preBook +getOsisIcon(bk) +".png"
    checkTitle = i18n.t(bk, { lng: navLang })
  } else {
    checkTitle = i18n.t(checkIcon, { lng: navLang })
  }
  imgSrc = preNav +checkIcon +".png"
  title = checkTitle
  if (bk==null){ // level 1 and 2
    const checkStr = checkIcon + "-descr"
    subtitle = i18n.t(checkStr, { lng: navLang })
    if (subtitle===checkStr) subtitle = ""
  } else if (ch==null){ // level 3
    const {beg,end} = bookObj
    if ((beg!=null)&&(end!=null)){
      subtitle = (beg===end) ? beg : beg + " - " + end
    }
    const choiceTitle = getChoiceTitle(bk,key+1,navLang)
    if (choiceTitle!=null) {
      title += " " + subtitle
      subtitle = choiceTitle
    }
  } else { // level 4
    // const bookTitle = t(bk, { lng: navLang })
    const checkRegEx = /^(\d+)|(\D+)/g // separate numbers and letters
    let bookTitle = bk
    const matchesList = [...bk.matchAll(checkRegEx)]
    if ((matchesList!=null)&&(matchesList.length>1)) {
      bookTitle = `${matchesList[0][0]} ${matchesList[1][0]}`
    }
    if (title !== `${bk}.${ch}`) {
      subtitle = `${bookTitle} ${ch}`
    }
  }
  if (useJohnVideo) {
    if (bk==null){ // level 1 and 2
      imgSrc = johnPicsLocationUrl+"/VB-John1v14.jpg"
    } else if (ch!=null) {
      imgSrc = johnImageID[ch]
    }
  }
  return {
    imgSrc,
    key,
    subtitle,
    title,
    isBookIcon: false
  }
}
