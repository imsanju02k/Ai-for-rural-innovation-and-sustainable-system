import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import { TrendingUp, TrendingDown, Search } from 'lucide-react'

const MarketPrices = () => {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')

    const marketData = [
        {
            crop: 'Rice',
            price: '₹2,550',
            change: '+12%',
            trend: 'up',
            market: 'Local Mandi',
        },
        {
            crop: 'Wheat',
            price: '₹2,100',
            change: '+8%',
            trend: 'up',
            market: 'Local Mandi',
        },
        {
            crop: 'Cotton',
            price: '₹6,800',
            change: '-3%',
            trend: 'down',
            market: 'Regional Market',
        },
        {
            crop: 'Sugarcane',
            price: '₹3,200',
            change: '+5%',
            trend: 'up',
            market: 'Local Mandi',
        },
        {
            crop: 'Maize',
            price: '₹1,850',
            change: '-2%',
            trend: 'down',
            market: 'Regional Market',
        },
    ]

    const filteredData = marketData.filter(item =>
        item.crop.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-neutral-bg pb-20">
            <Header />

            <div className="max-w-md mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold text-neutral-text mb-6">
                    Market Prices
                </h1>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-text-secondary" size={20} />
                        <input
                            type="text"
                            placeholder="Search crops..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* Market Prices List */}
                <div className="space-y-4">
                    {filteredData.map((item, index) => (
                        <div key={index} className="card">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-neutral-text">
                                        {item.crop}
                                    </h3>
                                    <p className="text-sm text-neutral-text-secondary mt-1">
                                        {item.market}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-neutral-text">
                                        {item.price}
                                    </p>
                                    <div className={`flex items-center justify-end mt-1 ${
                                        item.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {item.trend === 'up' ? (
                                            <TrendingUp size={16} />
                                        ) : (
                                            <TrendingDown size={16} />
                                        )}
                                        <span className="text-sm font-medium ml-1">
                                            {item.change}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredData.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-neutral-text-secondary">
                            No crops found matching "{searchQuery}"
                        </p>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    )
}

export default MarketPrices
