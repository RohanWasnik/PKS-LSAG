import { useState } from "react";
import Header from "./Header";
import ProcessVisualization from "./ProcessVisualization";
import KeyGenerationCard from "./KeyGenerationCard";
import MessageInputCard from "./MessageInputCard";
import SigningCard from "./SigningCard";
import VerificationCard from "./VerificationCard";
import TechnicalExplanation from "./TechnicalExplanation";

export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

export interface SignatureData {
  signature: string;
  messageHash: string;
}

export default function CryptographyApp() {
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [message, setMessage] = useState<string>("This is a secure message that needs to be signed.");
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [tampered, setTampered] = useState<boolean>(false);
  const [originalMessage, setOriginalMessage] = useState<string | null>(null);

  const handleMessageChange = (newMessage: string) => {
    setMessage(newMessage);
    // If the message changes after signing, clear the verification result
    if (signatureData) {
      // Store the original message if we don't have it yet
      if (!originalMessage) {
        setOriginalMessage(message);
      }
      setVerificationResult(null);
      setTampered(true);
    }
  };

  const resetTamperedState = () => {
    setTampered(false);
    // Reset to original message if available
    if (originalMessage) {
      setMessage(originalMessage);
      setOriginalMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Header />
        <ProcessVisualization />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <KeyGenerationCard 
              keyPair={keyPair} 
              setKeyPair={setKeyPair} 
            />
            <MessageInputCard 
              message={message} 
              setMessage={handleMessageChange} 
              messageHash={signatureData?.messageHash} 
              keyPairGenerated={!!keyPair}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <SigningCard 
              keyPair={keyPair} 
              message={message} 
              signatureData={signatureData} 
              setSignatureData={setSignatureData}
              resetTamperedState={resetTamperedState}
            />
            <VerificationCard 
              keyPair={keyPair} 
              message={message} 
              signatureData={signatureData} 
              verificationResult={verificationResult} 
              setVerificationResult={setVerificationResult} 
              tampered={tampered}
              onTamperMessage={() => {
                const tamperedMessage = message + " (tampered)";
                setMessage(tamperedMessage);
                setTampered(true);
                setVerificationResult(null);
              }}
            />
          </div>
        </div>

        <TechnicalExplanation />
      </div>
    </div>
  );
}
