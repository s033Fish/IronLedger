import { Link, useLocation } from "react-router-dom";
import { Dumbbell, TrendingUp, Target, Activity, ListPlus } from "lucide-react";

const navigation = [
  { name: "Log", path: "/", icon: Dumbbell },
  { name: "History", path: "/history", icon: TrendingUp },
  { name: "Coach", path: "/coach", icon: Target },
  { name: "Track", path: "/track", icon: Activity },
  { name: "Exercises", path: "/exercises", icon: ListPlus },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-20">{children}</main>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around items-center h-16">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
                    isActive ? "text-crimson" : "text-charcoal hover:text-crimson"
                  }`}
                >
                  <Icon size={24} />
                  <span className="text-xs font-inter">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
