
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  ArrowUpRight, 
  AlertCircle, 
  History, 
  Calendar,
  CheckCircle2,
  Lock
} from "lucide-react";

export default function CreditPage() {
  const totalLimit = 1000000;
  const usedAmount = 450000;
  const availableAmount = totalLimit - usedAmount;
  const usedPercentage = (usedAmount / totalLimit) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Credit Line Management</h1>
            <p className="text-muted-foreground">Monitor your business credit status and repayment history</p>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full font-bold">
            <ArrowUpRight className="h-4 w-4 mr-2" /> Request Limit Increase
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2 border-none shadow-lg bg-white overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <CreditCard className="h-12 w-12 text-primary/5 opacity-20 rotate-12" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Current Credit Utilization
              </CardTitle>
              <CardDescription>Your limit is automatically refreshed upon repayment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground font-medium">Used Credit</span>
                  <div className="text-4xl font-extrabold text-primary">₹{usedAmount.toLocaleString('en-IN')}</div>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-sm text-muted-foreground font-medium">Total Limit</span>
                  <div className="text-xl font-bold text-muted-foreground">₹{totalLimit.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Usage: {usedPercentage.toFixed(1)}%</span>
                  <span className="text-primary">₹{availableAmount.toLocaleString('en-IN')} Available</span>
                </div>
                <Progress value={usedPercentage} className="h-4 bg-secondary" />
              </div>

              <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-3 border border-blue-100">
                <Calendar className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm text-primary/80">
                  Next repayment of <span className="font-bold text-primary">₹12,000</span> is due in <span className="font-bold text-primary">12 days</span>.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-white">Credit Status</CardTitle>
              <CardDescription className="text-blue-100">Verified Platinum Tier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">Account Active</div>
                  <div className="text-xs text-blue-200">Excellent Repayment Score</div>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Interest Rate</span>
                  <span className="font-bold">0% (Early Bird)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-200">Late Fee</span>
                  <span className="font-bold">2.5% Monthly</span>
                </div>
              </div>
              
              <Button variant="secondary" className="w-full bg-accent text-accent-foreground border-none hover:bg-accent/90">
                Make Repayment
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-primary">Recent Transactions</h2>
          </div>
          
          <Card className="border-none shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary text-primary uppercase text-xs font-bold">
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Description</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary">
                  {[
                    { date: "Dec 28, 2023", desc: "Wholesale Electronics Order #ORD-9981", status: "Deducted", amount: "-₹1,20,000.00", color: "text-red-600" },
                    { date: "Dec 20, 2023", desc: "Repayment - Bank Transfer", status: "Repaid", amount: "+₹2,50,000.00", color: "text-green-600" },
                    { date: "Dec 15, 2023", desc: "Fashion Apparel Restock #ORD-8821", status: "Deducted", amount: "-₹3,30,000.00", color: "text-red-600" },
                    { date: "Dec 05, 2023", desc: "Credit Line Activation Reward", status: "Added", amount: "+₹5,000.00", color: "text-green-600" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-background/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{row.date}</td>
                      <td className="px-6 py-4 font-medium text-primary">{row.desc}</td>
                      <td className="px-6 py-4">
                        <Badge variant={row.status === 'Repaid' || row.status === 'Added' ? 'default' : 'secondary'} className={row.status === 'Repaid' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${row.color}`}>{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Warning Section */}
        <div className="mt-8 p-6 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4">
          <div className="bg-red-100 p-2 rounded-xl text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-900">Overdue Warning Policy</h3>
            <p className="text-red-700 text-sm mt-1">
              Retailers with overdue balances exceeding 7 days will have their ordering capabilities automatically 
              <span className="font-bold"> BLOCKED</span>. Please ensure timely repayments to maintain your verified status and access smart deals.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
