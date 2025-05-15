
import numpy as np
import matplotlib.pyplot as plt
import time

def brownian_motion_step(price, volatility, drift):
    random_change = np.random.choice([-volatility, volatility])
    return price * (1 + drift + random_change)

def simulate_and_plot(initial_price=100, days=100, volatility=0.01, drift=0.001):
    prices = [initial_price]

    plt.ion()
    fig, ax = plt.subplots(figsize=(10, 5))
    line, = ax.plot(prices, label="Stock Price")
    ax.set_title("Live Brownian Motion Stock Price Simulation")
    ax.set_xlabel("Days")
    ax.set_ylabel("Price")
    ax.grid(True)
    ax.legend()

    for day in range(1, days):
        new_price = brownian_motion_step(prices[-1], volatility, drift)
        prices.append(new_price)

        line.set_ydata(prices)
        line.set_xdata(range(len(prices)))
        ax.relim()
        ax.autoscale_view()

        plt.draw()
        plt.pause(0.01)
        time.sleep(5)

    plt.ioff()
    plt.show()

initial_price = float(input("Enter initial stock price (e.g., 100): "))
days = int(input("Enter number of days to simulate (e.g., 100): "))
volatility = float(input("Enter volatility (e.g., 0.01 for ±1%): "))
drift = float(input("Enter drift (e.g., 0.001 for 0.1% increase per day): "))

simulate_and_plot(initial_price, days, volatility, drift)
