# Meta Pick AI

![Meta Pick AI demo](assets/metapick-ai.gif)

## Description
**Meta Pick AI** is a web-based assistant designed to help Brawl Stars players dominate ranked gameplay by **mastering the draft and understanding the meta**. Powered by a **Neural Network trained on millions of games**, the platform offers tailored recommendations and insights to boost your performance and decision-making.

> ✅ **Live now at:** [https://metapick-ai.vercel.app](https://metapick-ai.vercel.app)

---

## 🔑 Key Features

### 🧠 Draft Tool
Optimize your picks with our AI-powered **draft assistant**. Just select a map, enter ally/enemy picks and bans — and get the **top 10 brawlers** to pick instantly. The model considers synergies, counters, and map-specific stats.

### 📊 Stats Explorer
Curious how the AI was trained? Dive into our **Stats Tool** and explore the **raw training data** used to build the model — from pick rates to win rates, across maps and ranks. Perfect for data lovers and competitive players.

### 🧾 Tier List Page
Check out the **tier list** for every map and game mode. Quickly see which brawlers perform the best and stay up-to-date with the current meta.

### ⚙️ Upgrade Helper
Not sure who to power up next? The **Upgrade Helper** recommends the best brawlers to upgrade based on their current meta strength and versatility — so you get the most value from your resources.

---

## Tech Stack
- **Backend**: Gunicorn + Flask (Python), PyTorch (Neural Network for predictions)  
- **Frontend**: React, TailwindCSS, DaisyUI  
- **Database**: PostgreSQL  
- **Deployment**: Front-end with Vercel, Back-end with Render.

---

## Installation & Setup

### 1. Install backend dependencies:
```bash
pip install -r backend/requirements.txt
```

### 2. Run the Flask backend:
```bash
python backend/app.py
```

### 3. Install frontend dependencies:
```bash
cd frontend
npm install
npm run dev
```

### 4. Open the website in your browser.

## 📡 API Endpoints

### 🔍 Draft & Winrate
- `POST /simulate_draft`  
  → Returns the top 10 brawler recommendations based on current map, ally picks, enemy picks, bans, and available brawlers.

- `POST /predict_winrate`  
  → Predicts the estimated winrate based on team compositions and selected map.

---

### 🗺️ Game Data
- `GET /get_maps`  
  → Retrieves the list of all available maps supported by the model.

- `GET /get_brawlers`  
  → Returns detailed data for all brawlers (name, image URL, etc.).

- `GET /get_game_versions`  
  → Fetches the current versions of the database, model, and ranked state.

---

### 📈 Meta & Stats Tools
- `POST /tier_list`  
  → Returns a tier list of brawlers for a selected map.

- `POST /stats`  
  → Retrieves trained statistical data (pick/win rates, etc.) for a selected map.

---

### 🧾 Account Insights
- `POST /account`  
  → Fetches high-power brawlers from a player account (requires Brawl Stars tag).

- `POST /account-upgrade-helper`  
  → Suggests which brawlers to upgrade based on the current meta, cost-efficiency, and your account data.



## Contributing
Contributions are welcome! Feel free to submit issues or open pull requests.

## License
This project is licensed under the [MIT License](LICENSE).
