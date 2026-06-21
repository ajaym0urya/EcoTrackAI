import { prisma } from "@/lib/prisma";

export interface UserActionWithAction {
  id: string;
  actionId: string;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  action: {
    id: string;
    title: string;
    description: string;
    utilityType: string;
    savings: number;
    difficulty: string;
  };
}

const SEED_ACTIONS = [
  {
    title: "Switch to LED Bulbs",
    description: "Replace incandescent lightbulbs with energy-efficient LEDs.",
    utilityType: "electricity",
    savings: 15.0,
    difficulty: "easy",
  },
  {
    title: "Optimize Thermostat Adjustments",
    description: "Lower heating by 1°C in winter and raise AC by 1°C in summer.",
    utilityType: "electricity",
    savings: 20.0,
    difficulty: "easy",
  },
  {
    title: "Cold-Water Laundry Cycles",
    description: "Wash clothes in cold water to eliminate heating energy costs.",
    utilityType: "gas",
    savings: 12.0,
    difficulty: "easy",
  },
  {
    title: "Trim Shower Times by 2 Minutes",
    description: "Conserve both hot water and water volume with shorter showers.",
    utilityType: "water",
    savings: 8.0,
    difficulty: "easy",
  },
  {
    title: "Line-dry Laundry Loads",
    description: "Hang-dry clothing on racks instead of using the tumble dryer.",
    utilityType: "electricity",
    savings: 30.0,
    difficulty: "medium",
  },
  {
    title: "Fix Leaky Household Faucets",
    description: "Repair dripping taps to conserve high volumes of wasted water.",
    utilityType: "water",
    savings: 5.0,
    difficulty: "easy",
  }
];

export class ActionRepository {
  /**
   * Returns all available actions, seeding them if they do not exist
   */
  static async getAllActions() {
    const count = await prisma.action.count();
    if (count === 0) {
      await prisma.action.createMany({
        data: SEED_ACTIONS,
      });
    }
    return prisma.action.findMany({
      orderBy: { title: "asc" },
    });
  }

  /**
   * Retrieves all committed or completed actions for the user
   */
  static async getUserActions(): Promise<UserActionWithAction[]> {
    return prisma.userAction.findMany({
      include: {
        action: true,
      },
      orderBy: { createdAt: "desc" },
    }) as unknown as Promise<UserActionWithAction[]>;
  }

  /**
   * Commits to a specific carbon reduction action
   */
  static async commitToAction(actionId: string) {
    // Check if already committed
    const existing = await prisma.userAction.findFirst({
      where: { actionId },
    });

    if (existing) {
      return existing;
    }

    return prisma.userAction.create({
      data: {
        actionId,
        status: "active",
      },
    });
  }

  /**
   * Toggles completion status of a committed action
   */
  static async toggleActionComplete(userActionId: string, isComplete: boolean) {
    return prisma.userAction.update({
      where: { id: userActionId },
      data: {
        status: isComplete ? "completed" : "active",
        completedAt: isComplete ? new Date() : null,
      },
    });
  }

  /**
   * Removes a user commitment to an action
   */
  static async deleteUserAction(userActionId: string) {
    return prisma.userAction.delete({
      where: { id: userActionId },
    });
  }

  /**
   * Sums total avoided carbon emissions from completed actions (kg CO2e)
   */
  static async getAvoidedEmissions(): Promise<number> {
    const completed = await prisma.userAction.findMany({
      where: { status: "completed" },
      include: { action: true },
    });

    const sum = completed.reduce((total, ua) => total + ua.action.savings, 0);
    return Math.round(sum * 100) / 100;
  }
}
