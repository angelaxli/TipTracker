import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name"),
  firebaseUid: text("firebase_uid").unique(),
});

export const tipSources = ["cash", "venmo", "credit_card", "other"] as const;

export const tips = pgTable("tips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: doublePrecision("amount").notNull(),
  source: text("source", { enum: tipSources }).notNull(),
  date: text("date").notNull(),
  notes: text("notes"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  firebaseUid: true,
});

export const insertTipSchema = createInsertSchema(tips).pick({
  userId: true,
  amount: true,
  source: true,
  date: true,

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  targetAmount: doublePrecision("target_amount").notNull(),
  period: text("period", { enum: ["daily", "weekly", "monthly"] }).notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type", { enum: ["streak", "milestone", "goal_complete"] }).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  earnedAt: timestamp("earned_at").notNull(),
});

export const insertGoalSchema = createInsertSchema(goals);
export const insertAchievementSchema = createInsertSchema(achievements);

export type Goal = typeof goals.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

  notes: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTip = z.infer<typeof insertTipSchema>;
export type Tip = typeof tips.$inferSelect;
export type TipSource = typeof tipSources[number];
