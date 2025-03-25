export default function TechnicalExplanation() {
  return (
    <div className="mt-12 bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gray-800 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Technical Explanation</h2>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">How Digital Signatures Work</h3>
            <p className="text-gray-600">
              Digital signatures use asymmetric cryptography with a mathematically related pair of keys:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
              <li><strong>Private key:</strong> Kept secret, used to create signatures</li>
              <li><strong>Public key:</strong> Shared openly, used to verify signatures</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">The Signature Process</h3>
            <ol className="list-decimal pl-6 mt-2 space-y-1 text-gray-600">
              <li>The message is hashed using a secure hashing algorithm (like SHA-256)</li>
              <li>The hash is encrypted with the signer's private key to create the signature</li>
              <li>The original message and signature are sent to the recipient</li>
              <li>The recipient uses the signer's public key to decrypt the signature, revealing the hash</li>
              <li>The recipient independently hashes the received message</li>
              <li>If both hashes match, the signature is valid</li>
            </ol>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Security Benefits</h3>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
              <li><strong>Authentication:</strong> Verifies the identity of the signer</li>
              <li><strong>Integrity:</strong> Confirms the message hasn't been altered</li>
              <li><strong>Non-repudiation:</strong> Signer cannot deny creating the signature</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
