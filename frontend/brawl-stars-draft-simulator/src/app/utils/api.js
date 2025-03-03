export const fetchBrawlers = async (BASE_URL) => {
    const response = await fetch(`${BASE_URL}/get_brawlers`, { cache: "no-store" });
    return response.json();
  };
  
  export const fetchMaps = async (BASE_URL) => {
    const response = await fetch(`${BASE_URL}/get_maps`, { cache: "no-store" });
    return response.json();
  };

  export const fetchGameVersions = async (BASE_URL) => {
    const response = await fetch(`${BASE_URL}/get_game_versions`, { cache: "no-store" });
    return response.json();
  };