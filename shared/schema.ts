import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// LSAG specific types
export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface GroupMember {
  id: string;
  publicKey: string;
}

export interface LSAGGroup {
  id?: string;
  name: string;
  members: GroupMember[];
}

export interface LSAGSignature {
  ringSignature: string[];
  challenge: string;
  keyImage: string;
  message: string;
  groupId: string;
}

// Schemas for LSAG operations
export const groupMemberSchema = z.object({
  id: z.string(),
  publicKey: z.string()
});

export const lsagGroupSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  members: z.array(groupMemberSchema)
});

export const lsagSignatureSchema = z.object({
  ringSignature: z.array(z.string()),
  challenge: z.string(),
  keyImage: z.string(),
  message: z.string(),
  groupId: z.string()
});

// No need for database schema for this application as we're using in-memory operations
// for cryptographic functions, but we're keeping the users table for authentication if needed later
