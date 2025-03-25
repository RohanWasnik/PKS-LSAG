import { Link, useLocation } from "wouter";

export default function Navigation() {
  const [location] = useLocation();
  
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="font-bold text-xl text-indigo-600 cursor-pointer">CryptoSignatures</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/">
                <span className={`${
                  location === "/" 
                    ? "border-indigo-500 text-gray-900" 
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer`}>
                  Home
                </span>
              </Link>
              
              <Link href="/basic-signatures">
                <span className={`${
                  location === "/basic-signatures" 
                    ? "border-indigo-500 text-gray-900" 
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer`}>
                  Basic Signatures
                </span>
              </Link>
              
              <Link href="/lsag">
                <span className={`${
                  location === "/lsag" 
                    ? "border-indigo-500 text-gray-900" 
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium cursor-pointer`}>
                  LSAG Signatures
                </span>
              </Link>
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
              
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          <Link href="/">
            <span className={`${
              location === "/" 
                ? "bg-indigo-50 border-indigo-500 text-indigo-700" 
                : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer`}>
              Home
            </span>
          </Link>
          
          <Link href="/basic-signatures">
            <span className={`${
              location === "/basic-signatures" 
                ? "bg-indigo-50 border-indigo-500 text-indigo-700" 
                : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer`}>
              Basic Signatures
            </span>
          </Link>
          
          <Link href="/lsag">
            <span className={`${
              location === "/lsag" 
                ? "bg-indigo-50 border-indigo-500 text-indigo-700" 
                : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium cursor-pointer`}>
              LSAG Signatures
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}