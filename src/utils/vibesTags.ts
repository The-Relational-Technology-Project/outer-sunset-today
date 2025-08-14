interface VibeTag {
  emoji: string;
  label: string;
  className: string;
}

const vibeTags: Record<string, VibeTag> = {
  strongEnergy: {
    emoji: "🏄‍♂️",
    label: "Strong neighborhood energy here",
    className: "bg-white text-ocean-blue border border-ocean-blue/20 shadow-sm"
  },
  hiddenGem: {
    emoji: "🐚",
    label: "Hidden gem",
    className: "bg-white text-coral border border-coral/20 shadow-sm"
  },
  communityFave: {
    emoji: "🌺",
    label: "Community fave",
    className: "bg-white text-sunset-orange border border-sunset-orange/20 shadow-sm"
  },
  peopleScoping: {
    emoji: "👀",
    label: "People are scoping this",
    className: "bg-white text-dune-tan border border-dune-tan/30 shadow-sm"
  },
  chillVibes: {
    emoji: "🌫",
    label: "Chill vibes here",
    className: "bg-white text-sage-green border border-sage-green/20 shadow-sm"
  }
};

export function getVibeTag(event: { 
  id: string; 
  category?: string; 
  isToday?: boolean; 
  title?: string; 
}): VibeTag {
  // Simple algorithm to assign vibe tags based on event characteristics
  // In a real implementation, this would consider user engagement data
  
  const eventHash = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const tagKeys = Object.keys(vibeTags);
  
  // Give recurring-sounding events more chance to be community faves
  if (event.title?.toLowerCase().includes('friday') || 
      event.title?.toLowerCase().includes('saturday') ||
      event.title?.toLowerCase().includes('monthly')) {
    return Math.random() > 0.4 ? vibeTags.communityFave : vibeTags.strongEnergy;
  }
  
  // Give today's events more energy
  if (event.isToday) {
    return Math.random() > 0.3 ? vibeTags.strongEnergy : vibeTags.peopleScoping;
  }
  
  // Distribute other events across remaining tags
  const selectedKey = tagKeys[eventHash % tagKeys.length];
  return vibeTags[selectedKey];
}

export { vibeTags };