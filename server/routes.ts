import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertTipSchema, insertUserSchema } from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup session
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "tip-tracker-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 },
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Setup passport
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Incorrect email." });
          }
          if (user.password !== password) {
            return done(null, false, { message: "Incorrect password." });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth middleware (disabled for demo)
  const isAuthenticated = (req: any, res: any, next: any) => {
    // Always allow access in demo mode
    return next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: err.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/current-user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  // Firebase auth route
  app.post("/api/auth/firebase", async (req, res) => {
    try {
      const { firebaseUid, email, name } = req.body;
      if (!firebaseUid || !email) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      let user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        // Create new user if not exists
        user = await storage.createUser({
          firebaseUid,
          email,
          username: email,
          name: name || "",
          password: "", // Firebase users don't need a password
        });
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to login" });
        }
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Demo user ID for demo mode
  const DEMO_USER_ID = 1;

  // Tips routes
  app.get("/api/tips", isAuthenticated, async (req, res) => {
    try {
      // Use demo user ID for demonstration
      const userId = DEMO_USER_ID;
      const tips = await storage.getTipsByUserId(userId);
      res.json(tips);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/tips/range", isAuthenticated, async (req, res) => {
    try {
      // Use demo user ID for demonstration
      const userId = DEMO_USER_ID;
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ message: "Missing start or end date" });
      }
      
      const startDate = new Date(start as string);
      const endDate = new Date(end as string);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const tips = await storage.getTipsByUserIdAndDateRange(userId, startDate, endDate);
      res.json(tips);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/tips", isAuthenticated, async (req, res) => {
    try {
      // Use demo user ID for demonstration
      const userId = DEMO_USER_ID;
      const { date, ...rest } = req.body;
      const tipData = insertTipSchema.parse({ 
        ...rest,
        userId,
        date: new Date(date).toISOString()
      });
      const tip = await storage.createTip(tipData);
      res.status(201).json(tip);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid tip data", errors: err.errors });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  app.put("/api/tips/:id", isAuthenticated, async (req, res) => {
    try {
      // Use demo user ID for demonstration
      const userId = DEMO_USER_ID;
      const tipId = parseInt(req.params.id);
      
      if (isNaN(tipId)) {
        return res.status(400).json({ message: "Invalid tip ID" });
      }
      
      const existingTip = await storage.getTip(tipId);
      if (!existingTip) {
        return res.status(404).json({ message: "Tip not found" });
      }
      
      // Skip authorization check in demo mode
      
      const tipUpdate = req.body;
      const updatedTip = await storage.updateTip(tipId, tipUpdate);
      res.json(updatedTip);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/tips/:id", isAuthenticated, async (req, res) => {
    try {
      // Use demo user ID for demonstration
      const userId = DEMO_USER_ID;
      const tipId = parseInt(req.params.id);
      
      if (isNaN(tipId)) {
        return res.status(400).json({ message: "Invalid tip ID" });
      }
      
      const existingTip = await storage.getTip(tipId);
      if (!existingTip) {
        return res.status(404).json({ message: "Tip not found" });
      }
      
      // Skip authorization check in demo mode
      
      await storage.deleteTip(tipId);
      res.json({ message: "Tip deleted" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  return httpServer;
}


  // Goal routes
  app.get("/api/goals", isAuthenticated, async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/goals", isAuthenticated, async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      const goalData = { ...req.body, userId };
      const goal = await storage.createGoal(goalData);
      res.status(201).json(goal);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Achievement routes
  app.get("/api/achievements", isAuthenticated, async (req, res) => {
    try {
      const userId = DEMO_USER_ID;
      const achievements = await storage.getAchievements(userId);
      res.json(achievements);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });
