import random
import numpy as np
from deap import base, creator, tools, algorithms
import heapq
from store_data import get_item_location, SECTION_COORDS, ENTRANCE_COORDS, EXIT_COORDS

# Define fitness class for minimization (shorter route)
creator.create("FitnessMin", base.Fitness, weights=(-1.0,))
creator.create("Individual", list, fitness=creator.FitnessMin)

def create_individual(n):
    """Create a random permutation of n indices (for TSP individual)."""
    ind = list(range(n))
    random.shuffle(ind)
    return ind

def evalRoute(individual, distances, items_coords):
    total_distance = 0
    current = items_coords[0]  # Start at entrance
    print(f"evalRoute individual: {individual}, items_coords length: {len(items_coords)}")  # Debug
    for idx in individual:
        if idx >= len(items_coords):
            print(f"Invalid index in evalRoute: {idx}")  # Debug
            return float('inf')  # Penalize invalid routes
        next_pos = items_coords[idx]
        total_distance += np.sqrt((next_pos[0] - current[0])**2 + (next_pos[1] - current[1])**2)
        current = next_pos
    # Add distance from last item to exit
    total_distance += np.sqrt((current[0] - items_coords[-1][0])**2 + (current[1] - items_coords[-1][1])**2)
    return total_distance,

def evaluate_fitness(individual, items):
    assert len(individual) == len(items), f"Individual length {len(individual)} does not match items length {len(items)}"
    assert all(0 <= i < len(items) for i in individual), f"Individual index out of range: {individual} for items length {len(items)}"
    ordered_items = [items[i] for i in individual]
    return (calculate_route_distance(ordered_items)[0],)


def genetic_optimize(items):
    if not items:
        raise ValueError("Shopping list is empty.")
    invalid_items = [item for item in items if get_item_location(item)[1] is None]
    if invalid_items:
        raise ValueError(f"Items not found or not mapped to shelves: {', '.join(invalid_items)}")
    if len(items) == 1:
        best_route = items
        best_distance, full_path = calculate_route_distance(items)
        savings = 0.0
        return best_route, best_distance, savings, full_path
    try:
        item_count = len(items)
        pop_size = max(50, min(200, item_count * 10))  # Increased
        ngen = max(100, min(500, item_count * 20))     # Increased
        if not hasattr(creator, 'FitnessMin'):
            creator.create("FitnessMin", base.Fitness, weights=(-1.0,))
        if not hasattr(creator, 'Individual'):
            creator.create("Individual", list, fitness=creator.FitnessMin)
        toolbox = base.Toolbox()
        toolbox.register("indices", create_individual, item_count)
        toolbox.register("individual", tools.initIterate, creator.Individual, toolbox.indices)
        toolbox.register("population", tools.initRepeat, list, toolbox.individual)
        toolbox.register("evaluate", evaluate_fitness, items=items)
        toolbox.register("mate", tools.cxOrdered)
        toolbox.register("mutate", tools.mutShuffleIndexes, indpb=0.2)
        toolbox.register("select", tools.selTournament, tournsize=3)

        pop = toolbox.population(n=pop_size)
        hof = tools.HallOfFame(1)
        best_distance = float('inf')
        for gen in range(ngen):
            fitnesses = list(map(toolbox.evaluate, pop))
            for ind, fit in zip(pop, fitnesses):
                ind.fitness.values = fit
            offspring = toolbox.select(pop, len(pop))
            offspring = list(map(toolbox.clone, offspring))
            for child1, child2 in zip(offspring[::2], offspring[1::2]):
                if random.random() < 0.7:
                    toolbox.mate(child1, child2)
                    del child1.fitness.values
                    del child2.fitness.values
            for mutant in offspring:
                if random.random() < 0.2:
                    toolbox.mutate(mutant)
                    del mutant.fitness.values
            invalid_ind = [ind for ind in offspring if not ind.fitness.valid]
            fitnesses = map(toolbox.evaluate, invalid_ind)
            for ind, fit in zip(invalid_ind, fitnesses):
                ind.fitness.values = fit
            pop[:] = offspring
            hof.update(pop)
            # Removed early stopping: always run all generations
        best_ind = hof[0]
        best_route = [items[i] for i in best_ind]
        best_distance, full_path = calculate_route_distance(best_route)
        naive_distance, naive_path = calculate_route_distance(items)
        # Debug output
        print("Naive route:", items)
        print("Naive distance:", naive_distance)
        print("Optimized route:", best_route)
        print("Optimized distance:", best_distance)
        if naive_distance == 0 or naive_distance == float('inf'):
            savings = 0.0
        else:
            savings = max(0.0, (1 - best_distance / naive_distance) * 100)
        return best_route, best_distance, savings, full_path
    except AssertionError as e:
        raise RuntimeError(f"Genetic algorithm index error: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Route optimization failed: {str(e)}")

def calculate_route_distance(items):
    coords = [ENTRANCE_COORDS]
    for item in items:
        section, section_coords, found = get_item_location(item)
        if not found or section_coords is None:
            return float('inf'), []
        coords.append(section_coords)
    coords.append(EXIT_COORDS)
    total_distance = 0
    for i in range(1, len(coords)):
        dx = coords[i][0] - coords[i-1][0]
        dy = coords[i][1] - coords[i-1][1]
        total_distance += (dx ** 2 + dy ** 2) ** 0.5
    return total_distance, coords

if __name__ == "__main__":
    test_list = ["milk", "bread", "chicken"]
    result = genetic_optimize(test_list)
    print(result)