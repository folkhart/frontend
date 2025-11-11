import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyChallengeApi } from '@/lib/api';
import { Check, Trophy, Gem, Loader2 } from 'lucide-react';
import { useState } from 'react';
import challengeIcon from '@/assets/ui/achievement.png';
import goldIcon from '@/assets/ui/gold.png';

export default function DailyChallengesTab() {
  const queryClient = useQueryClient();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Fetch challenges
  const { data: challengeData, isLoading } = useQuery({
    queryKey: ['dailyChallenges'],
    queryFn: async () => {
      const { data } = await dailyChallengeApi.getChallenges();
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Claim individual reward
  const claimRewardMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      setClaimingId(challengeId);
      const { data } = await dailyChallengeApi.claimReward(challengeId);
      return data;
    },
    onSuccess: (data) => {
      (window as any).showToast?.(
        `Claimed +${data.goldReward} gold!`,
        'success'
      );
      queryClient.invalidateQueries({ queryKey: ['dailyChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
      setClaimingId(null);
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.message || 'Failed to claim reward',
        'error'
      );
      setClaimingId(null);
    },
  });

  // Claim bonus
  const claimBonusMutation = useMutation({
    mutationFn: async () => {
      const { data } = await dailyChallengeApi.claimBonus();
      return data;
    },
    onSuccess: (data) => {
      (window as any).showToast?.(
        `🎉 ${data.message}! +${data.gemsReward} gems!`,
        'success'
      );
      queryClient.invalidateQueries({ queryKey: ['dailyChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['character'] });
    },
    onError: (error: any) => {
      (window as any).showToast?.(
        error.response?.data?.message || 'Failed to claim bonus',
        'error'
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const challenges = challengeData?.challenges || [];
  const allCompleted = challengeData?.allCompleted || false;
  const bonusClaimed = challengeData?.bonusClaimed || false;
  const bonusReward = challengeData?.bonusReward || 50;

  const completedCount = challenges.filter((c: any) => c.completed).length;
  const totalCount = challenges.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="bg-gradient-to-b from-amber-900 to-amber-950 border-b-4 border-amber-700 p-4"
        style={{ borderRadius: '0' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <img
            src={challengeIcon}
            alt="Daily Challenges"
            className="w-12 h-12"
            style={{ imageRendering: 'pixelated' }}
          />
          <div className="flex-1">
            <h2
              className="text-2xl font-bold text-white"
              style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}
            >
              DAILY CHALLENGES
            </h2>
            <p className="text-amber-300 text-sm" style={{ fontFamily: 'monospace' }}>
              Complete all challenges for bonus rewards!
            </p>
          </div>
          <div className="text-right">
            <p className="text-amber-300 text-xs font-bold">PROGRESS</p>
            <p className="text-white text-2xl font-bold" style={{ fontFamily: 'monospace' }}>
              {completedCount}/{totalCount}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className="w-full h-6 bg-stone-900 border-2 border-stone-700 overflow-hidden relative"
          style={{ borderRadius: '0' }}
        >
          <div
            className="h-full bg-gradient-to-r from-green-600 to-green-500 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-white font-bold text-sm"
              style={{
                fontFamily: 'monospace',
                textShadow: '1px 1px 2px #000',
              }}
            >
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Challenges List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {challenges.map((challenge: any, index: number) => {
          const progress = Math.min(challenge.currentProgress, challenge.targetValue);
          const percentage = (progress / challenge.targetValue) * 100;
          const isCompleted = challenge.completed;
          const isClaimed = challenge.rewardClaimed;

          return (
            <div
              key={challenge.id}
              className={`border-2 p-4 transition ${
                isCompleted
                  ? 'bg-green-900/20 border-green-600'
                  : 'bg-stone-900 border-stone-700 hover:border-amber-600'
              }`}
              style={{ borderRadius: '0', boxShadow: '0 3px 0 rgba(0,0,0,0.5)' }}
            >
              <div className="flex items-center gap-4">
                {/* Challenge Number */}
                <div
                  className={`w-12 h-12 flex items-center justify-center border-2 font-bold text-xl ${
                    isCompleted
                      ? 'bg-green-700 border-green-500 text-white'
                      : 'bg-stone-800 border-stone-600 text-gray-400'
                  }`}
                  style={{ borderRadius: '0', fontFamily: 'monospace' }}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : index + 1}
                </div>

                {/* Challenge Info */}
                <div className="flex-1">
                  <h3
                    className={`font-bold text-lg mb-1 ${
                      isCompleted ? 'text-green-400' : 'text-white'
                    }`}
                    style={{ fontFamily: 'monospace' }}
                  >
                    {challenge.description}
                  </h3>

                  {/* Progress Bar */}
                  <div
                    className="w-full h-5 bg-stone-950 border border-stone-700 overflow-hidden mb-2 relative"
                    style={{ borderRadius: '0' }}
                  >
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-green-600 to-green-500'
                          : 'bg-gradient-to-r from-amber-600 to-amber-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="text-white text-xs font-bold"
                        style={{
                          fontFamily: 'monospace',
                          textShadow: '1px 1px 2px #000',
                        }}
                      >
                        {progress}/{challenge.targetValue}
                      </span>
                    </div>
                  </div>

                  {/* Reward */}
                  <div className="flex items-center gap-2">
                    <img
                      src={goldIcon}
                      alt="Gold"
                      className="w-5 h-5"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <span className="text-yellow-400 font-bold text-sm" style={{ fontFamily: 'monospace' }}>
                      +{challenge.goldReward.toLocaleString()} gold
                    </span>
                  </div>
                </div>

                {/* Claim Button */}
                <div>
                  {isClaimed ? (
                    <div
                      className="px-6 py-3 bg-gray-700 border-2 border-gray-600 text-gray-400 font-bold"
                      style={{ borderRadius: '0', fontFamily: 'monospace' }}
                    >
                      CLAIMED
                    </div>
                  ) : isCompleted ? (
                    <button
                      onClick={() => claimRewardMutation.mutate(challenge.playerChallengeId)}
                      disabled={claimRewardMutation.isPending && claimingId === challenge.playerChallengeId}
                      className="px-6 py-3 bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 border-2 border-green-400 text-white font-bold transition disabled:opacity-50"
                      style={{
                        borderRadius: '0',
                        boxShadow: '0 4px 0 #15803d',
                        fontFamily: 'monospace',
                      }}
                    >
                      {claimRewardMutation.isPending && claimingId === challenge.playerChallengeId ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'CLAIM'
                      )}
                    </button>
                  ) : (
                    <div
                      className="px-6 py-3 bg-stone-800 border-2 border-stone-700 text-gray-500 font-bold"
                      style={{ borderRadius: '0', fontFamily: 'monospace' }}
                    >
                      LOCKED
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bonus Section */}
      {allCompleted && (
        <div
          className="border-t-4 border-amber-700 p-4 bg-gradient-to-b from-purple-900 to-purple-950"
          style={{ borderRadius: '0' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Trophy className="w-12 h-12 text-yellow-400" />
              <div>
                <h3
                  className="text-xl font-bold text-white mb-1"
                  style={{ fontFamily: 'monospace', textShadow: '2px 2px 0 #000' }}
                >
                  🎉 ALL CHALLENGES COMPLETE!
                </h3>
                <div className="flex items-center gap-2">
                  <Gem className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-400 font-bold" style={{ fontFamily: 'monospace' }}>
                    Bonus: +{bonusReward} gems
                  </span>
                </div>
              </div>
            </div>

            {bonusClaimed ? (
              <div
                className="px-8 py-4 bg-gray-700 border-2 border-gray-600 text-gray-400 font-bold text-lg"
                style={{ borderRadius: '0', fontFamily: 'monospace' }}
              >
                CLAIMED
              </div>
            ) : (
              <button
                onClick={() => claimBonusMutation.mutate()}
                disabled={claimBonusMutation.isPending}
                className="px-8 py-4 bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 border-2 border-purple-400 text-white font-bold text-lg transition disabled:opacity-50 animate-pulse"
                style={{
                  borderRadius: '0',
                  boxShadow: '0 6px 0 #581c87',
                  fontFamily: 'monospace',
                }}
              >
                {claimBonusMutation.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : (
                  'CLAIM BONUS'
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
