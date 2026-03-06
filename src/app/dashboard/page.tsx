
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PersonalizedRecommendations } from "@/components/recommendations/PersonalizedRecommendations";
import { 
  BarChart3, 
  Package, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  ShoppingBag,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Dashboard() {
  const stats = [
    { title: "Active Orders", value: "12", icon: <Package className="h-5 w-5" />, color: "bg-blue-500" },
    { title: "Total Spend", value: "₹4,52,200", icon: <TrendingUp className="h-5 w-5" />, color: "bg-green-500" },
    { title: "Credit Available", value: "₹5,50,000", icon: <CreditCard className="h-5 w-5" />, color: "bg-amber-500" },
    { title: "Loyalty Points", value: "2,450", icon: <CheckCircle2 className="h-5 w-5" />, color: "bg-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-background pb-12">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Welcome back, Fashion Hub Retail!</h1>
            <p className="text-muted-foreground">Here's what's happening with your wholesale business today.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/catalog">
              <Button className="rounded-full bg-primary hover:bg-primary/90">
                <ShoppingBag className="h-4 w-4 mr-2" /> Browse Catalog
              </Button>
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="border-none shadow-md hover:shadow-lg transition-all overflow-hidden relative group">
              <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                {stat.icon}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-primary">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Dashboard Content */}
          <div className="lg:col-span-2 space-y-8">
            <PersonalizedRecommendations />

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-primary">Recent Orders</h2>
                <Button variant="link" className="text-primary font-bold">View All</Button>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="h-12 w-12 bg-secondary rounded-xl flex items-center justify-center shrink-0">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-bold text-primary">Order #ORD-229{i}</div>
                          <div className="text-xs text-muted-foreground">3 Items • Placed Jan 02, 2024</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                          <div className="font-bold text-primary">₹12,250.00</div>
                          <div className="flex items-center gap-1 text-xs text-amber-600 font-bold">
                            <Clock className="h-3 w-3" /> In Transit
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-lg">Track</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-8">
            <Card className="bg-primary text-primary-foreground border-none shadow-xl overflow-hidden relative">
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
              <CardHeader>
                <CardTitle className="text-lg">Credit Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="text-sm text-blue-100 mb-1">Available Limit</div>
                  <div className="text-4xl font-extrabold text-accent">₹5,50,000.00</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Usage (45%)</span>
                    <span>₹10,00,000.00 Total</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-accent w-[45%]" />
                  </div>
                </div>
                <Link href="/credit">
                  <Button className="w-full bg-white text-primary hover:bg-white/90 border-none font-bold mt-2">
                    Manage Credit
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Market Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { trend: "Organic Staples", growth: "+24%", tag: "Surging" },
                  { trend: "Winter Jackets", growth: "+18%", tag: "High Demand" },
                  { trend: "Wireless Tech", growth: "+12%", tag: "Steady" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-background hover:bg-secondary transition-colors cursor-pointer group">
                    <div>
                      <div className="text-sm font-bold text-primary">{item.trend}</div>
                      <div className="text-xs text-green-600 font-semibold">{item.growth} growth</div>
                    </div>
                    <Badge className="bg-primary/5 text-primary border-none text-[10px] uppercase font-bold group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                      {item.tag}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
