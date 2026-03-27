import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { 
  Loader2, 
  ArrowLeft,
  Crown,
  Trophy,
  Medal,
  User,
  RefreshCw
} from "lucide-react";

interface LeaderboardUser {
  id: string;
  telegram_username: string | null;
  telegram_user_id: string;
  total_earned: number;
  rank: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
    };
    checkAuth();
  }, [navigate]);

  // Fetch leaderboard data using secure function
  const fetchLeaderboard = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.rpc('get_leaderboard');
    
    if (error) {
      console.error('Leaderboard fetch error:', error);
    } else {
      setLeaderboard(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('leaderboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_balances'
        },
        () => {
          // Refetch on any change
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const maskUsername = (username: string | null, id: string) => {
    if (username) {
      if (username.length > 10) {
        return username.substring(0, 10) + '...';
      }
      return username;
    }
    // Mask user ID
    if (id.length > 12) {
      return id.substring(0, 6) + '...' + id.slice(-4);
    }
    return id;
  };

  const getUserRank = () => {
    if (!user || !leaderboard.length) return null;
    const index = leaderboard.findIndex(u => u.telegram_user_id === user.id);
    return index >= 0 ? index + 1 : null;
  };

  const getTopThree = () => {
    if (!leaderboard || leaderboard.length < 1) return { first: null, second: null, third: null };
    return {
      first: leaderboard[0] || null,
      second: leaderboard[1] || null,
      third: leaderboard[2] || null
    };
  };

  const topThree = getTopThree();
  const restOfList = leaderboard?.slice(3) || [];
  const userRank = getUserRank();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-primary p-4 pb-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-bold text-primary-foreground">লিডারবোর্ড</h1>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={fetchLeaderboard}
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Top 3 Podium Card */}
        <div className="px-4 -mt-2">
          <Card className="bg-primary border-0 overflow-hidden shadow-xl">
            <CardContent className="p-4 pt-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-foreground" />
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 mx-auto text-primary-foreground/50 mb-2" />
                  <p className="text-primary-foreground/70">কোনো ইউজার নেই</p>
                </div>
              ) : (
                <div className="flex items-end justify-center gap-3">
                  {/* 2nd Place */}
                  <div className="flex flex-col items-center flex-1">
                    {topThree.second ? (
                      <>
                        <div className="relative mb-2">
                          <div className="w-14 h-14 rounded-full bg-primary-foreground/20 border-2 border-primary-foreground/40 flex items-center justify-center overflow-hidden">
                            <User className="w-8 h-8 text-primary-foreground" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary-foreground/30 flex items-center justify-center text-xs font-bold text-primary-foreground shadow-lg">
                            2
                          </div>
                        </div>
                        <p className="text-primary-foreground text-xs font-medium truncate max-w-[70px] text-center">
                          {maskUsername(topThree.second.telegram_username, topThree.second.telegram_user_id)}
                        </p>
                        <p className="text-primary-foreground font-bold text-sm">
                          ৳{topThree.second.total_earned.toFixed(0)}
                        </p>
                      </>
                    ) : (
                      <div className="h-24 flex items-center justify-center">
                        <span className="text-primary-foreground/50">-</span>
                      </div>
                    )}
                  </div>

                  {/* 1st Place */}
                  <div className="flex flex-col items-center flex-1">
                    {topThree.first ? (
                      <>
                        <Crown className="w-8 h-8 text-amber-400 mb-1 animate-pulse drop-shadow-lg" />
                        <div className="relative mb-2">
                          <div className="w-[72px] h-[72px] rounded-full bg-primary-foreground/30 border-3 border-amber-400 flex items-center justify-center overflow-hidden shadow-lg">
                            <User className="w-10 h-10 text-primary-foreground" />
                          </div>
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                            <Trophy className="w-4 h-4 text-primary-foreground" />
                          </div>
                        </div>
                        <p className="text-primary-foreground text-sm font-bold truncate max-w-[90px] text-center">
                          {maskUsername(topThree.first.telegram_username, topThree.first.telegram_user_id)}
                        </p>
                        <p className="text-primary-foreground text-lg font-bold">
                          ৳{topThree.first.total_earned.toFixed(0)}
                        </p>
                      </>
                    ) : (
                      <div className="h-28 flex items-center justify-center">
                        <span className="text-primary-foreground/50">-</span>
                      </div>
                    )}
                  </div>

                  {/* 3rd Place */}
                  <div className="flex flex-col items-center flex-1">
                    {topThree.third ? (
                      <>
                        <div className="relative mb-2">
                          <div className="w-14 h-14 rounded-full bg-primary-foreground/20 border-2 border-amber-600/50 flex items-center justify-center overflow-hidden">
                            <User className="w-8 h-8 text-primary-foreground" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-xs font-bold text-primary-foreground shadow-lg">
                            3
                          </div>
                        </div>
                        <p className="text-primary-foreground text-xs font-medium truncate max-w-[70px] text-center">
                          {maskUsername(topThree.third.telegram_username, topThree.third.telegram_user_id)}
                        </p>
                        <p className="text-primary-foreground font-bold text-sm">
                          ৳{topThree.third.total_earned.toFixed(0)}
                        </p>
                      </>
                    ) : (
                      <div className="h-24 flex items-center justify-center">
                        <span className="text-primary-foreground/50">-</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rest of Leaderboard */}
        <div className="p-4 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : restOfList.length === 0 && leaderboard.length <= 3 ? (
            <Card className="border-2 border-dashed border-border">
              <CardContent className="py-8 text-center">
                <Medal className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground text-sm">আর কোনো ইউজার নেই</p>
              </CardContent>
            </Card>
          ) : (
            restOfList.map((item, index) => {
              const isCurrentUser = item.telegram_user_id === user?.id;
              return (
                <Card 
                  key={item.id} 
                  className={`border-0 transition-all ${
                    isCurrentUser 
                      ? 'bg-primary/10 ring-2 ring-primary/30' 
                      : index % 2 === 0 ? 'bg-muted/50' : 'bg-card'
                  } hover:shadow-md`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {index + 4}
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCurrentUser ? 'bg-primary/20' : 'bg-primary/10'
                      }`}>
                        <User className={`w-5 h-5 ${isCurrentUser ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                          {maskUsername(item.telegram_username, item.telegram_user_id)}
                          {isCurrentUser && <span className="text-xs ml-1">(আপনি)</span>}
                        </p>
                      </div>
                      <p className={`text-base font-bold ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                        ৳{item.total_earned.toFixed(0)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {/* Total Users Info */}
          <div className="text-center pt-4">
            <p className="text-muted-foreground text-sm">
              মোট {leaderboard.length} জন ইউজার
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
