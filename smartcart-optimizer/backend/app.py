from flask import Flask, request, jsonify
from flask_cors import CORS
from genetic_optimizer import genetic_optimize
from store_data import SHELF_MAP, SECTION_COORDS, SUPPORTED_ITEMS, get_item_location
import math

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

@app.route('/api/sections', methods=['GET'])
def get_sections():
    sections = {}
    for section, items in SHELF_MAP.items():
        coords = SECTION_COORDS.get(section)
        sections[section] = {
            'items': items,
            'coordinates': coords
        }
    return jsonify({
        "sections": sections,
        "supported_items": SUPPORTED_ITEMS
    })

@app.route('/api/optimize', methods=['POST'])
def optimize_route():
    data = request.get_json()
    if not data or 'shopping_list' not in data:
        return jsonify({"error": "Missing shopping list"}), 400
    shopping_list = data['shopping_list']
    store_layout = data.get('store_layout', 'walmart_default')  # Default to 'walmart_default' if not provided
    # Optimize route
    try:
        route_items = shopping_list[:]
        best_route, best_distance, savings_percentage, full_path = genetic_optimize(route_items)
        optimized_route = []
        step = 1
        for item in best_route:
            section, coords, _ = get_item_location(item)
            optimized_route.append({
                "item": item,
                "section": section,
                "coordinates": coords,
                "step": step
            })
            step += 1
        # Directions
        directions = []
        for idx, stop in enumerate(optimized_route):
            if idx == 0:
                directions.append(f"Start at entrance, head to {stop['section']} for {stop['item']}")
            else:
                directions.append(f"Continue to {stop['section']} for {stop['item']}")
        if directions:
            directions[-1] += ", then proceed to checkout"
        estimated_time = math.ceil(best_distance / 1.2 / 60)
        return jsonify({
            "optimized_route": optimized_route,
            "total_distance": round(best_distance, 2),
            "estimated_time": estimated_time,
            "savings_percentage": round(savings_percentage, 2),
            "directions": directions,
            "full_path": full_path
        })
    except Exception as e:
        return jsonify({"error": f"Optimization failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)