function getUpgradeHelperTutorials() { 
    return [
    {
      title: "Enter Your Tag",
      content: "Enter your Brawl Stars player tag to see upgrade recommendations. Your tag should have 5-10 characters and might start with #.",
      highlight: "account-input"
    },
    {
      title: "Top 5 Upgrades",
      content: "After analysis, you'll see your top 5 brawlers recommended for upgrades based on your account data.",
      highlight: "recommended-upgrades"
    },
    {
      title: "List of your brawler not upgraded",
      content: "List of all your brawlers not upgraded (doesn't have at least 1 gadget and 1 star power), sorted by AI score showing also costs to upgrade. Hypercharge (5k coins) is always included.",
      highlight: "all-brawlers"
    }
  ]; 
}

function getDraftToolTutorials() { 
    return [
    {
        title: "Choose a Map",
        content: "Select a map from the dropdown to get started.",
        highlight: "map-input"
        },
    {
      title: "Enter Your Tag",
      content: "Enter your Brawl Stars player tag to see best brawlers for the give map and draft according to YOUR account brawlers. Based on brawlers P10+.Your tag should have 9 characters and might start with #.",
      highlight: "account-input"
    },
    {
      title: "Brawler Grid",
      content: "Use left click to add brawler to your team, and right click to use to add brawler to the enemy team. You can also click again on any brawler according  to their team, to drop it from the team.",
      highlight: "brawler-grid"
    },
    {
      title: "Ban mode",
      content: "You can toggle the ban mode to start adding banned brawler to the current draft.",
      highlight: "ban-mode"
    },
    {
        title: "Top 10 brawmlers",
        content: "On your right will be shown the top 10 brawlers according to our AI prediction. Based on the maps, current teams compositions and bans.",
        highlight: "top-10-brawlers"
    },
    {
        title: "Predictions",
        content: "After the draft is complete, a prediction will be shown to estime your winrate.",
        highlight: "predict-winrate"
    }
  ]; 
}

export { getUpgradeHelperTutorials, getDraftToolTutorials };