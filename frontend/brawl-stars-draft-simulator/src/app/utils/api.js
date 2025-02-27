export const fetchBrawlers = async () => {
    const response = await fetch("http://127.0.0.1:5000/get_brawlers", { cache: "no-store" });
    return response.json();
  };
  
  export const fetchMaps = async () => {
    const response = await fetch("http://127.0.0.1:5000/get_maps", { cache: "no-store" });
    return response.json();
  };