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
  notes: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTip = z.infer<typeof insertTipSchema>;
export type Tip = typeof tips.$inferSelect;
export type TipSource = typeof tipSources[number];
