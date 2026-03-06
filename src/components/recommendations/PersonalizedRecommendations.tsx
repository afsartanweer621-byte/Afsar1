"use client";

import { useEffect, useState } from "react";
import { personalizedProductRecommendations, type PersonalizedProductRecommendationsOutput } from "@/ai/flows/personalized-product-recommendations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PersonalizedRecommendations() {
  const [recommendations, setRecommendations] = useState<PersonalizedProductRecommendationsOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecs() {
      try {
        const result = await personalizedProductRecommendations({
          pastPurchases: ["Goodyear-welted Oxford Shoes", "Hand-burnished Chelsea Boots"],
          browsingHistory: ["Premium Calfskin Loafers", "Minimalist Suede Sneakers", "Derby Shoes"],
          similarRetailerTrends: ["Italian Leather Soles", "Monk Strap Silhouettes"],
        });
        setRecommendations(result);
      } catch (error) {
        // Error is handled by global listener if implemented, or we can just log here
        console.error("Failed to fetch recommendations:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecs();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-accent fill-accent" />
        <h2 className="text-2xl font-black uppercase tracking-tighter text-primary">AI Smart Recommendations</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations?.recommendations.map((item, idx) => (
          <Card key={idx} className="group overflow-hidden hover:shadow-2xl transition-all border-none bg-white">
            <CardHeader className="pb-2">
              <div className="text-[10px] font-black text-accent uppercase tracking-widest mb-2">Exclusive Deal</div>
              <CardTitle className="text-lg font-black uppercase tracking-tight group-hover:text-accent transition-colors">{item.productName}</CardTitle>
              <CardDescription className="line-clamp-2 text-xs uppercase tracking-wider leading-relaxed">{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full gap-2 hover:bg-primary hover:text-background border-primary/10 rounded-none uppercase font-black text-[10px] tracking-widest h-12">
                Analyze SKU <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
