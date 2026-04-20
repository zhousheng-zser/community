# -*- coding: utf-8 -*-
"""
生成交通流分析示例图（模拟数据，符合基本交通流关系）：
1. 不同交通流密度下的车辆通过数
2. 交通流整体速度图（不同车流密度下的平均速度）
3. 车辆纵、横向-时间轨迹图
4. 不同车流密度及队列规模下的换道时间变化

依赖: pip install matplotlib numpy
输出: 同目录下 figure_1~4.png
"""
from __future__ import annotations

import os

import numpy as np
import matplotlib.pyplot as plt
from matplotlib import rcParams

# 中文与负号
rcParams["font.sans-serif"] = ["SimHei", "Microsoft YaHei", "DejaVu Sans"]
rcParams["axes.unicode_minus"] = False

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# 黄褐色系图表背景（与技工端主色协调）
FIG_FACE = "#f5f0e8"
AX_FACE = "#faf6f0"


def _apply_chart_bg(fig, *axes):
    fig.patch.set_facecolor(FIG_FACE)
    for ax in axes:
        ax.set_facecolor(AX_FACE)


def fundamental_speed(density_km: np.ndarray, v_free: float = 80.0, k_jam: float = 150.0) -> np.ndarray:
    """Greenshields 线性速度-密度: v = v_free * (1 - k/k_jam)"""
    k = np.clip(density_km, 0, k_jam * 0.99)
    return v_free * (1.0 - k / k_jam)


def flow_rate(density_km: np.ndarray, v_free: float = 80.0, k_jam: float = 150.0) -> np.ndarray:
    """q = k * v(k) 辆/(km·h) 量级，再换算为观测窗通过数需乘路段长度与时间"""
    v = fundamental_speed(density_km, v_free, k_jam)
    return density_km * v  # 交通流率（示意）


def figure1_throughput_vs_density():
    """不同密度下的车辆通过数（固定观测路段与时间窗）"""
    densities = np.linspace(5, 120, 50)  # veh/km
    v_free, k_jam = 80.0, 150.0
    v = fundamental_speed(densities, v_free, k_jam)
    # 路段长 L km，时间 T h：通过数 N ≈ q * T * L / 平均车头时距简化 ≈ k * v * T * L / v = k * L * (常数) 实际用 q*T*L 比例
    L_km, T_h = 2.0, 1.0
    q = densities * v  # 与通过能力正相关
    throughput = q * T_h * L_km / 10.0  # 缩放为合理“辆/小时”量级展示
    throughput = throughput * (1.0 + 0.05 * np.random.randn(len(densities)))
    throughput = np.clip(throughput, 0, None)

    fig, ax = plt.subplots(figsize=(8, 5))
    _apply_chart_bg(fig, ax)
    ax.plot(densities, throughput, "b-", lw=2, label="通过车辆数（模拟）")
    ax.scatter(densities[::5], throughput[::5], c="steelblue", s=30, zorder=5)
    ax.set_xlabel("交通流密度 ρ (辆/km)")
    ax.set_ylabel("观测时段内通过车辆数 (辆)")
    ax.set_title("1. 不同交通流密度下的车辆通过数")
    ax.grid(True, alpha=0.3)
    ax.legend()
    fig.tight_layout()
    fig.savefig(
        os.path.join(OUT_DIR, "figure_1_throughput_vs_density.png"),
        dpi=150,
        facecolor=FIG_FACE,
        edgecolor="none",
    )
    plt.close(fig)


def figure2_speed_vs_density():
    """不同密度下的平均速度"""
    densities = np.linspace(0, 140, 100)
    v_free, k_jam = 80.0, 150.0
    v = fundamental_speed(densities, v_free, k_jam)
    v = np.maximum(v, 0)

    fig, ax = plt.subplots(figsize=(8, 5))
    _apply_chart_bg(fig, ax)
    ax.plot(densities, v, color="#c0392b", lw=2.5)
    ax.fill_between(densities, 0, v, alpha=0.15, color="#c0392b")
    ax.set_xlabel("交通流密度 ρ (辆/km)")
    ax.set_ylabel("空间平均速度 (km/h)")
    ax.set_title("2. 交通流整体速度图（不同车流密度下的平均速度）")
    ax.set_xlim(0, 140)
    ax.set_ylim(0, 85)
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(
        os.path.join(OUT_DIR, "figure_2_speed_vs_density.png"),
        dpi=150,
        facecolor=FIG_FACE,
        edgecolor="none",
    )
    plt.close(fig)


def figure3_trajectory_time():
    """单车纵、横向位置-时间轨迹（示意）"""
    t = np.linspace(0, 120, 600)  # s
    # 纵向：近似匀加速后匀速
    v0, a, t_acc = 0, 1.2, 25
    s_lon = np.where(
        t < t_acc,
        0.5 * a * t**2,
        0.5 * a * t_acc**2 + a * t_acc * (t - t_acc),
    )
    # 横向：一次换道（平滑 S 曲线）
    t_lc0, T_lc = 45.0, 12.0
    y_lat = 3.5 / (1 + np.exp(-(t - (t_lc0 + T_lc / 2)) / 2.0))  # 约 0~3.5m 车道宽

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(9, 6), sharex=True)
    _apply_chart_bg(fig, ax1, ax2)
    ax1.plot(t, s_lon, color="#2980b9", lw=2)
    ax1.set_ylabel("纵向位移 s (m)")
    ax1.set_title("3. 车辆纵、横向-时间轨迹图")
    ax1.grid(True, alpha=0.3)

    ax2.plot(t, y_lat, color="#27ae60", lw=2)
    ax2.set_xlabel("时间 t (s)")
    ax2.set_ylabel("横向位置 y (m)")
    ax2.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(
        os.path.join(OUT_DIR, "figure_3_long_lat_trajectory.png"),
        dpi=150,
        facecolor=FIG_FACE,
        edgecolor="none",
    )
    plt.close(fig)


def figure4_lane_change_time():
    """换道时间随密度与队列规模变化（模拟：单调增）"""
    densities = np.array([15, 30, 45, 60, 75, 90])
    queue_sizes = np.array([2, 4, 6, 8, 10])  # 辆

    T_base = 4.0  # s
    rho_ref, q_ref = 40.0, 5.0
    T = np.zeros((len(queue_sizes), len(densities)))
    for i, q in enumerate(queue_sizes):
        for j, rho in enumerate(densities):
            T[i, j] = T_base * (1 + 0.35 * (rho / rho_ref) ** 1.2) * (1 + 0.12 * q)

    fig, ax = plt.subplots(figsize=(8.5, 5.5))
    _apply_chart_bg(fig, ax)
    colors = plt.cm.viridis(np.linspace(0.2, 0.9, len(queue_sizes)))
    for i, q in enumerate(queue_sizes):
        ax.plot(densities, T[i, :], "o-", color=colors[i], lw=2, markersize=6, label=f"队列规模 {q} 辆")
    ax.set_xlabel("交通流密度 ρ (辆/km)")
    ax.set_ylabel("换道完成时间 (s)")
    ax.set_title("4. 不同车流密度及队列规模条件下的换道时间变化")
    ax.legend(loc="upper left", fontsize=9)
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(
        os.path.join(OUT_DIR, "figure_4_lane_change_time.png"),
        dpi=150,
        facecolor=FIG_FACE,
        edgecolor="none",
    )
    plt.close(fig)


def main():
    figure1_throughput_vs_density()
    figure2_speed_vs_density()
    figure3_trajectory_time()
    figure4_lane_change_time()
    print("已生成:")
    for name in [
        "figure_1_throughput_vs_density.png",
        "figure_2_speed_vs_density.png",
        "figure_3_long_lat_trajectory.png",
        "figure_4_lane_change_time.png",
    ]:
        print(" ", os.path.join(OUT_DIR, name))


if __name__ == "__main__":
    main()
