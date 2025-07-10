# SmartCart Optimizer

AI-powered shopping route optimizer for Walmart stores. Uses a genetic algorithm to find the most efficient path for your grocery list, visualized on an interactive map.

## Demo
- [Live Demo](#) (add link after deployment)

## Features
- Add/remove items to your shopping list
- Optimizes route using DEAP genetic algorithm
- Interactive store map with animated route
- Real-time statistics and step-by-step directions
- Responsive, mobile-first design
- Error handling and loading states

## Tech Stack
- **Frontend:** HTML5, CSS3 (Glassmorphism, Animations), Vanilla JS, SVG
- **Backend:** Python, Flask, Flask-CORS, DEAP, NumPy
- **Deployment:** Heroku, Gunicorn

## Installation (Local Development)

### Backend
```bash
cd smartcart-optimizer/backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python app.py
```

### Frontend
Just open `frontend/index.html` in your browser (or serve with any static server).

## API Documentation

### POST `/api/optimize`
**Request:**
```
{
  "shopping_list": ["milk", "eggs", "bread", "headphones"],
  "store_layout": "walmart_default"
}
```
**Response:**
```
{
  "optimized_route": [
    {"item": "milk", "aisle": "1", "coordinates": [140, 150], "step": 1},
    ...
  ],
  "total_distance": 0.3,
  "estimated_time": 12,
  "savings_percentage": 70,
  "directions": [
    "Start at entrance, head to Dairy (Aisle 1) for milk",
    ...
  ]
}
```

### GET `/api/health`
Returns `{ "status": "ok" }` if backend is running.

## Deployment (Heroku)
- Set `PYTHONPATH=backend/`, `FLASK_ENV=production`, `PORT` (Heroku default)
- Use provided `Procfile`

## Roadmap
- [ ] Multi-store support
- [ ] User accounts & saved lists
- [ ] Real-time in-store navigation
- [ ] Voice assistant integration
- [ ] More store layouts

---
Made with ❤️ for Hackathon 