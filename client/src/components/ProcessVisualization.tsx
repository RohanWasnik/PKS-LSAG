export default function ProcessVisualization() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">How It Works</h2>
      <div className="relative">
        {/* Process Steps Visualization */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
        <div className="flex flex-col md:flex-row justify-between relative z-10">
          {/* Step 1 */}
          <div className="flex flex-col items-center mb-6 md:mb-0">
            <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2">1</div>
            <div className="text-center">
              <h3 className="font-medium text-gray-900">Generate Keys</h3>
              <p className="text-sm text-gray-500 mt-1">Create public/private key pair</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center mb-6 md:mb-0">
            <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2">2</div>
            <div className="text-center">
              <h3 className="font-medium text-gray-900">Create Message</h3>
              <p className="text-sm text-gray-500 mt-1">Enter your message to sign</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center mb-6 md:mb-0">
            <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2">3</div>
            <div className="text-center">
              <h3 className="font-medium text-gray-900">Sign Message</h3>
              <p className="text-sm text-gray-500 mt-1">Use private key to sign</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center">
            <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2">4</div>
            <div className="text-center">
              <h3 className="font-medium text-gray-900">Verify Signature</h3>
              <p className="text-sm text-gray-500 mt-1">Validate with public key</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
