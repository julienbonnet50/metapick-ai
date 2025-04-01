class BrawlerUpgrade:
    def __init__(self, name, current_power, gears, star_powers, gadgets):
        self.name = name
        self.current_power = current_power  # brawler's current power level (1 to 11)
        self.gears = gears
        self.star_powers = star_powers
        self.gadgets = gadgets
        # These arrays represent the cost to upgrade from:
        # Level 1->2 at index 0, 2->3 at index 1, ..., 10->11 at index 9.
        self.power_points_needed = [20, 35, 75, 140, 290, 480, 800, 1200, 890, 1440]
        self.coins_needed = [20, 50, 100, 180, 310, 520, 860, 1400, 1875, 2800]
        self.star_power_cost = 2000  # Cost per Star Power
        self.gadget_cost = 1000  # Cost per Gadget
        self.gear_cost_min = 1000  # Minimum cost for a Gear
        self.hc_cost_max = 5000

        # Totals
        self.total_power_points = 0
        self.total_coins = 0

    def calculate_upgrade_cost(self):
        # Use current_power - 1 to index correctly into the arrays.
        total_power_points = sum(self.power_points_needed[self.current_power - 1 :])
        total_coins = sum(self.coins_needed[self.current_power - 1 :])

        # Additional costs for missing Star Power, Gadget, and Gears.
        star_power_count = (
            1 if len(self.star_powers) < 1 else 0
        )  # Need 1 SP if missing.
        gadget_count = 1 if len(self.gadgets) < 1 else 0  # Need 1 Gadget if missing.
        gear_count = 2 - len(self.gears)  # Need a total of 2 gears.
        if len(self.gears) > 1:
            gear_count = 0

        total_coins += self.hc_cost_max
        total_coins += star_power_count * self.star_power_cost
        total_coins += gadget_count * self.gadget_cost
        # Use the average cost for a Gear.
        total_coins += gear_count * self.gear_cost_min

        self.total_power_points, self.total_coins = total_power_points, total_coins

    def print_upgrade_cost(self):
        total_power_points, total_coins = self.calculate_upgrade_cost()
        print(
            f"{self.name} (lvl. {self.current_power}) || Total Power Points: {total_power_points} ----- Total Coins: {total_coins:.2f}"
        )
