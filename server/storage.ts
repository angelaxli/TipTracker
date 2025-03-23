import { tips, users, type User, type InsertUser, type Tip, type InsertTip } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Tip methods

  // Goal methods
  getGoals(userId: number): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Achievement methods
  getAchievements(userId: number): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;

  getTip(id: number): Promise<Tip | undefined>;
  getTipsByUserId(userId: number): Promise<Tip[]>;
  getTipsByUserIdAndDateRange(userId: number, startDate: Date, endDate: Date): Promise<Tip[]>;
  createTip(tip: InsertTip): Promise<Tip>;
  updateTip(id: number, tip: Partial<InsertTip>): Promise<Tip | undefined>;
  deleteTip(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tips: Map<number, Tip>;
  private userCurrentId: number;
  private tipCurrentId: number;

  constructor() {
    this.users = new Map();
    this.tips = new Map();
    this.userCurrentId = 2; // Start at 2 because we'll add demo user with ID 1
    this.tipCurrentId = 6; // Start at 6 because we'll add 5 sample tips
    
    // Add demo user
    this.users.set(1, {
      id: 1,
      username: "demo",
      email: "demo@example.com",
      name: "Demo User",
      password: "password",
      firebaseUid: null,
      createdAt: new Date(),
    });
    
    // Add sample tips
    const sampleTips = [
      {
        id: 1,
        userId: 1,
        amount: 24.50,
        source: "cash",
        date: new Date(2025, 2, 20), // March 20, 2025
        notes: "Lunch shift",
        createdAt: new Date()
      },
      {
        id: 2,
        userId: 1,
        amount: 35.75,
        source: "credit_card",
        date: new Date(2025, 2, 21), // March 21, 2025
        notes: "Dinner shift",
        createdAt: new Date()
      },
      {
        id: 3,
        userId: 1,
        amount: 18.25,
        source: "venmo",
        date: new Date(2025, 2, 22), // March 22, 2025
        notes: "Breakfast shift",
        createdAt: new Date()
      },
      {
        id: 4,
        userId: 1,
        amount: 42.00,
        source: "cash",
        date: new Date(2025, 2, 22), // March 22, 2025
        notes: "Evening shift",
        createdAt: new Date()
      },
      {
        id: 5,
        userId: 1,
        amount: 31.50,
        source: "credit_card",
        date: new Date(2025, 2, 23), // March 23, 2025
        notes: "Afternoon shift",
        createdAt: new Date()
      }
    ];
    
    // Add sample tips to the tips map
    sampleTips.forEach(tip => {
      this.tips.set(tip.id, tip);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      ...insertUser, 
      id,
      name: insertUser.name ?? null,
      firebaseUid: insertUser.firebaseUid ?? null 
    };
    this.users.set(id, user);
    return user;
  }

  // Tip methods
  async getTip(id: number): Promise<Tip | undefined> {
    return this.tips.get(id);
  }

  async getTipsByUserId(userId: number): Promise<Tip[]> {
    return Array.from(this.tips.values()).filter(
      (tip) => tip.userId === userId,
    );
  }

  async getTipsByUserIdAndDateRange(userId: number, startDate: Date, endDate: Date): Promise<Tip[]> {
    return Array.from(this.tips.values()).filter(
      (tip) => tip.userId === userId && 
               new Date(tip.date) >= startDate && 
               new Date(tip.date) <= endDate,
    );
  }

  async createTip(insertTip: InsertTip): Promise<Tip> {
    const id = this.tipCurrentId++;
    // Ensure date is properly set
    const currentDate = new Date();
    const tip: Tip = { 
      ...insertTip, 
      id,
      notes: insertTip.notes ?? null,
      date: insertTip.date ? insertTip.date : currentDate
    };
    this.tips.set(id, tip);
    return tip;
  }

  async updateTip(id: number, tipUpdate: Partial<InsertTip>): Promise<Tip | undefined> {
    const existingTip = this.tips.get(id);
    if (!existingTip) return undefined;

  // Goal methods
  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values()).filter(goal => goal.userId === userId);
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const id = this.goalCurrentId++;
    const newGoal = { ...goal, id };
    this.goals.set(id, newGoal);
    return newGoal;
  }

  async updateGoal(id: number, goalUpdate: Partial<InsertGoal>): Promise<Goal | undefined> {
    const existingGoal = this.goals.get(id);
    if (!existingGoal) return undefined;
    
    const updatedGoal = { ...existingGoal, ...goalUpdate };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }

  // Achievement methods
  async getAchievements(userId: number): Promise<Achievement[]> {
    return Array.from(this.achievements.values()).filter(
      achievement => achievement.userId === userId
    );
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const id = this.achievementCurrentId++;
    const newAchievement = { ...achievement, id };
    this.achievements.set(id, newAchievement);
    return newAchievement;
  }

    
    const updatedTip = { ...existingTip, ...tipUpdate };
    this.tips.set(id, updatedTip);
    return updatedTip;
  }

  async deleteTip(id: number): Promise<boolean> {
    return this.tips.delete(id);
  }
}

export const storage = new MemStorage();
