
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Goal, Achievement } from "@shared/schema";
import { format } from "date-fns";

export function GoalTracker() {
  const [showNewGoal, setShowNewGoal] = useState(false);
  
  const { data: goals } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
  });
  
  const { data: achievements } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements'],
  });

  const calculateProgress = (goal: Goal) => {
    const { data: tips } = useQuery(['/api/tips/range', goal.startDate, goal.endDate]);
    const total = tips?.reduce((sum, tip) => sum + tip.amount, 0) ?? 0;
    return Math.min((total / goal.targetAmount) * 100, 100);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Current Goals</CardTitle>
        </CardHeader>
        <CardContent>
          {goals?.map(goal => (
            <div key={goal.id} className="mb-4">
              <div className="flex justify-between mb-2">
                <span>{goal.period} Goal: ${goal.targetAmount}</span>
                <span>{format(new Date(goal.endDate), 'MMM d, yyyy')}</span>
              </div>
              <Progress value={calculateProgress(goal)} />
            </div>
          ))}
          <Button onClick={() => setShowNewGoal(true)} className="mt-4">
            Set New Goal
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {achievements?.map(achievement => (
              <div key={achievement.id} className="p-4 border rounded-lg">
                <h3 className="font-bold">{achievement.name}</h3>
                <p className="text-sm text-gray-600">{achievement.description}</p>
                <span className="text-xs text-gray-500">
                  {format(new Date(achievement.earnedAt), 'MMM d, yyyy')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
