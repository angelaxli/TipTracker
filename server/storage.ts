import { tips, users, type User, type InsertUser, type Tip, type InsertTip } from "@shared/schema";

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
    this.userCurrentId = 1;
    this.tipCurrentId = 1;
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
    
    const updatedTip = { ...existingTip, ...tipUpdate };
    this.tips.set(id, updatedTip);
    return updatedTip;
  }

  async deleteTip(id: number): Promise<boolean> {
    return this.tips.delete(id);
  }
}

export const storage = new MemStorage();
