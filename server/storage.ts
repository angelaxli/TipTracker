import { tips, users, type User, type InsertUser, type Tip, type InsertTip, type TipSource } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Tip methods
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
    });
    
    // Add sample tips
    const sampleTips = [
      {
        id: 1,
        userId: 1,
        amount: 24.50,
        source: "cash" as TipSource,
        date: "2025-03-20T12:00:00.000Z", // March 20, 2025
        notes: "Lunch shift"
      },
      {
        id: 2,
        userId: 1,
        amount: 35.75,
        source: "credit_card" as TipSource,
        date: "2025-03-21T18:30:00.000Z", // March 21, 2025
        notes: "Dinner shift"
      },
      {
        id: 3,
        userId: 1,
        amount: 18.25,
        source: "venmo" as TipSource,
        date: "2025-03-22T09:15:00.000Z", // March 22, 2025
        notes: "Breakfast shift"
      },
      {
        id: 4,
        userId: 1,
        amount: 42.00,
        source: "cash" as TipSource,
        date: "2025-03-22T20:00:00.000Z", // March 22, 2025
        notes: "Evening shift"
      },
      {
        id: 5,
        userId: 1,
        amount: 31.50,
        source: "credit_card" as TipSource,
        date: "2025-03-23T14:45:00.000Z", // March 23, 2025
        notes: "Afternoon shift"
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
    // Ensure date is properly set and stored as string
    const currentDate = new Date();
    // Handle date as string for consistency
    const formattedDate = insertTip.date || currentDate.toISOString();
      
    const tip: Tip = { 
      ...insertTip, 
      id,
      notes: insertTip.notes ?? null,
      date: formattedDate,
      source: insertTip.source as TipSource
    };
    this.tips.set(id, tip);
    return tip;
  }

  async updateTip(id: number, tipUpdate: Partial<InsertTip>): Promise<Tip | undefined> {
    const existingTip = this.tips.get(id);
    if (!existingTip) return undefined;
    
    const updatedTip = { 
      ...existingTip, 
      ...tipUpdate,
      source: tipUpdate.source as TipSource || existingTip.source,
      notes: tipUpdate.notes !== undefined ? tipUpdate.notes : existingTip.notes
    };
    this.tips.set(id, updatedTip);
    return updatedTip;
  }

  async deleteTip(id: number): Promise<boolean> {
    return this.tips.delete(id);
  }
}

export const storage = new MemStorage();
