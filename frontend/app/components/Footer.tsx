import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Store Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {/* Dummy Logo */}
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">VH</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">VitaHealth</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Your trusted online marketplace for vitamins and wellness essentials.
              We support healthier routines with reliable products and professional service.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-green-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-600 hover:text-green-600 transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-gray-600 hover:text-green-600 transition-colors">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <i className="bi bi-envelope text-green-600 "></i>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href="mailto:support@mystore.com" className="text-gray-700 hover:text-green-600">
                    rafaelricasata67@gmail.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <i className="bi bi-telephone text-green-600"></i>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a className="text-gray-700 hover:text-green-600">
                    +63 915 600 0056
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <i className="bi bi-geo-alt text-green-600"></i>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="text-gray-500">
                    Dasmariñas Cavite
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Social Media Links */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Follow Us</h4>
            <div className="flex gap-3 mb-2">
              <a
                href="https://github.com/RJustn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-100 hover:bg-gray-900 hover:text-white rounded-full flex items-center justify-center transition-colors"
                title="GitHub"
              >
                <i className="bi bi-github"></i>
              </a>
              <a
                href="https://www.linkedin.com/in/rj-ricasata-757b4533b/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-100 hover:bg-blue-700 hover:text-white rounded-full flex items-center justify-center transition-colors"
                title="LinkedIn"
              >
                <i className="bi bi-linkedin"></i>
              </a>
              <a
                href="https://twitter.com/rfl_jstn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-100 hover:bg-blue-400 hover:text-white rounded-full flex items-center justify-center transition-colors"
                title="Twitter"
              >
                <i className="bi bi-twitter"></i>
              </a>
            </div>
            <p className="text-sm text-gray-600">
              Stay connected for health tips, wellness updates, and exclusive offers.
            </p>
          </div>

        </div>

        {/* Copyright Section */}
        <div className="border-t mt-8 pt-8">
          <p className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} VitaHealth. All rights reserved. |
            <Link href="/" className="hover:text-green-600 ml-1">Privacy Policy</Link> | 
            <Link href="/" className="hover:text-green-600 ml-1">Terms of Service</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
