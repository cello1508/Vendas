import React from 'react';
import { Card } from './Card';
import { CircularProgress } from './CircularProgress';

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  goalValue?: string;
  remainingValue?: string;
  remainingLabel?: string;
  progress?: number; // 0 to 100
  color?: 'blue' | 'green' | 'orange' | 'purple';
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subValue,
  goalValue,
  remainingValue,
  remainingLabel = "Faltam",
  progress,
  color = 'blue',
  icon
}) => {
  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    orange: 'text-orange-500',
    purple: 'text-purple-500'
  };

  const bgClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <Card className="flex flex-col justify-between h-full hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h2>
            </div>
            {icon && !progress && (
              <div className={`p-2 rounded-xl ${bgClasses[color]}`}>
                {icon}
              </div>
            )}
            {progress !== undefined && (
              <div className="ml-4">
                <CircularProgress
                  progress={progress}
                  size={52}
                  strokeWidth={5}
                  color={colorClasses[color]}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {subValue && !goalValue && <p className="text-sm text-gray-400 mb-4">{subValue}</p>}

      {(goalValue || remainingValue) && (
        <div className="mb-1 space-y-1">
          {goalValue && (
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-500 font-medium">Meta:</span>
              <span className="text-lg font-bold text-gray-800">{goalValue}</span>
            </div>
          )}
          {remainingValue && (
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-gray-400 font-medium">{remainingLabel}:</span>
              <span className="text-sm font-semibold text-gray-600">{remainingValue}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
