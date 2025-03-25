import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface MessageInputCardProps {
  message: string;
  setMessage: (message: string) => void;
  messageHash?: string;
  keyPairGenerated: boolean;
}

export default function MessageInputCard({ 
  message, 
  setMessage, 
  messageHash,
  keyPairGenerated
}: MessageInputCardProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Message hash copied to clipboard.",
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
          <span className="mr-2">2.</span> Message Input
        </h2>
      </div>
      <div className="p-6">
        <p className="text-gray-600 mb-4">
          Enter the message you want to sign. This could be any text or document that you want to prove came from you.
        </p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="messageInput" className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
            <Textarea 
              id="messageInput" 
              rows={4} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary" 
              placeholder="Enter your message here..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="mt-1 text-sm text-gray-500">The message will be hashed before signing.</p>
          </div>
          
          {keyPairGenerated && messageHash && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Message Hash</label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center h-8"
                  onClick={() => copyToClipboard(messageHash)}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="bg-gray-100 p-3 rounded-md font-mono text-xs break-all">
                {messageHash}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
