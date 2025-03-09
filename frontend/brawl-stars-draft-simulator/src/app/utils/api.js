// Fetch Brawlers with caching
export const fetchBrawlers = async (BASE_URL) => {
  const response = await fetch(`${BASE_URL}/get_brawlers`, { cache: "force-cache", method: "GET" });
  return response.json();
};

// Fetch Maps with caching
export const fetchMaps = async (BASE_URL) => {
  const response = await fetch(`${BASE_URL}/get_maps`, { cache: "force-cache", method: "GET" });
  return response.json();
};

// Fetch Game Versions with caching
export const fetchGameVersions = async (BASE_URL) => {
  const response = await fetch(`${BASE_URL}/get_game_versions`, { cache: "force-cache", method: "GET" });
  return response.json();
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
