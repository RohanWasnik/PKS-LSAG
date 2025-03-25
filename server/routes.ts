import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import crypto from "crypto";
import { z } from "zod";
import { 
  generateKeyPair, 
  signMessage, 
  verifySignature, 
  generateLSAGSignature, 
  verifyLSAGSignature,
  areLSAGSignaturesLinked
} from "./crypto";
import { 
  lsagGroupSchema, 
  lsagSignatureSchema, 
  groupMemberSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  
  // Route to generate a key pair
  app.post("/api/crypto/generate-keys", async (req, res) => {
    try {
      const { publicKey, privateKey } = await generateKeyPair();
      res.json({ publicKey, privateKey });
    } catch (error) {
      res.status(500).json({ message: `Error generating keys: ${error}` });
    }
  });

  // Schema for signing message
  const signMessageSchema = z.object({
    message: z.string().min(1, "Message is required"),
    privateKey: z.string().min(1, "Private key is required"),
  });

  // Route to sign a message
  app.post("/api/crypto/sign", async (req, res) => {
    try {
      const { message, privateKey } = signMessageSchema.parse(req.body);
      const { signature, messageHash } = await signMessage(message, privateKey);
      
      res.json({
        signature,
        messageHash,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: `Error signing message: ${error}` });
    }
  });

  // Schema for verifying signature
  const verifySignatureSchema = z.object({
    message: z.string().min(1, "Message is required"),
    signature: z.string().min(1, "Signature is required"),
    publicKey: z.string().min(1, "Public key is required"),
  });

  // Route to verify a signature
  app.post("/api/crypto/verify", async (req, res) => {
    try {
      const { message, signature, publicKey } = verifySignatureSchema.parse(req.body);
      const valid = await verifySignature(message, signature, publicKey);
      
      res.json({ valid });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: `Error verifying signature: ${error}` });
    }
  });

  // LSAG Routes
  
  // Create a new group
  app.post("/api/lsag/groups", async (req, res) => {
    try {
      const parsedData = lsagGroupSchema.parse(req.body);
      
      // The storage layer will generate an ID if needed
      const savedGroup = await storage.createGroup(parsedData);
      res.json(savedGroup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: `Error creating group: ${error}` });
    }
  });
  
  // Get all groups
  app.get("/api/lsag/groups", async (req, res) => {
    try {
      const groups = await storage.getAllGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: `Error fetching groups: ${error}` });
    }
  });
  
  // Get a specific group
  app.get("/api/lsag/groups/:id", async (req, res) => {
    try {
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: `Error fetching group: ${error}` });
    }
  });
  
  // Update a group
  app.put("/api/lsag/groups/:id", async (req, res) => {
    try {
      const groupId = req.params.id;
      const existingGroup = await storage.getGroup(groupId);
      
      if (!existingGroup) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      const updatedGroup = lsagGroupSchema.parse({
        ...req.body,
        id: groupId // Ensure the ID matches the path parameter
      });
      
      const result = await storage.updateGroup(updatedGroup);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: `Error updating group: ${error}` });
    }
  });
  
  // Delete a group
  app.delete("/api/lsag/groups/:id", async (req, res) => {
    try {
      const success = await storage.deleteGroup(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: `Error deleting group: ${error}` });
    }
  });
  
  // Schema for generating LSAG signature
  const generateLSAGSignatureSchema = z.object({
    message: z.string().min(1, "Message is required"),
    privateKey: z.string().min(1, "Private key is required"),
    publicKey: z.string().min(1, "Public key is required"),
    groupId: z.string().min(1, "Group ID is required"),
    signerIndex: z.number().int().min(0, "Signer index must be a non-negative integer")
  });
  
  // Create LSAG signature
  app.post("/api/lsag/sign", async (req, res) => {
    try {
      const { message, privateKey, publicKey, groupId, signerIndex } = generateLSAGSignatureSchema.parse(req.body);
      
      // Get the group
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      // Verify that signerIndex is valid
      if (signerIndex >= group.members.length) {
        return res.status(400).json({ message: "Invalid signer index" });
      }
      
      // Verify that the public key matches the expected key at signerIndex
      if (group.members[signerIndex].publicKey !== publicKey) {
        return res.status(400).json({ message: "Public key doesn't match the key at signerIndex" });
      }
      
      // Generate the LSAG signature
      const signature = await generateLSAGSignature(
        message,
        privateKey,
        publicKey,
        group,
        signerIndex
      );
      
      // Store the signature
      await storage.createSignature(signature);
      
      res.json(signature);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: `Error generating LSAG signature: ${error}` });
    }
  });
  
  // Schema for verifying LSAG signature
  const verifyLSAGSignatureSchema = z.object({
    signature: lsagSignatureSchema,
    groupId: z.string().min(1, "Group ID is required")
  });
  
  // Verify LSAG signature
  app.post("/api/lsag/verify", async (req, res) => {
    try {
      const { signature, groupId } = verifyLSAGSignatureSchema.parse(req.body);
      
      // Get the group
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      // Verify the signature
      const valid = await verifyLSAGSignature(signature, group);
      
      res.json({ valid });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: `Error verifying LSAG signature: ${error}` });
    }
  });
  
  // Schema for checking linkability
  const checkLinkabilitySchema = z.object({
    signature1Id: z.string().min(1, "First signature ID is required"),
    signature2Id: z.string().min(1, "Second signature ID is required")
  });
  
  // Check if two signatures are linked (created by the same signer)
  app.post("/api/lsag/check-linkability", async (req, res) => {
    try {
      const { signature1Id, signature2Id } = checkLinkabilitySchema.parse(req.body);
      
      // Get both signatures
      const signature1 = await storage.getSignature(signature1Id);
      const signature2 = await storage.getSignature(signature2Id);
      
      if (!signature1 || !signature2) {
        return res.status(404).json({ message: "One or both signatures not found" });
      }
      
      // Check if they're linked
      const linked = areLSAGSignaturesLinked(signature1, signature2);
      
      res.json({ linked });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: `Error checking signature linkability: ${error}` });
    }
  });
  
  // Get all signatures
  app.get("/api/lsag/signatures", async (req, res) => {
    try {
      const signatures = await storage.getAllSignatures();
      res.json(signatures);
    } catch (error) {
      res.status(500).json({ message: `Error fetching signatures: ${error}` });
    }
  });
  
  // Get signatures for a specific group
  app.get("/api/lsag/signatures/group/:groupId", async (req, res) => {
    try {
      const signatures = await storage.getSignaturesByGroup(req.params.groupId);
      res.json(signatures);
    } catch (error) {
      res.status(500).json({ message: `Error fetching signatures: ${error}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
