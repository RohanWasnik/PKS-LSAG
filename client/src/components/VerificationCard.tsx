import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, PenTool, AlertCircle, Edit } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { KeyPair, SignatureData } from "./CryptographyApp";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface VerificationCardProps {
  keyPair: KeyPair | null;
  message: string;
  signatureData: SignatureData | null;
  verificationResult: boolean | null;
  setVerificationResult: (result: boolean) => void;
  tampered: boolean;
  onTamperMessage: () => void;
}

export default function VerificationCard({ 
  keyPair, 
  message, 
  signatureData, 
  verificationResult, 
  setVerificationResult,
  tampered,
  onTamperMessage
}: VerificationCardProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [showEditMessage, setShowEditMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("message");
  const { toast } = useToast();

  // Function to highlight differences between original and tampered message
  const highlightDifferences = (original: string, modified: string): JSX.Element => {
    if (!original || !modified) return <span>{modified}</span>;
    
    // Simple character-by-character comparison
    const result: JSX.Element[] = [];
    const maxLength = Math.max(original.length, modified.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i < original.length && i < modified.length && original[i] === modified[i]) {
        result.push(<span key={i}>{modified[i]}</span>);
      } else if (i < modified.length) {
        result.push(<span key={i} className="bg-yellow-200 text-red-700 font-bold">{modified[i]}</span>);
      }
    }
    
    return <>{result}</>;
  };

  const verifySignatureMutation = useMutation({
    mutationFn: async (messageToVerify: string) => {
      if (!keyPair) throw new Error("No key pair available");
      if (!signatureData) throw new Error("No signature available");

      const response = await apiRequest("POST", "/api/crypto/verify", {
        message: messageToVerify,
        signature: signatureData.signature,
        publicKey: keyPair.publicKey,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setVerificationResult(data.valid);
      setIsVerifying(false);
    },
    onError: (error) => {
      toast({
        title: "Error verifying signature",
        description: String(error),
        variant: "destructive",
      });
      setIsVerifying(false);
    },
  });

  const handleVerifySignature = () => {
    if (!keyPair) {
      toast({
        title: "Keys required",
        description: "Please generate keys first!",
        variant: "destructive",
      });
      return;
    }

    if (!signatureData) {
      toast({
        title: "Signature required",
        description: "Please sign the message first!",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    verifySignatureMutation.mutate(activeTab === "edited" ? editedMessage : message);
  };

  // Handle manual message editing
  const handleEditMessage = () => {
    setEditedMessage(message);
    setShowEditMessage(true);
    setActiveTab("edited");
  };

  // Apply edited message and verify
  const handleApplyEdits = () => {
    if (editedMessage === message) {
      toast({
        title: "No changes made",
        description: "Please modify the message to see verification changes",
      });
      return;
    }
    
    setIsVerifying(true);
    verifySignatureMutation.mutate(editedMessage);
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-primary px-6 py-4">
        <h2 className="text-xl font-semibold text-primary-foreground flex items-center">
          <span className="mr-2">4.</span> Verify Signature
        </h2>
      </div>
      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Verification confirms that the message was signed by the owner of the private key and hasn't been altered.
        </p>
        
        {showEditMessage && (
          <div className="mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="message">Original Message</TabsTrigger>
                <TabsTrigger value="edited">Edited Message</TabsTrigger>
              </TabsList>
              <TabsContent value="message" className="p-4 border rounded-md">
                <div className="text-sm font-mono whitespace-pre-wrap">{message}</div>
              </TabsContent>
              <TabsContent value="edited">
                <Textarea 
                  className="font-mono"
                  value={editedMessage} 
                  onChange={(e) => setEditedMessage(e.target.value)}
                  rows={4}
                />
                <div className="mt-2 text-xs text-gray-500">
                  {editedMessage !== message && (
                    <div className="mt-2 p-2 border rounded-md bg-gray-50">
                      <p className="font-semibold mb-1 text-gray-700">Changes highlighted:</p>
                      <div className="font-mono text-sm whitespace-pre-wrap">
                        {highlightDifferences(message, editedMessage)}
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  className="mt-2"
                  onClick={handleApplyEdits}
                  disabled={editedMessage === message}
                >
                  Verify with Edited Message
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {!showEditMessage && (
          <div className="mb-6">
            <Button 
              className="w-full"
              onClick={handleVerifySignature}
              disabled={isVerifying || !keyPair || !signatureData}
            >
              {isVerifying ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Verify Signature
                </>
              )}
            </Button>
          </div>
        )}
        
        {verificationResult !== null && !showEditMessage && (
          <div id="verificationResult">
            {verificationResult ? (
              <div className="p-4 mb-4 rounded-md bg-green-50 border border-green-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Signature Valid!</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>The signature was successfully verified with the provided public key. This confirms that:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>The message was signed by the owner of the private key</li>
                        <li>The message has not been tampered with since it was signed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 mb-4 rounded-md bg-red-50 border border-red-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Signature Invalid!</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>The signature could not be verified. This could mean:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>The message was altered after signing</li>
                        <li>The wrong public key was used for verification</li>
                        <li>The signature was not created with the corresponding private key</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Options for tampering with the message */}
            <div className="mt-6 p-4 rounded-md bg-yellow-50 border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Try It: Tamper with the message</h3>
              <p className="text-sm text-yellow-700 mb-3">
                Test how signature verification responds to changes in the message after signing.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button 
                  variant="outline"
                  className="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium"
                  onClick={onTamperMessage}
                  disabled={tampered}
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Auto-Modify & Verify
                </Button>
                <Button 
                  variant="outline"
                  className="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium"
                  onClick={handleEditMessage}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Message Manually
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Allow returning to original view */}
        {showEditMessage && verificationResult !== null && (
          <div className="mt-4">
            <Button 
              variant="outline"
              onClick={() => setShowEditMessage(false)}
            >
              Back to Verification Result
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
