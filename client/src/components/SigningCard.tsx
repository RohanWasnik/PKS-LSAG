import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pen, Copy, Info } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { KeyPair, SignatureData } from "./CryptographyApp";

interface SigningCardProps {
  keyPair: KeyPair | null;
  message: string;
  signatureData: SignatureData | null;
  setSignatureData: (signatureData: SignatureData) => void;
  resetTamperedState: () => void;
}

export default function SigningCard({ 
  keyPair, 
  message, 
  signatureData, 
  setSignatureData,
  resetTamperedState
}: SigningCardProps) {
  const [isSigning, setIsSigning] = useState(false);
  const { toast } = useToast();

  const signMessageMutation = useMutation({
    mutationFn: async () => {
      if (!keyPair) throw new Error("No key pair available");
      if (!message.trim()) throw new Error("Message cannot be empty");

      const response = await apiRequest("POST", "/api/crypto/sign", {
        message,
        privateKey: keyPair.privateKey,
      });
      return response.json();
    },
    onSuccess: (data: SignatureData) => {
      setSignatureData(data);
      resetTamperedState();
      setIsSigning(false);
    },
    onError: (error) => {
      toast({
        title: "Error signing message",
        description: String(error),
        variant: "destructive",
      });
      setIsSigning(false);
    },
  });

  const handleSignMessage = () => {
    if (!keyPair) {
      toast({
        title: "Keys required",
        description: "Please generate keys first!",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message to sign!",
        variant: "destructive",
      });
      return;
    }

    setIsSigning(true);
    signMessageMutation.mutate();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Signature copied to clipboard.",
      });
    }).catch(err => {
      toast({
        title: "Copy failed",
        description: `Failed to copy: ${err}`,
        variant: "destructive",
      });
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-primary px-6 py-4">
        <h2 className="text-xl font-semibold text-primary-foreground flex items-center">
          <span className="mr-2">3.</span> Sign Message
        </h2>
      </div>
      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Signing a message creates a unique signature that can only be created by someone who possesses the private key.
        </p>
        
        <div className="mb-6">
          <Button 
            className="w-full"
            onClick={handleSignMessage}
            disabled={isSigning || !keyPair || !message.trim()}
          >
            {isSigning ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing...
              </>
            ) : (
              <>
                <Pen className="h-5 w-5 mr-2" />
                Sign Message
              </>
            )}
          </Button>
        </div>
        
        {signatureData && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">How it works:</span> The message hash is encrypted with your private key to create a digital signature.
            </p>
          
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Digital Signature</label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center h-8"
                  onClick={() => copyToClipboard(signatureData.signature)}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="bg-gray-100 p-3 rounded-md font-mono text-xs break-all">
                {signatureData.signature}
              </div>
            </div>
            
            <div className="flex rounded-md overflow-hidden border border-blue-100 bg-blue-50">
              <div className="bg-blue-100 flex items-center p-3">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <div className="p-3 text-sm text-blue-700">
                The signature is encoded in base64 format. Anyone with your public key can verify this signature came from you.
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
