import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, Edit, ShieldOff, AlertTriangle, ArrowRight, Info, CheckCircle, XCircle, Copy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { KeyPair } from "./CryptographyApp";

// Types for tutorial states
type TutorialStage = 
  | "intro" 
  | "generate-keys" 
  | "sign-message" 
  | "verify-original" 
  | "tamper-message" 
  | "verify-tampered" 
  | "signature-tampering" 
  | "verify-tampered-signature" 
  | "conclusion";

interface TutorialState {
  stage: TutorialStage;
  originalMessage: string;
  tamperedMessage: string;
  originalSignature: string;
  tamperedSignature: string;
  keyPair: KeyPair | null;
  messageHash: string;
  originalVerified: boolean | null;
  tamperedVerified: boolean | null;
  tamperedSignatureVerified: boolean | null;
}

export default function SignatureTamperingTutorial() {
  const [state, setState] = useState<TutorialState>({
    stage: "intro",
    originalMessage: "This is a secure transaction to transfer $100 to Alice.",
    tamperedMessage: "This is a secure transaction to transfer $1000 to Alice.",
    originalSignature: "",
    tamperedSignature: "",
    keyPair: null,
    messageHash: "",
    originalVerified: null,
    tamperedVerified: null,
    tamperedSignatureVerified: null
  });
  
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Progress to the next tutorial stage
  const nextStage = (nextStage: TutorialStage) => {
    setState(prev => ({ ...prev, stage: nextStage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate a key pair
  const generateKeys = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/crypto/generate-keys", {});
      const data = await response.json();
      setState(prev => ({ 
        ...prev, 
        keyPair: data, 
        stage: "sign-message" 
      }));
      toast({
        title: "Keys generated!",
        description: "Your public and private keys have been created successfully."
      });
    } catch (error) {
      toast({
        title: "Error generating keys",
        description: String(error),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sign the original message
  const signMessage = async () => {
    if (!state.keyPair) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/crypto/sign", {
        message: state.originalMessage,
        privateKey: state.keyPair.privateKey
      });
      const data = await response.json();
      setState(prev => ({
        ...prev,
        originalSignature: data.signature,
        messageHash: data.messageHash,
        stage: "verify-original"
      }));
      toast({
        title: "Message signed!",
        description: "Your message has been signed with your private key."
      });
    } catch (error) {
      toast({
        title: "Error signing message",
        description: String(error),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify the original message
  const verifyOriginal = async () => {
    if (!state.keyPair || !state.originalSignature) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/crypto/verify", {
        message: state.originalMessage,
        signature: state.originalSignature,
        publicKey: state.keyPair.publicKey
      });
      const data = await response.json();
      setState(prev => ({
        ...prev,
        originalVerified: data.valid,
        stage: "tamper-message"
      }));
    } catch (error) {
      toast({
        title: "Error verifying signature",
        description: String(error),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify the tampered message with original signature
  const verifyTampered = async () => {
    if (!state.keyPair || !state.originalSignature) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/crypto/verify", {
        message: state.tamperedMessage,
        signature: state.originalSignature,
        publicKey: state.keyPair.publicKey
      });
      const data = await response.json();
      setState(prev => ({
        ...prev,
        tamperedVerified: data.valid,
        stage: "signature-tampering"
      }));
    } catch (error) {
      toast({
        title: "Error verifying signature",
        description: String(error),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate tampering with the signature
  const tamperSignature = async () => {
    if (!state.originalSignature) return;
    
    // For demonstration, we'll just modify a character in the signature
    // In a real attack, someone might try more sophisticated approaches
    const tamperChar = (str: string, position: number, newChar: string) => {
      return str.substring(0, position) + newChar + str.substring(position + 1);
    };
    
    // Tamper with a character in the middle of the signature
    const position = Math.floor(state.originalSignature.length / 2);
    const tamperedSignature = tamperChar(state.originalSignature, position, 'X');
    
    setState(prev => ({
      ...prev,
      tamperedSignature,
      stage: "verify-tampered-signature"
    }));
  };

  // Verify a tampered signature
  const verifyTamperedSignature = async () => {
    if (!state.keyPair || !state.tamperedSignature) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/crypto/verify", {
        message: state.originalMessage,
        signature: state.tamperedSignature,
        publicKey: state.keyPair.publicKey
      });
      const data = await response.json();
      setState(prev => ({
        ...prev,
        tamperedSignatureVerified: data.valid,
        stage: "conclusion"
      }));
    } catch (error) {
      toast({
        title: "Error verifying signature",
        description: String(error),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Highlight differences between two strings
  const highlightDifferences = (original: string, modified: string): JSX.Element => {
    if (!original || !modified) return <span>{modified}</span>;
    
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

  // Copy text to clipboard
  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description,
      });
    }).catch(err => {
      toast({
        title: "Copy failed",
        description: `Failed to copy: ${err}`,
        variant: "destructive",
      });
    });
  };

  // Highlight character changes in a signature (simplified for UI)
  const renderSignatureComparison = (original: string, tampered: string) => {
    // We'll show the first few characters, then highlight differences, then show the end
    const displayLength = 15;
    const ellipsis = "...";
    
    if (original.length !== tampered.length) {
      return (
        <div className="space-y-2">
          <div><span className="font-semibold">Original:</span> {original.substring(0, displayLength)}{ellipsis}</div>
          <div><span className="font-semibold">Tampered:</span> {tampered.substring(0, displayLength)}{ellipsis}</div>
        </div>
      );
    }
    
    // Find the first difference
    let diffPos = 0;
    while (diffPos < original.length && original[diffPos] === tampered[diffPos]) {
      diffPos++;
    }
    
    const beforeDiff = Math.max(0, diffPos - 5);
    const afterDiff = Math.min(original.length, diffPos + 6);
    
    return (
      <div className="space-y-2">
        <div>
          <span className="font-semibold">Original:</span> {original.substring(0, 8)}{ellipsis}
          <span className="font-mono bg-gray-100 px-1">{original.substring(beforeDiff, afterDiff)}</span>
          {ellipsis}
        </div>
        <div>
          <span className="font-semibold">Tampered:</span> {tampered.substring(0, 8)}{ellipsis}
          <span className="font-mono bg-yellow-100 px-1">
            {tampered.substring(beforeDiff, diffPos)}
            <span className="text-red-600 font-bold">{tampered[diffPos]}</span>
            {tampered.substring(diffPos + 1, afterDiff)}
          </span>
          {ellipsis}
        </div>
      </div>
    );
  };

  // Render the appropriate stage of the tutorial
  const renderTutorialStage = () => {
    switch (state.stage) {
      case "intro":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Digital Signature Tampering Tutorial</CardTitle>
              <CardDescription>
                Learn how digital signatures protect messages from tampering and how verification catches unauthorized changes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-5 w-5 text-blue-500" />
                <AlertTitle>What You'll Learn</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>How digital signatures are created and verified</li>
                    <li>Why changing a signed message breaks the signature</li>
                    <li>How modification attempts are detected</li>
                    <li>Why digital signatures are essential for data integrity</li>
                  </ul>
                </AlertDescription>
              </Alert>
              <div>
                <h3 className="text-lg font-semibold mb-2">In this tutorial, you will:</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Generate a public and private key pair</li>
                  <li>Sign a message authorizing a $100 transfer</li>
                  <li>Verify the signature is valid</li>
                  <li>Attempt to tamper with the message (changing $100 to $1000)</li>
                  <li>See how verification fails for the tampered message</li>
                  <li>Learn why tampering with signatures also fails</li>
                </ol>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => nextStage("generate-keys")} className="w-full">
                Start Tutorial
              </Button>
            </CardFooter>
          </Card>
        );
        
      case "generate-keys":
        return (
          <Card>
            <CardHeader>
              <CardTitle>
                <Badge className="mr-2">Step 1</Badge>
                Generate Your Keys
              </CardTitle>
              <CardDescription>
                First, we need to create a key pair - a private key for signing and a public key for verification.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="text-md font-semibold mb-2">About Digital Signatures:</h3>
                <p className="text-sm text-gray-600">
                  Digital signatures work like a personal seal or handwritten signature, but are much harder to forge.
                  They use cryptographic algorithms to create a unique signature that only the private key holder can generate,
                  but anyone with the public key can verify.
                </p>
              </div>
              
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <AlertTitle>Keep Your Private Key Secret!</AlertTitle>
                <AlertDescription>
                  In a real system, you would never share your private key with anyone.
                  Anyone with your private key can sign messages as if they were you.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button onClick={generateKeys} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Keys...
                  </>
                ) : (
                  "Generate Key Pair"
                )}
              </Button>
            </CardFooter>
          </Card>
        );
        
      case "sign-message":
        return (
          <Card>
            <CardHeader>
              <CardTitle>
                <Badge className="mr-2">Step 2</Badge>
                Sign a Transaction Message
              </CardTitle>
              <CardDescription>
                Now we'll sign a message authorizing a $100 transfer to demonstrate how signatures work.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.keyPair && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Your Keys (Generated)</h3>
                    <Tabs defaultValue="public">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="public">Public Key</TabsTrigger>
                        <TabsTrigger value="private">Private Key</TabsTrigger>
                      </TabsList>
                      <TabsContent value="public" className="p-2 border rounded-md bg-gray-50">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0"
                            onClick={() => copyToClipboard(state.keyPair!.publicKey, "Public key copied to clipboard")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <pre className="text-xs overflow-x-auto p-2 whitespace-pre-wrap break-all">
                            {state.keyPair.publicKey}
                          </pre>
                        </div>
                      </TabsContent>
                      <TabsContent value="private" className="p-2 border rounded-md bg-gray-50">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0"
                            onClick={() => copyToClipboard(state.keyPair!.privateKey, "Private key copied to clipboard")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <pre className="text-xs overflow-x-auto p-2 whitespace-pre-wrap break-all">
                            {state.keyPair.privateKey}
                          </pre>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Message to Sign</h3>
                    <Textarea
                      className="font-mono"
                      value={state.originalMessage}
                      onChange={(e) => setState(prev => ({ ...prev, originalMessage: e.target.value }))}
                      rows={2}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      This is a transaction message we'll sign with our private key.
                    </p>
                  </div>
                  
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-5 w-5 text-blue-500" />
                    <AlertTitle>How Signing Works</AlertTitle>
                    <AlertDescription className="text-sm">
                      When you sign a message, your private key creates a unique digital signature for that specific message.
                      The signature depends on both the message content and your private key.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={signMessage} disabled={isLoading || !state.keyPair} className="w-full">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing Message...
                  </>
                ) : (
                  "Sign Message"
                )}
              </Button>
            </CardFooter>
          </Card>
        );
        
      case "verify-original":
        return (
          <Card>
            <CardHeader>
              <CardTitle>
                <Badge className="mr-2">Step 3</Badge>
                Verify the Original Signature
              </CardTitle>
              <CardDescription>
                Now we'll verify the signature against the original message.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Original Message</h3>
                <div className="p-3 border rounded-md bg-gray-50 font-mono text-sm">
                  {state.originalMessage}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Digital Signature</h3>
                <div className="p-3 border rounded-md bg-gray-50 font-mono text-xs break-all">
                  {state.originalSignature.substring(0, 40)}...
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() => copyToClipboard(state.originalSignature, "Signature copied to clipboard")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-5 w-5 text-blue-500" />
                <AlertTitle>Verification Process</AlertTitle>
                <AlertDescription className="text-sm">
                  Verification uses the public key to mathematically check if the signature was created by the corresponding private key
                  for this exact message. Any change to either the message or signature will cause verification to fail.
                </AlertDescription>
              </Alert>
              
              {state.originalVerified !== null && (
                <div className={`p-4 rounded-md ${state.originalVerified ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {state.originalVerified ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${state.originalVerified ? 'text-green-800' : 'text-red-800'}`}>
                        {state.originalVerified ? 'Signature Valid!' : 'Signature Invalid!'}
                      </h3>
                      <div className={`mt-2 text-sm ${state.originalVerified ? 'text-green-700' : 'text-red-700'}`}>
                        <p>
                          {state.originalVerified 
                            ? 'The signature was successfully verified with the public key. This confirms the message is authentic and hasn\'t been modified.'
                            : 'The signature could not be verified. This indicates there might be a problem with the message, signature, or keys.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button onClick={verifyOriginal} disabled={isLoading || !state.originalSignature} className="w-full">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  "Verify Signature"
                )}
              </Button>
              
              {state.originalVerified && (
                <Button 
                  variant="outline" 
                  onClick={() => nextStage("tamper-message")}
                  className="w-full"
                >
                  Continue to Next Step
                </Button>
              )}
            </CardFooter>
          </Card>
        );
        
      case "tamper-message":
        return (
          <Card>
            <CardHeader>
              <CardTitle>
                <Badge className="mr-2">Step 4</Badge>
                Tamper with the Message
              </CardTitle>
              <CardDescription>
                Let's modify the message to change the transaction amount and see what happens.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Original Message (Signed)</h3>
                <div className="p-3 border rounded-md bg-gray-50 font-mono text-sm">
                  {state.originalMessage}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Tampered Message</h3>
                <Textarea
                  className="font-mono"
                  value={state.tamperedMessage}
                  onChange={(e) => setState(prev => ({ ...prev, tamperedMessage: e.target.value }))}
                  rows={2}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Try changing "$100" to "$1000" to simulate an attacker modifying the transaction amount.
                </p>
              </div>
              
              <div className="p-3 border rounded-md bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Changes highlighted:</h3>
                <div className="font-mono text-sm whitespace-pre-wrap">
                  {highlightDifferences(state.originalMessage, state.tamperedMessage)}
                </div>
              </div>
              
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <AlertTitle>The Attack</AlertTitle>
                <AlertDescription className="text-sm">
                  An attacker might try to modify a signed message to change important details, like a payment amount,
                  while keeping the original signature. Let's see if this works.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button onClick={verifyTampered} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying Tampered Message...
                  </>
                ) : (
                  "Verify Tampered Message with Original Signature"
                )}
              </Button>
            </CardFooter>
          </Card>
        );
        
      case "verify-tampered":
        return (
          <Card>
            <CardHeader>
              <CardTitle>
                <Badge className="mr-2">Step 5</Badge>
                Tampered Message Verification
              </CardTitle>
              <CardDescription>
                Let's see what happens when we verify the tampered message with the original signature.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Original Message</h3>
                  <div className="p-3 border rounded-md bg-gray-50 font-mono text-sm h-20 overflow-auto">
                    {state.originalMessage}
                  </div>
                  {state.originalVerified !== null && (
                    <div className="mt-2 flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-600">Verified Successfully</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Tampered Message</h3>
                  <div className="p-3 border rounded-md bg-gray-50 font-mono text-sm h-20 overflow-auto">
                    {highlightDifferences(state.originalMessage, state.tamperedMessage)}
                  </div>
                  {state.tamperedVerified !== null && (
                    <div className="mt-2 flex items-center">
                      {state.tamperedVerified ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs text-green-600">Verified (Attack Successful!)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-xs text-red-600">Verification Failed (Attack Detected)</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {state.tamperedVerified !== null && (
                <div className={`p-4 rounded-md ${!state.tamperedVerified ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {!state.tamperedVerified ? (
                        <ShieldOff className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertIcon className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${!state.tamperedVerified ? 'text-green-800' : 'text-red-800'}`}>
                        {!state.tamperedVerified ? 'Attack Detected!' : 'Attack Successful!'}
                      </h3>
                      <div className={`mt-2 text-sm ${!state.tamperedVerified ? 'text-green-700' : 'text-red-700'}`}>
                        <p>
                          {!state.tamperedVerified 
                            ? 'The verification failed on the tampered message, showing that digital signatures successfully detect unauthorized changes.'
                            : 'The verification succeeded despite tampering, which indicates a vulnerability in the signature algorithm (this should never happen with proper cryptography).'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-5 w-5 text-blue-500" />
                <AlertTitle>Why Tampering Is Detected</AlertTitle>
                <AlertDescription className="text-sm">
                  Digital signatures are tied to the exact content of the message. Even changing a single character creates a completely
                  different signature value. This is why tampering is always detected - the original signature can't match the modified message.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button onClick={() => nextStage("signature-tampering")} className="w-full">
                Continue to Next Step
              </Button>
            </CardFooter>
          </Card>
        );
        
      case "signature-tampering":
        return (
          <Card>
            <CardHeader>
              <CardTitle>
                <Badge className="mr-2">Step 6</Badge>
                What About Tampering with the Signature?
              </CardTitle>
              <CardDescription>
                Another attack vector is to try modifying the signature itself. Let's see what happens.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Original Signature</h3>
                <div className="p-3 border rounded-md bg-gray-50 font-mono text-xs break-all">
                  {state.originalSignature.substring(0, 40)}...
                </div>
              </div>
              
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <AlertTitle>Signature Tampering Attack</AlertTitle>
                <AlertDescription className="text-sm">
                  What if an attacker tries to modify the signature itself, hoping to make it match a modified message?
                  Let's simulate someone trying to tamper with the signature directly.
                </AlertDescription>
              </Alert>
              
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="text-md font-semibold mb-2">Why This Won't Work:</h3>
                <p className="text-sm text-gray-600">
                  Signatures are created using complex cryptographic algorithms. There's no way to "edit" a signature to make it
                  valid for a different message without knowing the private key. This would be like trying to guess a random 256-bit number,
                  which is computationally infeasible.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={tamperSignature} disabled={!state.originalSignature} className="w-full">
                Tamper with Signature
              </Button>
            </CardFooter>
          </Card>
        );
        
      case "verify-tampered-signature":
        return (
          <Card>
            <CardHeader>
              <CardTitle>
                <Badge className="mr-2">Step 7</Badge>
                Verify Tampered Signature
              </CardTitle>
              <CardDescription>
                Now let's check if the tampered signature will verify with the original message.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Signature Comparison</h3>
                {renderSignatureComparison(state.originalSignature, state.tamperedSignature)}
              </div>
              
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-5 w-5 text-blue-500" />
                <AlertTitle>Cryptographic Nature of Signatures</AlertTitle>
                <AlertDescription className="text-sm">
                  Digital signatures work because of advanced mathematics. A small change in a signature completely destroys its cryptographic properties. 
                  It's virtually impossible to manually modify a signature and have it remain valid.
                </AlertDescription>
              </Alert>
              
              {state.tamperedSignatureVerified !== null && (
                <div className={`p-4 rounded-md ${!state.tamperedSignatureVerified ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {!state.tamperedSignatureVerified ? (
                        <ShieldOff className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertIcon className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${!state.tamperedSignatureVerified ? 'text-green-800' : 'text-red-800'}`}>
                        {!state.tamperedSignatureVerified ? 'Attack Failed!' : 'Attack Successful!'}
                      </h3>
                      <div className={`mt-2 text-sm ${!state.tamperedSignatureVerified ? 'text-green-700' : 'text-red-700'}`}>
                        <p>
                          {!state.tamperedSignatureVerified 
                            ? 'The verification failed on the tampered signature, as expected. It's practically impossible to create a valid signature without the private key.'
                            : 'The verification succeeded despite tampering with the signature. This is highly unusual and would indicate a serious flaw in the cryptographic algorithm.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button onClick={verifyTamperedSignature} disabled={isLoading || !state.tamperedSignature} className="w-full">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  "Verify Tampered Signature"
                )}
              </Button>
              
              {state.tamperedSignatureVerified !== null && (
                <Button 
                  variant="outline" 
                  onClick={() => nextStage("conclusion")}
                  className="w-full"
                >
                  Continue to Conclusion
                </Button>
              )}
            </CardFooter>
          </Card>
        );
        
      case "conclusion":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Tutorial Conclusion</CardTitle>
              <CardDescription>
                Congratulations! You've completed the digital signature tampering tutorial.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-lg font-semibold text-green-800 mb-2">What We've Learned</h3>
                <ul className="list-disc pl-5 space-y-2 text-green-700">
                  <li>Digital signatures provide tamper detection for messages</li>
                  <li>Changing even a single character in a signed message breaks the signature</li>
                  <li>It's computationally infeasible to forge or tamper with a signature</li>
                  <li>Verification always fails if either the message or signature is modified</li>
                  <li>A message signature guarantees authenticity, integrity, and non-repudiation</li>
                </ul>
              </div>
              
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-5 w-5 text-blue-500" />
                <AlertTitle>Real-World Applications</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">Digital signatures are used extensively in:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Digital contracts and legal documents</li>
                    <li>Software distribution (to verify untampered downloads)</li>
                    <li>Financial transactions and cryptocurrencies</li>
                    <li>Email security (S/MIME, PGP)</li>
                    <li>SSL/TLS certificates for secure websites</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="text-md font-semibold mb-2">Next Steps:</h3>
                <p className="text-sm text-gray-600">
                  Now that you understand the basics of digital signatures and tamper detection, you can explore advanced topics
                  like certificate authorities, key management, blind signatures, or anonymous group signatures (LSAG) as demonstrated in other parts of this application.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => nextStage("intro")} className="w-full">
                Restart Tutorial
              </Button>
            </CardFooter>
          </Card>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      {renderTutorialStage()}
    </div>
  );
}