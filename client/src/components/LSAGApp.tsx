import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  generateKeyPair, 
  createGroup, 
  getGroups, 
  generateLSAGSignature, 
  verifyLSAGSignature,
  getGroupSignatures,
  checkSignaturesLinked,
} from "@/lib/crypto";
import { 
  LSAGGroup, 
  LSAGSignature, 
  KeyPair, 
  GroupMember 
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function LSAGApp() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for key pairs and groups
  const [myKeyPair, setMyKeyPair] = useState<KeyPair | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<LSAGGroup | null>(null);
  const [message, setMessage] = useState<string>("This is an anonymous message from a group member.");
  const [signatures, setSignatures] = useState<LSAGSignature[]>([]);
  const [compareSignatures, setCompareSignatures] = useState<{
    signature1: string | null;
    signature2: string | null;
    result: boolean | null;
  }>({
    signature1: null,
    signature2: null,
    result: null
  });
  
  // State for creating a new group
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [memberKeyPairs, setMemberKeyPairs] = useState<KeyPair[]>([]);
  
  // Fetch groups
  const { 
    data: groups = [], 
    isLoading: isLoadingGroups 
  } = useQuery({ 
    queryKey: ['groups'],
    queryFn: getGroups
  });
  
  // Mutation for generating a key pair
  const generateKeyMutation = useMutation({
    mutationFn: generateKeyPair,
    onSuccess: (data) => {
      setMyKeyPair(data);
      toast({
        title: "Key pair generated",
        description: "Your public and private keys have been generated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate key pair: ${error}`,
        variant: "destructive"
      });
    }
  });
  
  // Mutation for generating a member key pair
  const generateMemberKeyMutation = useMutation({
    mutationFn: generateKeyPair,
    onSuccess: (data) => {
      const newMember: GroupMember = {
        id: `member-${groupMembers.length + 1}`,
        publicKey: data.publicKey
      };
      
      setGroupMembers([...groupMembers, newMember]);
      setMemberKeyPairs([...memberKeyPairs, data]);
      
      toast({
        title: "Member added",
        description: `New member with ID ${newMember.id} added to the group.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate member key: ${error}`,
        variant: "destructive"
      });
    }
  });
  
  // Mutation for creating a new group
  const createGroupMutation = useMutation({
    mutationFn: (group: Omit<LSAGGroup, "id">) => createGroup(group),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setSelectedGroup(data);
      setNewGroupName("");
      
      toast({
        title: "Group created",
        description: `Group "${data.name}" created successfully.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create group: ${error}`,
        variant: "destructive"
      });
    }
  });
  
  // Mutation for signing a message with LSAG
  const signMessageMutation = useMutation({
    mutationFn: async (params: {
      message: string;
      privateKey: string;
      publicKey: string;
      groupId: string;
      signerIndex: number;
    }) => {
      return generateLSAGSignature(
        params.message,
        params.privateKey,
        params.publicKey,
        params.groupId,
        params.signerIndex
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['signatures', data.groupId] });
      
      // Add the new signature to the list
      setSignatures((prev) => [...prev, data]);
      
      toast({
        title: "Message signed",
        description: "Your message has been signed anonymously."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to sign message: ${error}`,
        variant: "destructive"
      });
    }
  });
  
  // Mutation for verifying a signature
  const verifySignatureMutation = useMutation({
    mutationFn: (params: { signature: LSAGSignature; groupId: string }) => {
      return verifyLSAGSignature(params.signature, params.groupId);
    },
    onSuccess: (data, variables) => {
      toast({
        title: data.valid ? "Signature valid" : "Signature invalid",
        description: data.valid
          ? "The signature is valid. The message was signed by a group member."
          : "The signature is invalid. The message may have been tampered with or not signed by a group member."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to verify signature: ${error}`,
        variant: "destructive"
      });
    }
  });
  
  // Mutation for checking if signatures are linked
  const checkLinkabilityMutation = useMutation({
    mutationFn: async (params: { sig1: string; sig2: string }) => {
      return checkSignaturesLinked(params.sig1, params.sig2);
    },
    onSuccess: (data) => {
      setCompareSignatures(prev => ({ 
        ...prev, 
        result: data.linked 
      }));
      
      toast({
        title: data.linked ? "Signatures linked" : "Signatures not linked",
        description: data.linked
          ? "These signatures were created by the same person."
          : "These signatures were created by different people."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to check signature linkability: ${error}`,
        variant: "destructive"
      });
    }
  });
  
  // Fetch signatures when group changes
  useEffect(() => {
    if (selectedGroup && selectedGroup.id) {
      const fetchSignatures = async () => {
        try {
          const sigs = await getGroupSignatures(selectedGroup.id!);
          setSignatures(sigs);
        } catch (error) {
          console.error("Failed to fetch signatures:", error);
        }
      };
      
      fetchSignatures();
    } else {
      setSignatures([]);
    }
  }, [selectedGroup]);
  
  // Handle creating a new group
  const handleCreateGroup = () => {
    if (!newGroupName || groupMembers.length < 2) {
      toast({
        title: "Invalid group",
        description: "Group must have a name and at least 2 members.",
        variant: "destructive"
      });
      return;
    }
    
    createGroupMutation.mutate({
      name: newGroupName,
      members: groupMembers
    });
  };
  
  // Handle signing a message
  const handleSignMessage = () => {
    if (!myKeyPair || !selectedGroup || !message) {
      toast({
        title: "Cannot sign",
        description: "Please generate your keys, select a group, and enter a message.",
        variant: "destructive"
      });
      return;
    }
    
    // Find the index of our public key in the group
    const signerIndex = selectedGroup.members.findIndex(
      (member) => member.publicKey === myKeyPair.publicKey
    );
    
    if (signerIndex === -1) {
      toast({
        title: "Not a member",
        description: "You are not a member of this group. Your public key was not found in the group.",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedGroup.id) {
      toast({
        title: "Invalid group",
        description: "The selected group doesn't have a valid ID.",
        variant: "destructive"
      });
      return;
    }
    
    signMessageMutation.mutate({
      message,
      privateKey: myKeyPair.privateKey,
      publicKey: myKeyPair.publicKey,
      groupId: selectedGroup.id,
      signerIndex
    });
  };
  
  // Handle verifying a signature
  const handleVerifySignature = (signature: LSAGSignature) => {
    if (!selectedGroup) {
      toast({
        title: "No group selected",
        description: "Please select a group to verify the signature.",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedGroup.id) {
      toast({
        title: "Invalid group",
        description: "The selected group doesn't have a valid ID.",
        variant: "destructive"
      });
      return;
    }
    
    verifySignatureMutation.mutate({
      signature,
      groupId: selectedGroup.id
    });
  };
  
  // Handle checking linkability of two signatures
  const handleCheckLinkability = () => {
    if (!compareSignatures.signature1 || !compareSignatures.signature2) {
      toast({
        title: "Select signatures",
        description: "Please select two signatures to compare.",
        variant: "destructive"
      });
      return;
    }
    
    // The keyImage is used as the signature ID in the server
    checkLinkabilityMutation.mutate({
      sig1: compareSignatures.signature1,
      sig2: compareSignatures.signature2
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Linkable Spontaneous Anonymous Group Signatures (LSAG)
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Demonstrate how group members can sign messages anonymously 
            while protecting their identity, yet allowing to detect if the same 
            person signs multiple messages.
          </p>
        </div>
        
        <Tabs defaultValue="demo" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="demo">Use LSAG</TabsTrigger>
            <TabsTrigger value="setup">Group Setup</TabsTrigger>
            <TabsTrigger value="explanation">How It Works</TabsTrigger>
          </TabsList>
          
          {/* DEMO TAB - Use LSAG */}
          <TabsContent value="demo" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Keys and Message */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Identity</CardTitle>
                    <CardDescription>
                      Generate your key pair to participate in anonymous group signing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {myKeyPair ? (
                      <div className="space-y-4">
                        <div>
                          <Label>Your Public Key</Label>
                          <div className="bg-gray-100 p-3 rounded-md text-sm font-mono text-gray-700 mt-1 overflow-auto max-h-24">
                            {myKeyPair.publicKey.substring(0, 100)}...
                          </div>
                        </div>
                        <div>
                          <Label>Your Private Key (keep secret!)</Label>
                          <div className="bg-gray-100 p-3 rounded-md text-sm font-mono text-gray-700 mt-1 overflow-auto max-h-24">
                            {myKeyPair.privateKey.substring(0, 100)}...
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500 mb-4">No keys generated yet</p>
                        <Button 
                          onClick={() => generateKeyMutation.mutate()}
                          disabled={generateKeyMutation.isPending}
                        >
                          {generateKeyMutation.isPending ? "Generating..." : "Generate My Keys"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Select Group</CardTitle>
                    <CardDescription>
                      Choose a group you belong to for signing messages
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingGroups ? (
                      <p className="text-center py-4">Loading groups...</p>
                    ) : groups.length === 0 ? (
                      <p className="text-center py-4">No groups available. Create a group first.</p>
                    ) : (
                      <div className="space-y-4">
                        {groups.map((group) => (
                          <div 
                            key={group.id}
                            className={`p-4 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedGroup?.id === group.id ? "border-primary bg-primary/5" : "border-gray-200"
                            }`}
                            onClick={() => setSelectedGroup(group)}
                          >
                            <div className="flex justify-between items-center">
                              <h3 className="font-medium">{group.name}</h3>
                              <Badge>{group.members.length} members</Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Group ID: {group.id ? group.id.substring(0, 8) + '...' : 'Unknown'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Message to Sign</CardTitle>
                    <CardDescription>
                      Enter a message to sign anonymously with your group identity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter your message here..."
                      rows={3}
                      className="resize-none w-full"
                    />
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={handleSignMessage}
                      disabled={!myKeyPair || !selectedGroup || !message || signMessageMutation.isPending}
                      className="w-full"
                    >
                      {signMessageMutation.isPending ? "Signing..." : "Sign Anonymously with Group Identity"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              {/* Right Column - Signatures and Verification */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Group Signatures</CardTitle>
                    <CardDescription>
                      View and verify anonymous signatures from group members
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!selectedGroup ? (
                      <p className="text-center py-4">Select a group to view signatures</p>
                    ) : signatures.length === 0 ? (
                      <p className="text-center py-4">No signatures yet. Be the first to sign a message!</p>
                    ) : (
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                          {signatures.map((sig, index) => (
                            <div key={sig.keyImage} className="border rounded-md p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">Signature #{index + 1}</h4>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVerifySignature(sig)}
                                  disabled={verifySignatureMutation.isPending}
                                >
                                  Verify
                                </Button>
                              </div>
                              <p className="text-sm mb-2">
                                <span className="font-medium">Message:</span> {sig.message}
                              </p>
                              <p className="text-sm text-gray-500 break-all">
                                <span className="font-medium">Key Image:</span> {sig.keyImage.substring(0, 16)}...
                              </p>
                              <div className="mt-2 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setCompareSignatures(prev => ({
                                    ...prev,
                                    signature1: sig.keyImage
                                  }))}
                                >
                                  Select as #1
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setCompareSignatures(prev => ({
                                    ...prev,
                                    signature2: sig.keyImage
                                  }))}
                                >
                                  Select as #2
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Linkability Check</CardTitle>
                    <CardDescription>
                      Detect if two signatures were created by the same group member
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Signature #1</Label>
                          <div className="mt-1 p-2 border rounded-md text-sm text-gray-700 bg-gray-50">
                            {compareSignatures.signature1 ? 
                              `${compareSignatures.signature1.substring(0, 16)}...` : 
                              "Not selected"}
                          </div>
                        </div>
                        <div>
                          <Label>Signature #2</Label>
                          <div className="mt-1 p-2 border rounded-md text-sm text-gray-700 bg-gray-50">
                            {compareSignatures.signature2 ? 
                              `${compareSignatures.signature2.substring(0, 16)}...` : 
                              "Not selected"}
                          </div>
                        </div>
                      </div>
                      
                      {compareSignatures.result !== null && (
                        <div className={`p-3 rounded-md ${
                          compareSignatures.result ? "bg-yellow-50 border border-yellow-200" : "bg-green-50 border border-green-200"
                        }`}>
                          <p className={`text-sm font-medium ${
                            compareSignatures.result ? "text-yellow-800" : "text-green-800"
                          }`}>
                            {compareSignatures.result ? 
                              "✓ These signatures were created by the same person!" : 
                              "✓ These signatures were created by different people."}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={handleCheckLinkability}
                      disabled={!compareSignatures.signature1 || !compareSignatures.signature2 || checkLinkabilityMutation.isPending}
                      className="w-full"
                    >
                      {checkLinkabilityMutation.isPending ? "Checking..." : "Check if Same Signer"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* SETUP TAB - Group Creation */}
          <TabsContent value="setup" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Create a New Group</CardTitle>
                <CardDescription>
                  Set up a new group for anonymous signatures
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label>Group Members</Label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          if (myKeyPair) {
                            const newMember: GroupMember = {
                              id: `my-key-${Date.now()}`,
                              publicKey: myKeyPair.publicKey
                            };
                            setGroupMembers([...groupMembers, newMember]);
                            toast({
                              title: "My key added",
                              description: "Your personal key has been added to the group."
                            });
                          } else {
                            toast({
                              title: "No personal key",
                              description: "Please generate your personal key first.",
                              variant: "destructive"
                            });
                          }
                        }}
                        disabled={!myKeyPair}
                      >
                        Add My Key
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateMemberKeyMutation.mutate()}
                        disabled={generateMemberKeyMutation.isPending}
                      >
                        {generateMemberKeyMutation.isPending ? "Adding..." : "Add Random Member"}
                      </Button>
                    </div>
                  </div>
                  
                  {groupMembers.length === 0 ? (
                    <div className="text-center py-8 border rounded-md bg-gray-50">
                      <p className="text-gray-500">No members added yet. Add members to create a group.</p>
                      <p className="text-sm text-gray-400 mt-1">A group needs at least 2 members for anonymity.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupMembers.map((member, index) => (
                        <div key={member.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">Member {index + 1}</h4>
                            <Badge>{member.id}</Badge>
                          </div>
                          <div>
                            <Label>Public Key</Label>
                            <div className="bg-gray-100 p-2 rounded-md text-xs font-mono text-gray-700 mt-1 overflow-auto max-h-20">
                              {member.publicKey.substring(0, 60)}...
                            </div>
                          </div>
                          {memberKeyPairs[index] && (
                            <div className="mt-3">
                              <Label>Private Key (for demonstration only)</Label>
                              <div className="bg-gray-100 p-2 rounded-md text-xs font-mono text-gray-700 mt-1 overflow-auto max-h-20">
                                {memberKeyPairs[index].privateKey.substring(0, 60)}...
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName || groupMembers.length < 2 || createGroupMutation.isPending}
                  className="w-full"
                >
                  {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Existing Groups</CardTitle>
                <CardDescription>
                  View and manage your anonymous signature groups
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingGroups ? (
                  <p className="text-center py-4">Loading groups...</p>
                ) : groups.length === 0 ? (
                  <p className="text-center py-4">No groups created yet.</p>
                ) : (
                  <div className="space-y-4">
                    {groups.map((group) => (
                      <div key={group.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-lg">{group.name}</h3>
                          <Badge>{group.members.length} members</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                          Group ID: {group.id || 'Unknown'}
                        </p>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Members:</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {group.members.map((member) => (
                              <div key={member.id} className="bg-gray-50 p-2 rounded text-xs">
                                <span className="font-medium">{member.id}:</span>{" "}
                                {member.publicKey.substring(0, 16)}...
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* EXPLANATION TAB */}
          <TabsContent value="explanation" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Understanding Linkable Spontaneous Anonymous Group Signatures</CardTitle>
                <CardDescription>
                  Learn how LSAG provides both anonymity and accountability in group signing
                </CardDescription>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <h3>What is LSAG?</h3>
                <p>
                  Linkable Spontaneous Anonymous Group Signature (LSAG) is a cryptographic primitive that allows a member of a group to sign a message on behalf of the group without revealing their identity. The "linkable" property means that if the same person signs two different messages, it can be detected that both signatures came from the same signer.
                </p>
                
                <h3>Key Properties of LSAG</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-gray-900">Anonymity</h4>
                    <ul className="list-disc pl-6 space-y-1 text-gray-600">
                      <li>A verifier cannot determine which group member created the signature</li>
                      <li>The signer's identity is hidden among all group members</li>
                      <li>No trusted setup or central authority is required</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-gray-900">Linkability</h4>
                    <ul className="list-disc pl-6 space-y-1 text-gray-600">
                      <li>Each signer creates a unique "key image" derived from their private key</li>
                      <li>This key image is embedded in every signature they create</li>
                      <li>If the same person signs twice, their signatures will contain the same key image</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-gray-900">Spontaneity</h4>
                    <ul className="list-disc pl-6 space-y-1 text-gray-600">
                      <li>Any member can sign at any time without coordination</li>
                      <li>No interaction needed between group members</li>
                      <li>Group membership is defined by simply listing public keys</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-gray-900">Verifiability</h4>
                    <ul className="list-disc pl-6 space-y-1 text-gray-600">
                      <li>Anyone can verify that a signature came from a group member</li>
                      <li>No secret information is needed to verify signatures</li>
                      <li>The signature proves membership without revealing the signer</li>
                    </ul>
                  </div>
                </div>
                
                <h3 className="mt-6">Applications of LSAG</h3>
                <p>
                  LSAG signatures are powerful cryptographic tools with many real-world applications:
                </p>
                <ul>
                  <li><strong>Anonymous Voting</strong> - Members can vote without revealing their identity, but double-voting can be detected</li>
                  <li><strong>Whistleblowing</strong> - Prove you're a legitimate insider without revealing your identity</li>
                  <li><strong>Anonymous Credentials</strong> - Prove group membership for authentication without identification</li>
                  <li><strong>Private Transactions</strong> - Used in privacy-focused cryptocurrencies like Monero</li>
                </ul>
                
                <h3 className="mt-6">Technical Implementation</h3>
                <p>
                  The actual implementation of LSAG involves sophisticated mathematics based on elliptic curve cryptography. Our demonstration uses a simplified model for educational purposes, but preserves the core concepts and security properties of LSAG:
                </p>
                <ol>
                  <li>Each group member has a public-private key pair</li>
                  <li>The signer creates a ring of signatures including all group members</li>
                  <li>Only the signer uses their private key; for other members, random values are generated</li>
                  <li>The mathematical construction ensures the signature can only be created by a legitimate member</li>
                  <li>A key image is created that uniquely identifies the signer without revealing their identity</li>
                  <li>Verifiers check the mathematical relationships in the ring signature</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}