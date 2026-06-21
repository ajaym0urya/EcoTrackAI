interface FootprintSummary {
  totalEmissions: number;
  electricityEmissions: number;
  gasEmissions: number;
  waterEmissions: number;
}

export class InsightsEngine {
  /**
   * Evaluates the carbon metrics and generates dynamic personalized eco-insights.
   */
  static generateInsights(summary: FootprintSummary): string[] {
    const insights: string[] = [];

    if (summary.totalEmissions === 0) {
      return [
        "Welcome to EcoTrace AI! Upload your first utility bill above to generate personalized carbon footprint audit insights.",
      ];
    }

    const electricityPct = (summary.electricityEmissions / summary.totalEmissions) * 100;
    const gasPct = (summary.gasEmissions / summary.totalEmissions) * 100;
    const waterPct = (summary.waterEmissions / summary.totalEmissions) * 100;

    // 1. Threshold analysis
    if (electricityPct > 45) {
      insights.push(
        `Electricity accounts for ${Math.round(electricityPct)}% of your carbon footprint. Unplug standby appliances, transition to LED bulbs, and consider choosing a renewable energy plan to lower this.`
      );
    }
    if (gasPct > 40) {
      insights.push(
        `Natural Gas represents ${Math.round(gasPct)}% of your emissions. Consider reducing your thermostat by 1°C during winter months and washing clothes on cold-water cycles to shrink your thermal usage.`
      );
    }
    if (waterPct > 15) {
      insights.push(
        `Water treatment carbon footprint represents ${Math.round(waterPct)}% of your footprint. Inspect plumbing pipes for leaks, fit aerators on taps, and restrict daily showers to 5 minutes.`
      );
    }

    // 2. Aggregate volume analysis
    if (summary.totalEmissions > 500) {
      insights.push(
        "Your total logged emissions exceed 500 kg CO₂e. Commit to simple items in the Action Center to start avoiding carbon emissions."
      );
    } else if (summary.totalEmissions > 0 && insights.length === 0) {
      insights.push(
        "Great job! Your carbon footprint is relatively balanced. Check the Action Center for intermediate items to further decrease your baseline footprint."
      );
    }

    return insights;
  }
}
