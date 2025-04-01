// Utility function for caching
const cacheWithExpiry = async (cacheKey, url, ttl = 24 * 60 * 60 * 1000) => {  // Default TTL set to 1 day (24 hours)
  const cachedData = localStorage.getItem(cacheKey);
  const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);

  if (cachedData && cacheTimestamp && Date.now() - cacheTimestamp < ttl) {
    return JSON.parse(cachedData); // Return cached data if it's not expired
  }

  const response = await fetch(url);
  const data = await response.json();
  
  localStorage.setItem(cacheKey, JSON.stringify(data)); // Cache the new data
  localStorage.setItem(`${cacheKey}_timestamp`, Date.now()); // Update the timestamp

  return data;
};

// Fetch Brawlers with caching
export const fetchBrawlers = async (BASE_URL) => {
  const cacheKey = 'brawlersData';
  const url = `${BASE_URL}/get_brawlers`;
  return cacheWithExpiry(cacheKey, url);
};

// Fetch Maps with caching
export const fetchMaps = async (BASE_URL) => {
  const cacheKey = 'mapsData';
  const url = `${BASE_URL}/get_maps`;
  return cacheWithExpiry(cacheKey, url);
};

// Fetch Game Versions with caching
export const fetchGameVersions = async (BASE_URL) => {
  const cacheKey = 'gameVersionsData';
  const url = `${BASE_URL}/get_game_versions`;
  return cacheWithExpiry(cacheKey, url);
};

// Define the fetcher function to get the win rate prediction
export const fetchWinRate = async (teamA, teamB, selectedMap, BASE_URL) => {
  // Extract the names of the brawlers in each team
  const friends = teamA.map((brawler) => brawler.name);
  const enemies = teamB.map((brawler) => brawler.name);

  try {
    const response = await fetch(`${BASE_URL}/predict_winrate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        initial_team: friends,
        initial_opponent: enemies,
        map: selectedMap,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch win rate prediction");
    }

    return await response.json(); // Return the parsed JSON response (win rate prediction data)
  } catch (error) {
    console.error("Error in fetchWinRate:", error);
    throw error; // Propagate the error to be handled by SWR
  }
};
