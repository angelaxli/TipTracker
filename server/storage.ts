import { tips, users, type User, type InsertUser, type Tip, type InsertTip, type TipSource } from "@shared/schema";

// Helper function to generate realistic waitress tip data over 4+ months
function generateWaitressTipsData(): Tip[] {
  const tips: Tip[] = [];
  const startDate = new Date('2024-11-23'); // Start from November 23, 2024
  const endDate = new Date('2025-03-23'); // End on current date (March 23, 2025)
  
  // Typical shift patterns for a waitress
  const shifts = [
    { name: "Breakfast", timeRange: "07:00-11:00", tipRange: [15, 40] },
    { name: "Lunch", timeRange: "11:30-15:00", tipRange: [20, 55] },
    { name: "Dinner", timeRange: "17:00-22:00", tipRange: [25, 70] },
    { name: "Weekend Brunch", timeRange: "09:00-14:00", tipRange: [30, 65] },
    { name: "Evening", timeRange: "18:00-23:00", tipRange: [35, 80] }
  ];
  
  // Payment source distributions
  const sources: TipSource[] = ["cash", "credit_card", "venmo", "other"];
  const sourceWeights = [0.4, 0.45, 0.1, 0.05]; // 40% cash, 45% credit card, 10% Venmo, 5% other
  
  // Generate work schedule - typical waitress might work 4-5 shifts per week
  const workDays: Record<string, boolean> = {
    "Monday": true,
    "Tuesday": false, // Day off
    "Wednesday": true,
    "Thursday": true,
    "Friday": true,
    "Saturday": true,
    "Sunday": false // Day off
  };
  
  // Seasonal variations - tips tend to be higher during holidays
  const holidays = [
    { date: '2024-12-24', multiplier: 1.4 }, // Christmas Eve
    { date: '2024-12-25', multiplier: 1.5 }, // Christmas
    { date: '2024-12-31', multiplier: 1.6 }, // New Year's Eve
    { date: '2025-01-01', multiplier: 1.5 }, // New Year's Day
    { date: '2025-02-14', multiplier: 1.3 }, // Valentine's Day
  ];
  
  let tipId = 1;
  let currentDate = new Date(startDate);
  
  // Loop through each day in the date range
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Check if this is a workday
    if (workDays[dayOfWeek]) {
      // Determine number of shifts for this day (1-2 usually)
      const numberOfShifts = Math.random() > 0.7 ? 2 : 1;
      
      // Randomly select shifts for the day without duplicates
      const dayShifts = [...shifts].sort(() => 0.5 - Math.random()).slice(0, numberOfShifts);
      
      // For each shift, generate tips
      for (const shift of dayShifts) {
        // Check if the current date is a holiday
        let holidayMultiplier = 1;
        const holidayMatch = holidays.find(h => h.date === currentDate.toISOString().split('T')[0]);
        if (holidayMatch) {
          holidayMultiplier = holidayMatch.multiplier;
        }
        
        // Generate base tip amount within shift's range
        const [min, max] = shift.tipRange;
        let tipAmount = min + Math.random() * (max - min);
        
        // Apply holiday multiplier
        tipAmount *= holidayMultiplier;
        
        // Apply weekend multiplier (weekends generally have better tips)
        if (dayOfWeek === 'Friday' || dayOfWeek === 'Saturday') {
          tipAmount *= 1.2;
        }
        
        // Add some weekly patterns (e.g., better tips at beginning of month when people get paid)
        if (currentDate.getDate() <= 5) {
          tipAmount *= 1.15;
        }
        
        // Add some randomness to make it realistic
        tipAmount *= 0.85 + Math.random() * 0.3;
        
        // Random time within the shift's timeRange
        const timeRangeParts = shift.timeRange.split('-');
        const startHour = parseInt(timeRangeParts[0].split(':')[0]);
        const endHour = parseInt(timeRangeParts[1].split(':')[0]);
        const randomHour = startHour + Math.floor(Math.random() * (endHour - startHour));
        const randomMinute = Math.floor(Math.random() * 60);
        
        // Create date object with the random time
        const shiftDate = new Date(currentDate);
        shiftDate.setHours(randomHour, randomMinute, 0, 0);
        
        // Select payment source based on weighted probabilities
        let sourceIndex = 0;
        const randomValue = Math.random();
        let cumulativeProbability = 0;
        
        for (let i = 0; i < sourceWeights.length; i++) {
          cumulativeProbability += sourceWeights[i];
          if (randomValue <= cumulativeProbability) {
            sourceIndex = i;
            break;
          }
        }
        
        // Create realistic notes
        let notes = `${shift.name} shift`;
        
        // Sometimes add more detailed notes
        if (Math.random() > 0.7) {
          const tableDetails = [
            "Table of 4",
            "Party of 6",
            "Regular customers",
            "Birthday celebration",
            "Business meeting",
            "Family dinner",
            "Tourist group",
            "Date night couple",
            "Large group",
            "VIP guests"
          ];
          
          notes += `, ${tableDetails[Math.floor(Math.random() * tableDetails.length)]}`;
        }
        
        // Add holiday mention if applicable
        if (holidayMatch) {
          notes += `, ${holidayMatch.date.includes('12-25') ? 'Christmas' : 
                         holidayMatch.date.includes('12-31') ? 'New Year\'s Eve' : 
                         holidayMatch.date.includes('01-01') ? 'New Year\'s Day' : 
                         holidayMatch.date.includes('02-14') ? 'Valentine\'s Day' : 
                         'Holiday'} special`;
        }
        
        // Add tip entry
        tips.push({
          id: tipId++,
          userId: 1, // Our waitress user
          amount: parseFloat(tipAmount.toFixed(2)),
          source: sources[sourceIndex],
          date: shiftDate.toISOString(),
          notes: notes
        });
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return tips;
}

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
    this.tipCurrentId = 500; // Start at 500 to accommodate all the generated data
    
    // Add demo user - a waitress at a restaurant
    this.users.set(1, {
      id: 1,
      username: "sarahw",
      email: "sarah@example.com",
      name: "Sarah Williams",
      password: "password",
      firebaseUid: null,
    });
    
    // Create 4+ months of sample tips for a waitress
    const sampleTips = generateWaitressTipsData();
    
    // Add sample tips to the tips map
    sampleTips.forEach((tip: Tip) => {
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
