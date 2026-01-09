import random
import typing
import heapq

UNSAFE = -16
DANGER = 0
LENGTH_ADVANTAGE = 1
MIN_HP = 20

def info() -> typing.Dict:
    print("INFO")
    return {
        "apiversion": "1",
        "author": "",
        "color": "#FF0000",
        "head": "default",
        "tail": "default",
    }

def start(game_state: typing.Dict):
    print("GAME START")


def end(game_state: typing.Dict):
    print("GAME OVER\n")

def move(game_state: typing.Dict) -> typing.Dict:

    my_snake = game_state["you"]
    another_snake = game_state["board"]["snakes"][1]
    my_head = my_snake["body"][0]
    my_tail= my_snake["body"][-1]
    board_width = game_state["board"]["width"]
    board_height = game_state["board"]["height"]
    board = [[1 for _ in range(board_width)] for _ in range(board_height)]

    def set_value(coord, value):
        x, y = coord["x"], coord["y"]
        board[y][x] = value

    def get_value(coord):
        x, y = coord["x"], coord["y"]
        return board[y][x]

    def find_max_adjacent_coords(coord):
        x, y = coord["x"], coord["y"]
        neighbors = {
            "down": {"x": x, "y": y - 1} if y > 0 else None,
            "up": {"x": x, "y": y + 1} if y < board_height - 1 else None,
            "left": {"x": x - 1, "y": y} if x > 0 else None,
            "right": {"x": x + 1, "y": y} if x < board_width - 1 else None,
        }
        values = {
            direction: board[neighbor["y"]][neighbor["x"]]
            for direction, neighbor in neighbors.items()
            if neighbor is not None
        }
        max_value = max(values.values())
        max_coords = [
            neighbors[direction]
            for direction, value in values.items()
            if value == max_value
        ]
        return max_coords
    
    def Astar_path(start, goal):
        def heuristic(a, b):
            return abs(a["x"] - b["x"]) + abs(a["y"] - b["y"])
        open_list = []
        heapq.heappush(open_list, (0, (start["x"], start["y"])))
        came_from = {}
        g_score = { (start["x"], start["y"]): 0 }
        while open_list:
            _, current = heapq.heappop(open_list)
            current_dict = {"x": current[0], "y": current[1]}
            if current_dict == goal:
                path = []
                while current in came_from:
                    path.append({"x": current[0], "y": current[1]})
                    current = came_from[current]
                path.append(start)
                return path[::-1]
            neighbors = [
                (current[0] + 1, current[1]),
                (current[0] - 1, current[1]),
                (current[0], current[1] + 1),
                (current[0], current[1] - 1),
            ]
            for neighbor in neighbors:
                x, y = neighbor
                if 0 <= x < board_width and 0 <= y < board_height and board[y][x] > 0:
                    tentative_g_score = g_score[current] + 1
                    if neighbor not in g_score or tentative_g_score < g_score[neighbor]:
                        came_from[neighbor] = current
                        g_score[neighbor] = tentative_g_score
                        f_score = tentative_g_score + heuristic({"x": x, "y": y}, goal)
                        heapq.heappush(open_list, (f_score, neighbor))
        return None

    def find_relative_position(coord1, coord2):
        dx = coord2["x"] - coord1["x"]
        dy = coord2["y"] - coord1["y"]
        if dx == 0 and dy == -1:
            return "down"
        elif dx == 0 and dy == 1:
            return "up"
        elif dx == -1 and dy == 0:
            return "left"
        elif dx == 1 and dy == 0:
            return "right"

    def locate_nearest_to_coord1(coord1, coords):
        min_coord = None
        min_value = float('inf')
        for coord in coords:
            path = Astar_path(coord1, coord)
            if path is not None:
                value = len(path)
                if value < min_value:
                    min_value = value
                    min_coord = coord
        return min_coord
    
    def locate_farthest_to_coord1(coord1, coords):
        max_coord = None
        max_value = 0
        for coord in coords:
            path = Astar_path(coord1, coord)
            if path is not None:
                value = len(path)
                if value > max_value:
                    max_value = value
                    max_coord = coord
        return max_coord

    def calculate_region_size(coord):
        def is_valid(x, y):
            return 0 <= x < board_width and 0 <= y < board_height and board[y][x] > 0
        if not is_valid(coord["x"], coord["y"]):
            return 0
        stack = [(coord["x"], coord["y"])]
        visited = set()
        region_size = 0
        while stack:
            x, y = stack.pop()
            if (x, y) in visited:
                continue
            visited.add((x, y))
            region_size += 1
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if is_valid(nx, ny) and (nx, ny) not in visited:
                    stack.append((nx, ny))
        return region_size

    def add_adjacent_values(coord, value_function):
        x, y = coord["x"], coord["y"]
        if y > 0:
            board[y - 1][x] += value_function({"x": x, "y": y - 1})
        if y < board_height - 1:
            board[y + 1][x] += value_function({"x": x, "y": y + 1})
        if x > 0:
            board[y][x - 1] += value_function({"x": x - 1, "y": y})
        if x < board_width - 1:
            board[y][x + 1] += value_function({"x": x + 1, "y": y})

    def set_board():
        x, y = another_snake["head"]["x"], another_snake["head"]["y"]
        if y > 0:
            set_value({"x": x, "y": y - 1}, DANGER)
        if y < board_height - 1:
            set_value({"x": x, "y": y + 1}, DANGER)
        if x > 0:
            set_value({"x": x - 1, "y": y}, DANGER)
        if x < board_width - 1:
            set_value({"x": x + 1, "y": y}, DANGER)

        for y in range(1, board_height - 1):
            for x in range(1, board_width - 1):
                if board[y][x] > 0:
                    board[y][x] += 1


    for snake in game_state["board"]["snakes"]:
        for body in snake["body"][:-1]:
            set_value(body, UNSAFE)
    
    goal_location = None
    if my_snake["length"] - another_snake["length"] < LENGTH_ADVANTAGE:
        goal_location = locate_nearest_to_coord1(my_head, game_state["board"]["food"])

    else:
        goal_location = locate_nearest_to_coord1(my_head, find_max_adjacent_coords(another_snake["head"]))

    if goal_location is not None:
        print(f"Destination: {goal_location}")
        next_move = find_relative_position(my_head, Astar_path(my_head, goal_location)[1])

    else:
        add_adjacent_values(my_head, calculate_region_size)
        next_move = find_relative_position(my_head, random.choice(find_max_adjacent_coords(my_head)))

    print(f"MOVE {game_state['turn']}: {next_move}")
    return {"move": next_move}

if __name__ == "__main__":
    from server import run_server

    run_server({"info": info, "start": start, "move": move, "end": end})
    