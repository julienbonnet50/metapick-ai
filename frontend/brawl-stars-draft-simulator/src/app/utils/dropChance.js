function getDropChances() {
    return [
      {
        rarity: 'Rare',
        chance: 0.50, // 50% chance
        rewards: [
          { item: '50 Coins', probability: 0.419 },
          { item: '25 Power Points', probability: 0.326 },
          { item: '100 XP Doublers', probability: 0.209 },
          { item: '20 Bling', probability: 0.023 },
          { item: '10 Credits', probability: 0.023 },
        ],
      },
      {
        rarity: 'Super Rare',
        chance: 0.28, // 28% chance
        rewards: [
          { item: '100 Coins', probability: 0.4238 },
          { item: '50 Power Points', probability: 0.3311 },
          { item: '30 Credits', probability: 0.0331 },
          { item: '50 Bling', probability: 0.0331 },
          { item: 'Random Common Pin', probability: 0.0331 },
          { item: 'Random Spray', probability: 0.0132 },
          { item: 'XP Doubler', probability: 0.1325 },
        ],
      },
      {
        rarity: 'Epic',
        chance: 0.15, // 15% chance
        rewards: [
          { item: '200 Coins', probability: 0.2105 },
          { item: '100 Power Points', probability: 0.2105 },
          { item: 'Random Rare Skin', probability: 0.0526 },
          { item: 'Random Rare Brawler', probability: 0.0526 },
          { item: 'Random Common Pin', probability: 0.1579 },
          { item: 'Random Rare Pin', probability: 0.0526 },
          { item: 'Random Spray', probability: 0.1579 },
        ],
      },
      {
        rarity: 'Mythic',
        chance: 0.05, // 5% chance
        rewards: [
          { item: '500 Coins', probability: 0.0949 },
          { item: '200 Power Points', probability: 0.1899 },
          { item: 'Random Gadget', probability: 0.1582 },
          { item: 'Random Rare Skin', probability: 0.1582 },
          { item: 'Random Super Rare Brawler', probability: 0.0949 },
          { item: 'Random Epic Brawler', probability: 0.0633 },
          { item: 'Random Mythic Brawler', probability: 0.019 },
          { item: 'Random Common Pin', probability: 0.1579 },
          { item: 'Random Rare Pin', probability: 0.0633 },
          { item: 'Random Epic Pin', probability: 0.0316 },
          { item: 'Random Spray', probability: 0.0633 },
          { item: 'Random Profile Picture', probability: 0.0633 },
        ],
      },
      {
        rarity: 'Legendary',
        chance: 0.02, // 2% chance
        rewards: [
          { item: 'Random Star Power', probability: 0.2717 },
          { item: 'Random Hypercharge', probability: 0.1630 },
          { item: 'Random Epic Skin', probability: 0.0217 },
          { item: 'Random Super Rare Skin', probability: 0.3587 },
          { item: 'Random Epic Brawler', probability: 0.1087 },
          { item: 'Random Mythic Brawler', probability: 0.0543 },
          { item: 'Random Legendary Brawler', probability: 0.0217 },
        ],
      },
    ];
  }

  function getRarityColor() {
    const rarityColors = {
      Rare: {
        color: '#5eb6e6',
        borderColor: '#7dc9f9',
        bgColor: '#e6f4ff',
        glowColor: 'rgba(94, 182, 230, 0.5)'
      },
      'Super Rare': {
        color: '#65bb5c',
        borderColor: '#7fd975',
        bgColor: '#e6ffe6',
        glowColor: 'rgba(101, 187, 92, 0.5)'
      },
      Epic: {
        color: '#c13bf3',
        borderColor: '#d968ff',
        bgColor: '#f9e6ff',
        glowColor: 'rgba(193, 59, 243, 0.5)'
      },
      Mythic: {
        color: '#fe5e72',
        borderColor: '#ff8c9a',
        bgColor: '#ffe6ea',
        glowColor: 'rgba(254, 94, 114, 0.5)'
      },
      Legendary: {
        color: '#fff12c',
        borderColor: '#ffff9a',
        bgColor: '#ffffcc',
        glowColor: 'rgba(255, 241, 44, 0.8)'
      },
      Error: {
        color: '#ff0000',
        borderColor: '#ff6666',
        bgColor: '#ffcccc',
        glowColor: 'rgba(255, 0, 0, 0.5)'
      }
    };
    return rarityColors;
  }


  function getItemImage(item) {
    const itemMap = {
      "50 Coins": "coin.png",
      "25 Power Points": "power_points.png",
      "100 XP Doublers": "xp_doubler.png",
      "20 Bling": "blings.png",
      "10 Credits": "credits.png",
      "100 Coins": "coin.png",
      "50 Power Points": "power_points.png",
      "30 Credits": "credits.png",
      "50 Bling": "blings.png",
      "Random Common Pin": "pin.png",
      "Random Spray": "spray.png",
      "XP Doubler": "xp_doubler.png",
      "200 Coins": "coin.png",
      "100 Power Points": "power_points.png",
      "Random Rare Skin": "rare_skin.png",
      "Random Rare Brawler": "rare_brawler.png",
      "Random Common Pin": "pin.png",
      "Random Rare Pin": "pin.png",
      "Random Spray": "spray.png",
      "500 Coins": "coin.png",
      "200 Power Points": "power_points.png",
      "Random Gadget": "gadget.png",
      "Random Rare Skin": "rare_skin.png",
      "Random Super Rare Brawler": "rare_brawler.png",
      "Random Epic Brawler": "epic_brawler.png",
      "Random Mythic Brawler": "mythic_brawler.png",
      "Random Common Pin": "pin.png",
      "Random Rare Pin": "pin.png",
      "Random Epic Pin": "pin.png",
      "Random Spray": "spray.png",
      "Random Profile Picture": "profil_icon.png",
      "Random Star Power": "star_power.png",
      "Random Hypercharge": "hypercharge.png",
      "Random Epic Skin": "epic_skin.png",
      "Random Super Rare Skin": "rare_skin.png",
      "Random Epic Brawler": "epic_brawler.png",
      "Random Mythic Brawler": "mythic_brawler.png",
      "Random Legendary Brawler": "legendary_brawler.png"
    };
  
    return itemMap[item] || "notfound.png";
  }

  // Generate a unique ID for each drop
  function generateUniqueId () {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };
  
  
  export { getDropChances, getItemImage, generateUniqueId, getRarityColor };
  