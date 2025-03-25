import { users, type User, type InsertUser, type LSAGGroup, type LSAGSignature } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // LSAG Group methods
  getGroup(groupId: string): Promise<LSAGGroup | undefined>;
  getAllGroups(): Promise<LSAGGroup[]>;
  createGroup(group: LSAGGroup): Promise<LSAGGroup>;
  updateGroup(group: LSAGGroup): Promise<LSAGGroup>;
  deleteGroup(groupId: string): Promise<boolean>;
  
  // LSAG Signature methods
  getSignature(signatureId: string): Promise<LSAGSignature | undefined>;
  getAllSignatures(): Promise<LSAGSignature[]>;
  getSignaturesByGroup(groupId: string): Promise<LSAGSignature[]>;
  createSignature(signature: LSAGSignature): Promise<LSAGSignature>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private groups: Map<string, LSAGGroup>;
  private signatures: Map<string, LSAGSignature>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.groups = new Map();
    this.signatures = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // LSAG Group methods
  async getGroup(groupId: string): Promise<LSAGGroup | undefined> {
    return this.groups.get(groupId);
  }
  
  async getAllGroups(): Promise<LSAGGroup[]> {
    return Array.from(this.groups.values());
  }
  
  async createGroup(group: LSAGGroup): Promise<LSAGGroup> {
    // Ensure the group has an ID
    const groupWithId = {
      ...group,
      id: group.id || crypto.randomUUID()
    };
    this.groups.set(groupWithId.id, groupWithId);
    return groupWithId;
  }
  
  async updateGroup(group: LSAGGroup): Promise<LSAGGroup> {
    if (!group.id) {
      throw new Error("Cannot update group without an ID");
    }
    this.groups.set(group.id, group);
    return group;
  }
  
  async deleteGroup(groupId: string): Promise<boolean> {
    return this.groups.delete(groupId);
  }
  
  // LSAG Signature methods
  async getSignature(signatureId: string): Promise<LSAGSignature | undefined> {
    return this.signatures.get(signatureId);
  }
  
  async getAllSignatures(): Promise<LSAGSignature[]> {
    return Array.from(this.signatures.values());
  }
  
  async getSignaturesByGroup(groupId: string): Promise<LSAGSignature[]> {
    return Array.from(this.signatures.values()).filter(
      (signature) => signature.groupId === groupId
    );
  }
  
  async createSignature(signature: LSAGSignature): Promise<LSAGSignature> {
    // We use the keyImage as the signature ID since it's unique
    this.signatures.set(signature.keyImage, signature);
    return signature;
  }
}

export const storage = new MemStorage();
