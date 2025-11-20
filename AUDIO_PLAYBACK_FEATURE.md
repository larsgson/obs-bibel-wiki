# Episode-Based Audio Playback Feature

## Overview

This document describes the implementation of the episode-based audio playback feature for Open Bible Stories (OBS) with full audio support.

## Feature Description

When a language has `hasAudio: "full"` set in the language configuration, the application now:

1. **Parses markdown files into structured episodes** - Each story is divided into episodes, where each episode consists of an image URL and the text beneath it.

2. **Displays one episode at a time during playback** - Instead of showing the entire story markdown, only the current episode (image + text) is displayed based on the audio playback position.

3. **Automatically progresses through episodes** - As the audio plays, the display automatically advances through episodes, synchronized with the audio timeline.

## Implementation Details

### 1. Language Configuration (`src/constants/lang-info.js`)

Languages are configured with the `hasAudio` property:

```javascript
export default const langType = {
  eng: {
    hasAudio: "full",
    bibleText: "BSB"
  },
  deu: {
    obs: "none",
    hasAudio: "full",
    bibleText: "BSB"
  }
}
```

### 2. Data Structure

#### Episode Structure
Each story is parsed into the following structure:

```javascript
{
  title: "Story Title",
  episodes: [
    {
      imageUrl: "https://cdn.door43.org/obs/jpg/360px/obs-en-01-01.jpg",
      text: "The text content for this episode..."
    },
    // ... more episodes
  ]
}
```

#### State Management
- `verseText`: Contains the raw markdown for all stories
- `structuredStories`: Contains parsed episode data for languages with full audio support

### 3. Markdown Parsing (`src/context/media-player-context.jsx`)

The `parseMarkdownIntoEpisodes()` function:

1. Splits markdown by lines
2. Extracts the H1 title
3. Identifies image markdown patterns: `![...](url)`
4. Groups text following each image into an episode
5. Returns structured data with title and episodes array

### 4. Episode Display Logic (`src/components/obs-navigation.jsx`)

#### Episode Index Calculation

Instead of approximations, the system now uses **exact timing data** from JSON files:

```javascript
// Find the episode whose start time is closest to but not greater than currentPosition
let episodeIndex = 0;
for (let i = 0; i < timingData.length; i++) {
  const episodeStartTime = parseFloat(timingData[i].pos);
  if (currentPosition >= episodeStartTime) {
    episodeIndex = i;
  } else {
    break;
  }
}
```

Timing data is loaded from `/public/data/img_pos01.json` through `img_pos50.json`, where each file contains an array of objects:
- `pos`: Exact time in seconds (with milliseconds) when the episode should be displayed
- `img`: Episode identifier in format "XX-YY" (story-episode)

Example timing data:
```json
[
  {"pos": "0.000", "img": "01-01"},
  {"pos": "20.400", "img": "01-02"},
  {"pos": "44.360", "img": "01-03"}
]
```

#### Conditional Rendering
- **With full audio support**: Shows single episode synchronized with audio position
- **Without full audio support**: Shows complete markdown story (legacy behavior)

### 5. Audio Player (`src/components/audio-player.jsx`)

The audio player features a modern dark theme design:

- **Gradient background**: Deep blue-black gradient (#1a1a2e to #16213e)
- **Primary color**: Coral-red (#e94560) for play/pause and progress
- **Discreet volume control**: Dark grey design that blends into the theme
- **Responsive design**: Adapts to mobile and desktop viewports
- **Modern interactions**: Hover effects, smooth transitions, and shadows

### 6. Episode Progress Indicator

Below each episode, a caption displays:
```
Episode X of Y
```

This helps users track their position in the story.

## Technical Flow

1. **On language selection**: 
   - System fetches story markdown files
   - If `hasAudio === "full"`:
     - Markdown is parsed into episodes (image + text pairs)
     - Exact timing data is loaded from `/data/img_posXX.json` files
     - Both raw markdown, structured episodes, and timing data are cached

2. **On story navigation**:
   - User navigates to a specific story (level 3)
   - Audio file is loaded
   - If full audio support exists, episode view is initialized

3. **During playback**:
   - Audio position updates every 100ms
   - Current episode index is determined by looking up exact timing data
   - The system finds the most recent episode whose start time has been reached
   - Display updates to show the appropriate episode with precise timing
   - User can seek, and display will jump to the corresponding episode based on exact timestamps

4. **Audio player controls**:
   - Play/Pause: Controls audio playback
   - Stop: Stops audio and resets position
   - Progress slider: Seek to any position
   - Volume control: Adjust or mute audio

## Benefits

1. **Precise synchronization**: Exact timing data ensures perfect alignment between audio and visuals
2. **Better comprehension**: Users see relevant images synchronized with the audio narrative at exact moments
3. **Reduced cognitive load**: Focus on one episode at a time
4. **Improved mobile experience**: Less scrolling required
5. **Flexible**: Maintains backward compatibility for languages without full audio
6. **Professional quality**: Uses production-quality timing data, not approximations
7. **Scalable**: Works automatically for all 50 OBS stories with timing files

## File Changes

### Modified Files
- `src/context/media-player-context.jsx` - Added episode parsing and structured storage
- `src/components/obs-navigation.jsx` - Added episode-based display logic
- `src/components/audio-player.jsx` - Enhanced UI with dark theme

### Key Functions Added
- `parseMarkdownIntoEpisodes()` - Parses markdown into episode structure
- Episode timing data loader - Fetches JSON files with exact timestamps
- Exact episode index lookup - Uses timing data instead of approximations
- Conditional rendering based on audio support level

### Data Files Added
- `/public/data/img_pos01.json` through `img_pos50.json` - Exact episode timing data for all 50 stories

## Future Enhancements

Potential improvements for future versions:

1. **Episode thumbnails**: Show thumbnail previews of upcoming episodes
2. **Manual episode navigation**: Allow users to skip between episodes
3. **Episode bookmarks**: Save favorite episodes for quick access
4. **Transition animations**: Smooth fade-in/out between episodes
5. **Episode-level notes**: Add translation notes per episode
6. **Multi-language timing support**: Different timing files for different language audio tracks
7. **Visual timeline**: Show episode markers on the audio progress bar