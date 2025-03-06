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
