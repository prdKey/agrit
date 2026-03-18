import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, TrendingUp, Truck, Shield } from 'lucide-react';

export default function Home() {

  const povs = [
    {
      title: 'Buyers',
      icon: '🛒',
      description: 'Discover fresh, organic products from trusted local farmers. Shop with confidence knowing exactly where your food comes from.',
      features: ['Browse & filter products', 'Secure checkout', 'Order tracking with map', 'Ratings & reviews'],
      color: 'from-blue-50 to-blue-100',
      accentColor: 'text-blue-600',
    },
    {
      title: 'Sellers',
      icon: '🌾',
      description: 'Reach environmentally conscious consumers. Manage your farm or business and grow your sales with our platform.',
      features: ['Product management', 'Order fulfillment', 'Analytics & reports', 'Payout system'],
      color: 'from-green-50 to-green-100',
      accentColor: 'text-green-600',
    },
    {
      title: 'Logistics',
      icon: '🚚',
      description: 'Join our delivery network. Complete deliveries, track earnings, and build your reputation as a trusted provider.',
      features: ['Task management', 'Route optimization', 'Real-time tracking', 'Earnings dashboard'],
      color: 'from-amber-50 to-amber-100',
      accentColor: 'text-amber-600',
    },
    {
      title: 'Admins',
      icon: '⚙️',
      description: 'Oversee the platform. Manage users, approvals, disputes, and ensure a trustworthy marketplace for all.',
      features: ['User management', 'Approval workflows', 'Dispute resolution', 'System analytics'],
      color: 'from-purple-50 to-purple-100',
      accentColor: 'text-purple-600',
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="py-12 sm:py-20 lg:py-28">
        <div className="max-w-3xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-400 text-sm font-medium mb-6">
            <Leaf size={16} />
            Sustainable Agriculture Marketplace
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Trust in Every <span className="text-green-400">Harvest</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 mb-8 leading-relaxed">
            AgriTrust connects buyers with ethical producers, creating a transparent and rewarding marketplace for organic and sustainable agriculture using blockchain technology.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-12 sm:mt-16">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-green-400">2.5K+</p>
              <p className="text-sm text-gray-500">Products</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-green-400">850+</p>
              <p className="text-sm text-gray-500">Sellers</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-green-400">15K+</p>
              <p className="text-sm text-gray-500">Buyers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Points of View Section */}
      <section className="px-10 py-12 sm:py-20 bg-white border-y-0 shadow-2xl">
        <div className="mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Four Ways to Participate
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Whether you're buying fresh organic products, selling your harvest, delivering orders, or managing the platform, AgriTrust has a role for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {povs.map((pov) => (
              <div
                key={pov.title}
                className={`rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 bg-linear-to-br ${pov.color}`}
              >
                <div className="p-6 h-full flex flex-col">
                  <div className="text-4xl mb-4">{pov.icon}</div>

                  <h3 className="text-xl font-bold text-foreground mb-2">{pov.title}</h3>

                  <p className="text-sm text-gray-500 mb-6 flex-1">
                    {pov.description}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {pov.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className={`${pov.accentColor} mt-1`}>✓</span>
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-10 py-12 sm:py-20 lg:py-28">
        <div className="mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Choose AgriTrust?
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Built with transparency, sustainability, and innovation at its core.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-400 text-white">
                  <Shield size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Secure & Transparent</h3>
                <p className="text-gray-500">
                  Blockchain-verified transactions ensure every product is authentic and every transaction is verifiable.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-400 text-white">
                  <Leaf size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Sustainable Impact</h3>
                <p className="text-gray-500">
                  Support local farmers and sustainable practices. Track the environmental impact of your purchases.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-400 text-white">
                  <TrendingUp size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Grow Your Business</h3>
                <p className="text-gray-500">
                  Sellers get access to analytics, marketing tools, and direct access to conscious consumers.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-400 text-white">
                  <Truck size={24} /> 
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Fast Delivery</h3>
                <p className="text-gray-500">
                  Real-time tracking, optimized routes, and reliable logistics partners ensure fresh delivery every time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 bg-green-100 border-y-0 shadow-2xl">
          <div className="container-max text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Ready to Join the Movement?
            </h2>
            <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
              Create your account today and start your journey in sustainable agriculture.
            </p>
            <Link
              to="/signup"
              className="bg-green-400 px-8 py-3 text-base inline-flex items-center gap-2 rounded-2xl"
            >
              Get Started Now <ArrowRight size={18} />
            </Link>
          </div>
        </section>
    </div>
  );
}
