'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;
  
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl sm:text-2xl font-bold text-blue-600">CodeFuel</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Link
              href="/"
              className={`px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Home
            </Link>
            
            <Link
              href="/trending"
              className={`px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/trending') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Trending
            </Link>
            
            <Link
              href="/how-it-works"
              className={`px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/how-it-works') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <span className="hidden sm:inline">How It Works</span>
              <span className="sm:hidden">How</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}