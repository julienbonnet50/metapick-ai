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

## API Endpoints
- `POST /simulate_draft` – Returns top brawler recommendations based on input.  
- `POST /predict_winrate` – Returns estimated winrate of the game, based on input.  
- `GET /get_maps` – Fetches available maps.  
- `GET /get_brawlers` – Fetches brawler data.
- `GET /get_game_versions` – Fetches available versions of db, trained model, and state of ranked.    


## Contributing
Contributions are welcome! Feel free to submit issues or open pull requests.

## License
This project is licensed under the [MIT License](LICENSE).
