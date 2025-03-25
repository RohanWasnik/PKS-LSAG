import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import CryptographyApp from "@/components/CryptographyApp";
import LSAGApp from "@/components/LSAGApp";
import Navigation from "@/components/Navigation";
import SignatureTamperingTutorial from "@/components/SignatureTamperingTutorial";

function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Cryptographic Signature Demonstrations</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore different types of cryptographic signatures and their applications
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Public Key Signatures</h3>
              <p className="mt-2 text-sm text-gray-500">
                Learn the basics of digital signatures with public and private keys, including 
                generating key pairs, signing messages, and verifying signatures.
              </p>
              <div className="mt-5">
                <Link href="/basic-signatures">
                  <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
                    Explore Basic Signatures
                  </span>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Linkable Anonymous Group Signatures</h3>
              <p className="mt-2 text-sm text-gray-500">
                Discover how group members can sign messages anonymously while maintaining 
                the ability to detect if the same person signs multiple times.
              </p>
              <div className="mt-5">
                <Link href="/lsag">
                  <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
                    Explore LSAG Signatures
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/basic-signatures" component={CryptographyApp} />
      <Route path="/lsag" component={LSAGApp} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-1">
          <Router />
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
