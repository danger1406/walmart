SHELF_MAP = {
    'DELI': ['deli'],
    'BAKERY': ['bread', 'pastries', 'cakes'],
    'PRODUCE': ['eggs', 'apples', 'bananas'],
    'MEAT': ['chicken'],
    'SEAFOOD': ['seafood'],
    'GROCERY 1': ['pasta', 'soap'],
    'GROCERY 2': ['shampoo'],
    'BEVERAGES': ['beverages'],
    'SNACKS': ['snacks'],
    'DAIRY PRODUCTS 1': ['milk', 'cheese'],
    'DAIRY PRODUCTS 2': ['yogurt'],
    'FROZEN FOODS': ['frozen']
}

SUPPORTED_ITEMS = [
    'milk', 'cheese', 'yogurt', 'chicken', 'bread', 'pastries', 'cakes', 'pasta', 'soap',
    'shampoo', 'eggs', 'apples', 'bananas', 'snacks', 'beverages', 'deli', 'seafood', 'frozen'
]

SECTION_COORDS = {
    'DELI': [(1 + 4/2) * 30, (1 + 2/2) * 30],           # (90, 60)
    'BAKERY': [(5 + 4/2) * 30, (1 + 2/2) * 30],         # (210, 60)
    'PRODUCE': [(13 + 5/2) * 30, (1 + 5/2) * 30],       # (465, 105)
    'MEAT': [(1 + 4/2) * 30, (3 + 2/2) * 30],           # (90, 120)
    'SEAFOOD': [(5 + 4/2) * 30, (3 + 2/2) * 30],        # (210, 120)
    'GROCERY 1': [(1 + 4/2) * 30, (5 + 2/2) * 30],      # (90, 180)
    'GROCERY 2': [(5 + 4/2) * 30, (5 + 2/2) * 30],      # (210, 180)
    'BEVERAGES': [(1 + 4/2) * 30, (7 + 2/2) * 30],      # (90, 240)
    'SNACKS': [(5 + 4/2) * 30, (7 + 2/2) * 30],         # (210, 240)
    'DAIRY PRODUCTS 1': [12 * 30 + 15, 7 * 30 + 90],    # (375, 300)
    'DAIRY PRODUCTS 2': [16 * 30 + 15, 7 * 30 + 90],    # (495, 300)
    'FROZEN FOODS': [(12 + 7/2) * 30, (17 + 2/2) * 30]  # (465, 540)
}

ENTRANCE_COORDS = [0.5 * 30, 0.5 * 30]
EXIT_COORDS = [18.5 * 30, 19.5 * 30]

GRID_SIZE = 30
MAP_WIDTH = 19 * GRID_SIZE
MAP_HEIGHT = 20 * GRID_SIZE
GRID_COLS = 19
GRID_ROWS = 20

SHELVES = [
    {'label': 'DELI', 'x': 1, 'y': 1, 'w': 4, 'h': 2},
    {'label': 'BAKERY', 'x': 5, 'y': 1, 'w': 4, 'h': 2},
    {'label': 'PRODUCE', 'x': 13, 'y': 1, 'w': 5, 'h': 5},
    {'label': '', 'x': 18, 'y': 1, 'w': 1, 'h': 19},
    {'label': 'MEAT', 'x': 1, 'y': 3, 'w': 4, 'h': 2},
    {'label': 'SEAFOOD', 'x': 5, 'y': 3, 'w': 4, 'h': 2},
    {'label': 'GROCERY 1', 'x': 1, 'y': 5, 'w': 4, 'h': 2},
    {'label': 'GROCERY 2', 'x': 5, 'y': 5, 'w': 4, 'h': 2},
    {'label': 'BEVERAGES', 'x': 1, 'y': 7, 'w': 4, 'h': 2},
    {'label': 'SNACKS', 'x': 5, 'y': 7, 'w': 4, 'h': 2},
    {'label': 'DAIRY PRODUCTS 1', 'x': 12, 'y': 7, 'w': 1, 'h': 6},
    {'label': 'DAIRY PRODUCTS 2', 'x': 16, 'y': 7, 'w': 1, 'h': 6},
    {'label': '', 'x': 1, 'y': 11, 'w': 7, 'h': 1},
    {'label': '', 'x': 1, 'y': 12, 'w': 1, 'h': 4},
    {'label': '', 'x': 2, 'y': 15, 'w': 6, 'h': 1},
    {'label': '', 'x': 3, 'y': 17, 'w': 8, 'h': 1},
    {'label': 'FROZEN FOODS', 'x': 12, 'y': 17, 'w': 7, 'h': 2}
]

def is_obstacle_cell(col, row):
    for s in SHELVES:
        if col >= s['x'] and col < s['x'] + s['w'] and row >= s['y'] and row < s['y'] + s['h']:
            return True
    return False

def get_section_for_item(item_name):
    for section, items in SHELF_MAP.items():
        if item_name in items:
            return section
    return None

def get_item_location(item):
    for section, items in SHELF_MAP.items():
        if item in items:
            coords = SECTION_COORDS.get(section)
            return section, coords, True
    return None, None, False