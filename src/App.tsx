import { BrowserRouter, Routes, Route, useParams, Link } from 'react-router';
import { useState } from 'react';
import { 
  ChefHat, 
  ClipboardList, 
  Store, 
  QrCode, 
  Plus, 
  Check, 
  Users, 
  DollarSign,
  UserCheck,
  MapPin,
  Clock,
  ChevronRight,
  Sparkles
} from 'lucide-react';

// ==========================================
// 1. RMS SaaS Super Admin Workspace (/admin)
// ==========================================
function RmsSuperAdmin() {
  const [restaurants, setRestaurants] = useState([
    { id: 1, name: 'Burger & Co', slug: 'burger-co', status: 'Active', created: '2026-05-10', tables: 12 },
    { id: 2, name: 'Pizza Piazza', slug: 'pizza-piazza', status: 'Active', created: '2026-05-18', tables: 8 },
    { id: 3, name: 'Sushi House', slug: 'sushi-house', status: 'Pending Setup', created: '2026-05-28', tables: 15 },
  ]);

  const [newRestName, setNewRestName] = useState('');
  const [newRestSlug, setNewRestSlug] = useState('');

  const handleOnboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestName || !newRestSlug) return;
    setRestaurants([
      ...restaurants,
      {
        id: Date.now(),
        name: newRestName,
        slug: newRestSlug.toLowerCase().replace(/\s+/g, '-'),
        status: 'Active',
        created: new Date().toISOString().split('T')[0],
        tables: 10
      }
    ]);
    setNewRestName('');
    setNewRestSlug('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-8">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
              <Sparkles size={18} />
              <span>RMS PLATFORM</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">SaaS Super Admin Console</h1>
            <p className="text-slate-400 text-sm mt-1">Manage global subscriptions, onboard restaurants, and generate platform analytics.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-500/20">
              System Status: Operational
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Restaurants', value: restaurants.length, icon: Store, color: 'text-indigo-400' },
            { label: 'Total Active Tables', value: restaurants.reduce((acc, r) => acc + r.tables, 0), icon: QrCode, color: 'text-emerald-400' },
            { label: 'Platform MRR', value: `$${restaurants.filter(r => r.status === 'Active').length * 99}`, icon: DollarSign, color: 'text-amber-400' },
            { label: 'Total Staff Users', value: restaurants.length * 5, icon: Users, color: 'text-cyan-400' }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-sm font-medium">{stat.label}</span>
                  <h3 className="text-3xl font-extrabold mt-1 text-white">{stat.value}</h3>
                </div>
                <div className={`p-3 bg-slate-700/30 rounded-xl ${stat.color}`}>
                  <Icon size={24} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Onboarding Form */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 lg:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Plus className="text-indigo-400" size={20} />
              Onboard New Restaurant
            </h2>
            <form onSubmit={handleOnboard} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Restaurant Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Taco Fiesta"
                  value={newRestName}
                  onChange={(e) => {
                    setNewRestName(e.target.value);
                    setNewRestSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1">Restaurant URL Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. taco-fiesta"
                  value={newRestSlug}
                  onChange={(e) => setNewRestSlug(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Domain: rms.com/{newRestSlug || 'slug'}</span>
              </div>
              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
              >
                Onboard Restaurant & Init QRs
              </button>
            </form>
          </div>

          {/* Active Merchants List */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 lg:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Store className="text-emerald-400" size={20} />
              Onboarded Businesses
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-4">Restaurant</th>
                    <th className="pb-4">Slug</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Created Date</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {restaurants.map((rest) => (
                    <tr key={rest.id} className="text-sm">
                      <td className="py-4 font-semibold text-white">{rest.name}</td>
                      <td className="py-4 text-indigo-400">
                        <span className="bg-indigo-500/10 px-2 py-1 rounded text-xs">
                          /{rest.slug}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                          rest.status === 'Active' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${rest.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {rest.status}
                        </span>
                      </td>
                      <td className="py-4 text-slate-400">{rest.created}</td>
                      <td className="py-4 text-right space-x-2">
                        <a 
                          href={`/${rest.slug}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 font-medium text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors inline-flex items-center gap-1"
                        >
                          Visit App <ChevronRight size={12} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// 2. Restaurant Staff Portal (/:restaurantSlug)
// ==========================================
function RestaurantPortal() {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const [activeRole, setActiveRole] = useState<'selection' | 'merchant' | 'chef' | 'waiter'>('selection');

  // Humanize slug
  const restaurantName = restaurantSlug
    ? restaurantSlug.charAt(0).toUpperCase() + restaurantSlug.slice(1).replace(/-/g, ' ')
    : 'Restaurant';

  if (activeRole === 'selection') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        <div className="max-w-4xl w-full text-center space-y-12">
          
          {/* Header */}
          <div className="space-y-4">
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase">
              {restaurantName} Staff Gateway
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Choose Your Workspace
            </h1>
            <p className="text-slate-400 max-w-lg mx-auto text-sm">
              Log in directly to your operational panel to handle live dining orders, kitchens, and analytical summaries.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Merchant (Owner) Card */}
            <button 
              onClick={() => setActiveRole('merchant')}
              className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-8 text-left transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 blur-2xl rounded-full" />
              <div className="bg-indigo-600/10 text-indigo-400 p-4 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
                <Store size={28} />
              </div>
              <h3 className="text-xl font-bold mt-6 text-white group-hover:text-indigo-400 transition-colors">Merchant Portal</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Control active menus, change items, track restaurant sales graphs, and manage staff operations.
              </p>
              <div className="mt-8 flex items-center text-xs font-semibold text-indigo-400 gap-1.5">
                <span>Enter Workspace</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Chef (Kitchen) Card */}
            <button 
              onClick={() => setActiveRole('chef')}
              className="bg-slate-900/60 border border-slate-800 hover:border-rose-500/50 rounded-3xl p-8 text-left transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-500/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-600/5 blur-2xl rounded-full" />
              <div className="bg-rose-600/10 text-rose-400 p-4 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
                <ChefHat size={28} />
              </div>
              <h3 className="text-xl font-bold mt-6 text-white group-hover:text-rose-400 transition-colors">Chef Terminal</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Live dashboard of incoming KOTs. Update orders real-time to preparing, ready, and completed.
              </p>
              <div className="mt-8 flex items-center text-xs font-semibold text-rose-400 gap-1.5">
                <span>Enter Terminal</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Waiter Card */}
            <button 
              onClick={() => setActiveRole('waiter')}
              className="bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-8 text-left transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 blur-2xl rounded-full" />
              <div className="bg-emerald-600/10 text-emerald-400 p-4 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-300">
                <ClipboardList size={28} />
              </div>
              <h3 className="text-xl font-bold mt-6 text-white group-hover:text-emerald-400 transition-colors">Waiter Console</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Take floor orders on the go, view live table booking maps, and track ordered plates served.
              </p>
              <div className="mt-8 flex items-center text-xs font-semibold text-emerald-400 gap-1.5">
                <span>Enter Console</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

          </div>

          <div className="pt-8">
            <Link to="/admin" className="text-xs text-slate-500 hover:text-slate-400 transition-colors underline">
              SaaS Admin Gateway
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ====================
  // Merchant Workspace
  // ====================
  if (activeRole === 'merchant') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
        {/* Navigation */}
        <nav className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="text-indigo-400" size={24} />
            <span className="font-extrabold text-white">{restaurantName}</span>
            <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded text-[10px] font-semibold border border-indigo-500/20">MERCHANT</span>
          </div>
          <button 
            onClick={() => setActiveRole('selection')} 
            className="text-xs text-slate-400 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
          >
            Switch Workspace
          </button>
        </nav>

        <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-800 pb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Merchant Dashboard</h1>
              <p className="text-xs text-slate-400 mt-1">Manage catalog dishes, track live revenue, and edit branding settings.</p>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-1">
              <Plus size={16} /> Add Menu Item
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Today's Gross Sales", value: '$1,248.50', icon: DollarSign, color: 'text-indigo-400' },
              { label: 'Active Active Tables', value: '4 / 12', icon: QrCode, color: 'text-emerald-400' },
              { label: 'Active Kitchen Orders', value: '5 Tickets', icon: ChefHat, color: 'text-rose-400' }
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
                    <h3 className="text-2xl font-extrabold mt-1 text-white">{stat.value}</h3>
                  </div>
                  <div className={`p-3 bg-slate-700/20 rounded-xl ${stat.color}`}>
                    <Icon size={20} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dummy Menu List */}
          <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Core Menu Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {['Burgers & Sandwiches', 'Woodfired Pizzas', 'Beverages & Mocktails', 'Sides & Salads'].map((cat, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition-colors">
                  <div>
                    <span className="text-sm font-bold text-slate-200 block">{cat}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{5 + i * 2} Active Dishes</span>
                  </div>
                  <ChevronRight className="text-slate-500" size={16} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ====================
  // Chef Workspace
  // ====================
  if (activeRole === 'chef') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        <nav className="bg-rose-950/20 border-b border-rose-900/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="text-rose-400" size={24} />
            <span className="font-extrabold text-white">{restaurantName} Kitchen</span>
            <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded text-[10px] font-semibold border border-rose-500/20">KITCHEN MONITOR</span>
          </div>
          <button 
            onClick={() => setActiveRole('selection')} 
            className="text-xs text-slate-400 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
          >
            Switch Workspace
          </button>
        </nav>

        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Live Kitchen Tickets (KOT)</h1>
              <p className="text-xs text-slate-400">Instantly view incoming orders and update food preparation state.</p>
            </div>
            <div className="text-xs bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Realtime Sync: Active
            </div>
          </div>

          {/* Kitchen Tickets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: '#KOT-409', table: 'Table 4', time: '5m ago', items: ['2x Double Cheeseburger', '1x Classic Fries', '1x Iced Lemon Tea'], status: 'Preparing' },
              { id: '#KOT-410', table: 'Table 9', time: '2m ago', items: ['1x Margherita Pizza Large', '1x Garlic Breadsticks'], status: 'Pending' },
              { id: '#KOT-411', table: 'Table 1', time: '1m ago', items: ['3x Avocado Toast', '3x Matcha Latte'], status: 'Pending' }
            ].map((ticket, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between">
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-extrabold text-white text-base">{ticket.id}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <MapPin size={12} className="text-rose-400" />
                        <span>{ticket.table}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock size={12} />
                      <span>{ticket.time}</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5">
                    {ticket.items.map((item, index) => (
                      <li key={index} className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-850 p-4 border-t border-slate-800 flex items-center justify-between">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    ticket.status === 'Preparing' 
                      ? 'bg-amber-500/10 text-amber-400' 
                      : 'bg-indigo-500/10 text-indigo-400'
                  }`}>
                    {ticket.status}
                  </span>
                  <button className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1">
                    <Check size={14} /> Ready to Serve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ====================
  // Waiter Workspace
  // ====================
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <nav className="bg-emerald-950/20 border-b border-emerald-900/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="text-emerald-400" size={24} />
          <span className="font-extrabold text-white">{restaurantName} Floor</span>
          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-500/20">WAITER VIEW</span>
        </div>
        <button 
          onClick={() => setActiveRole('selection')} 
          className="text-xs text-slate-400 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
        >
          Switch Workspace
        </button>
      </nav>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Restaurant Floor Plan</h1>
            <p className="text-xs text-slate-400">Track dynamic table availability and place manual food orders.</p>
          </div>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-1 shadow-lg shadow-emerald-600/10">
            <Plus size={16} /> New Order
          </button>
        </div>

        {/* Floor Map */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { id: 'Table 1', capacity: '4 Seats', status: 'Occupied', color: 'border-rose-500/50 bg-rose-500/5' },
            { id: 'Table 2', capacity: '2 Seats', status: 'Available', color: 'border-slate-800 bg-slate-900/30' },
            { id: 'Table 3', capacity: '2 Seats', status: 'Available', color: 'border-slate-800 bg-slate-900/30' },
            { id: 'Table 4', capacity: '6 Seats', status: 'Occupied', color: 'border-rose-500/50 bg-rose-500/5' },
            { id: 'Table 5', capacity: '8 Seats', status: 'Available', color: 'border-slate-800 bg-slate-900/30' },
            { id: 'Table 6', capacity: '4 Seats', status: 'Available', color: 'border-slate-800 bg-slate-900/30' },
            { id: 'Table 7', capacity: '4 Seats', status: 'Available', color: 'border-slate-800 bg-slate-900/30' },
            { id: 'Table 8', capacity: '2 Seats', status: 'Occupied', color: 'border-rose-500/50 bg-rose-500/5' }
          ].map((table, i) => (
            <div key={i} className={`border rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-slate-600 transition-colors ${table.color}`}>
              <div>
                <h3 className="font-bold text-white text-base">{table.id}</h3>
                <span className="text-xs text-slate-500 block mt-0.5">{table.capacity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  table.status === 'Occupied' 
                    ? 'bg-rose-500/10 text-rose-400' 
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {table.status}
                </span>
                {table.status === 'Occupied' && (
                  <button className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                    Add Items
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ====================
// Root Application
// ====================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* RMS Platform Super Admin */}
        <Route path="/admin" element={<RmsSuperAdmin />} />

        {/* Multi-tenant Restaurant Staff Portal */}
        <Route path="/:restaurantSlug" element={<RestaurantPortal />} />

        {/* Fallback Selection */}
        <Route path="*" element={
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6">
            <div className="text-center space-y-6 max-w-md border border-slate-800 rounded-3xl p-8 bg-slate-900/40 backdrop-blur">
              <div className="bg-indigo-600/10 p-4 rounded-full w-fit mx-auto text-indigo-400">
                <UserCheck size={48} strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-bold">RMS Staff & Admin Portal</h1>
              <p className="text-slate-400 text-xs leading-relaxed">
                Welcome to the Restaurant Management System hub. If you are a platform administrator, visit the platform board. Otherwise, visit your specific restaurant staff portal URL.
              </p>
              <div className="flex flex-col gap-3 pt-4">
                <Link to="/admin" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-xs transition-colors shadow-lg shadow-indigo-600/10 block">
                  RMS Platform Admin
                </Link>
                <Link to="/burger-co" className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold py-3 rounded-xl text-xs transition-colors border border-slate-700 block">
                  Demo Restaurant Staff Portal
                </Link>
              </div>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
