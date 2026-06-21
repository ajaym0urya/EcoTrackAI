import { describe, it, expect } from "vitest";
import { InsightsEngine } from "../lib/services/insightsEngine";

describe("InsightsEngine - Personalized Feedback Logic", () => {
  it("gives a welcoming prompt when total emissions are zero", () => {
    const summary = {
      totalEmissions: 0,
      electricityEmissions: 0,
      gasEmissions: 0,
      waterEmissions: 0,
      billCount: 0,
    };
    
    const insights = InsightsEngine.generateInsights(summary);
    expect(insights).toHaveLength(1);
    expect(insights[0]).toContain("Welcome to EcoTrace");
  });

  it("triggers electricity conservation tips when power exceeds 45% threshold", () => {
    const summary = {
      totalEmissions: 100,
      electricityEmissions: 60, // 60% of total
      gasEmissions: 20,
      waterEmissions: 20,
      billCount: 3,
    };

    const insights = InsightsEngine.generateInsights(summary);
    expect(insights.some(i => i.includes("Electricity accounts for"))).toBe(true);
  });

  it("triggers gas saving tips when heating footprint exceeds 40%", () => {
    const summary = {
      totalEmissions: 100,
      electricityEmissions: 10,
      gasEmissions: 80, // 80% of total
      waterEmissions: 10,
      billCount: 2,
    };

    const insights = InsightsEngine.generateInsights(summary);
    expect(insights.some(i => i.includes("Natural Gas represents"))).toBe(true);
  });

  it("triggers water conservation prompts when water footprint exceeds 15%", () => {
    const summary = {
      totalEmissions: 100,
      electricityEmissions: 40,
      gasEmissions: 30,
      waterEmissions: 30, // 30% of total
      billCount: 4,
    };

    const insights = InsightsEngine.generateInsights(summary);
    expect(insights.some(i => i.includes("Water treatment carbon footprint"))).toBe(true);
  });
});
