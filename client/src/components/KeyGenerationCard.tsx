import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { KeyRound, Copy, Download } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { KeyPair } from "./CryptographyApp";

interface KeyGenerationCardProps {
  keyPair: KeyPair | null;
  setKeyPair: (keyPair: KeyPair) => void;
}

export default function KeyGenerationCard({ keyPair, setKeyPair }: KeyGenerationCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateKeysMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/crypto/generate-keys", {});
      return response.json();
    },
    onSuccess: (data) => {
      setKeyPair(data);
      setIsGenerating(false);
    },
    onError: (error) => {
      toast({
        title: "Error generating keys",
        description: String(error),
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  const handleGenerateKeys = () => {
    setIsGenerating(true);
    generateKeysMutation.mutate();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`,
      });
    }).catch(err => {
      toast({
        title: "Copy failed",
        description: `Failed to copy: ${err}`,
        variant: "destructive",
      });
    });
  };

  const exportKeys = () => {
    if (!keyPair) return;

    const keyData = JSON.stringify(keyPair, null, 2);
    const blob = new Blob([keyData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keypair.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Keys exported",
      description: "The key pair has been exported as a JSON file.",
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-primary px-6 py-4">
        <h2 className="text-xl font-semibold text-primary-foreground flex items-center">
          <span className="mr-2">1.</span> Key Generation
        </h2>
      </div>
      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Public key cryptography uses a pair of keys: a private key that you keep secret and a public key that you share.
        </p>
        
        <div className="flex mb-6">
          <Button 
            className="flex-1 items-center justify-center"
            onClick={handleGenerateKeys}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <KeyRound className="h-5 w-5 mr-2" />
                {keyPair ? "Generate New Keys" : "Generate Key Pair"}
              </>
            )}
          </Button>
        </div>
        
        {keyPair && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Private Key <span className="text-red-500 text-xs font-normal">(Keep this secret!)</span>
                </label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center h-8"
                  onClick={() => copyToClipboard(keyPair.privateKey, "Private key")}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="bg-gray-100 p-3 rounded-md font-mono text-xs overflow-auto break-all" style={{ maxHeight: "150px" }}>
                {keyPair.privateKey}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Public Key <span className="text-green-500 text-xs font-normal">(Safe to share)</span>
                </label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center h-8"
                  onClick={() => copyToClipboard(keyPair.publicKey, "Public key")}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="bg-gray-100 p-3 rounded-md font-mono text-xs overflow-auto break-all" style={{ maxHeight: "150px" }}>
                {keyPair.publicKey}
              </div>
            </div>
            
            <div className="flex space-x-4">
              <Button 
                variant="ghost" 
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                onClick={exportKeys}
              >
                <Download className="h-4 w-4 mr-1" />
                Export Keys
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
