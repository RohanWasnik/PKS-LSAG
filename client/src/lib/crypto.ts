import { apiRequest } from "./queryClient";
import { KeyPair, SignatureData } from "@/components/CryptographyApp";
import { 
  GroupMember, 
  LSAGGroup, 
  LSAGSignature 
} from "@shared/schema";

// Standard cryptographic operations
export async function generateKeyPair(): Promise<KeyPair> {
  const response = await apiRequest("POST", "/api/crypto/generate-keys", {});
  return response.json();
}

export async function signMessage(message: string, privateKey: string): Promise<SignatureData> {
  const response = await apiRequest("POST", "/api/crypto/sign", {
    message,
    privateKey,
  });
  return response.json();
}

export async function verifySignature(message: string, signature: string, publicKey: string): Promise<boolean> {
  const response = await apiRequest("POST", "/api/crypto/verify", {
    message,
    signature,
    publicKey,
  });
  const result = await response.json();
  return result.valid;
}

// LSAG Group operations
export async function createGroup(group: Omit<LSAGGroup, "id">): Promise<LSAGGroup> {
  const response = await apiRequest("POST", "/api/lsag/groups", group);
  return response.json();
}

export async function getGroups(): Promise<LSAGGroup[]> {
  const response = await apiRequest("GET", "/api/lsag/groups");
  return response.json();
}

export async function getGroup(groupId: string): Promise<LSAGGroup> {
  const response = await apiRequest("GET", `/api/lsag/groups/${groupId}`);
  return response.json();
}

export async function updateGroup(group: LSAGGroup): Promise<LSAGGroup> {
  const response = await apiRequest("PUT", `/api/lsag/groups/${group.id}`, group);
  return response.json();
}

export async function deleteGroup(groupId: string): Promise<{success: boolean}> {
  const response = await apiRequest("DELETE", `/api/lsag/groups/${groupId}`);
  return response.json();
}

// LSAG Signature operations
export async function generateLSAGSignature(
  message: string,
  privateKey: string,
  publicKey: string,
  groupId: string,
  signerIndex: number
): Promise<LSAGSignature> {
  const response = await apiRequest("POST", "/api/lsag/sign", {
    message,
    privateKey,
    publicKey,
    groupId,
    signerIndex
  });
  return response.json();
}

export async function verifyLSAGSignature(
  signature: LSAGSignature,
  groupId: string
): Promise<{valid: boolean}> {
  const response = await apiRequest("POST", "/api/lsag/verify", {
    signature,
    groupId
  });
  return response.json();
}

export async function checkSignaturesLinked(
  signature1Id: string,
  signature2Id: string
): Promise<{linked: boolean}> {
  const response = await apiRequest("POST", "/api/lsag/check-linkability", {
    signature1Id,
    signature2Id
  });
  return response.json();
}

export async function getSignatures(): Promise<LSAGSignature[]> {
  const response = await apiRequest("GET", "/api/lsag/signatures");
  return response.json();
}

export async function getGroupSignatures(groupId: string): Promise<LSAGSignature[]> {
  const response = await apiRequest("GET", `/api/lsag/signatures/group/${groupId}`);
  return response.json();
}
