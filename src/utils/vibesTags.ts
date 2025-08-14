interface VibeTag {
  emoji: string;
  label: string;
  className: string;
}

const vibeTags: Record<string, VibeTag> = {
  strongEnergy: {
    emoji: "🏄‍♂️",
    label: "Strong neighborhood energy here",
    className: "bg-gradient-to-r from-ocean-blue/20 to-sunset-orange/20 text-ocean-blue border-ocean-blue/30"
  },
  hiddenGem: {
    emoji: "🐚",
    label: "Hidden gem",
    className: "bg-gradient-to-r from-coral/20 to-sunset-pink/20 text-coral border-coral/30"
  },
  communityFave: {
    emoji: "🌺",
    label: "Community fave",
    className: "bg-gradient-to-r from-sunset-orange/20 to-sunset-pink/20 text-sunset-orange border-sunset-orange/30"
  },
  peopleScoping: {
    emoji: "👀",
    label: "People are scoping this",
    className: "bg-gradient-to-r from-dune-tan/20 to-sage-green/20 text-dune-tan border-dune-tan/30"
  },
  chillVibes: {
    emoji: "🌫",
    label: "Chill vibes here",
    className: "bg-gradient-to-r from-sage-green/20 to-ocean-blue/20 text-sage-green border-sage-green/30"
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