import React from 'react';
import { Card } from './Card';
import { CircularProgress } from './CircularProgress';

interface GoalHeroProps {
    current: number;
    goal: number;
    deadline?: string;
    daysRemaining?: number;
    dailyPace?: number;
}

export const GoalHero: React.FC<GoalHeroProps> = ({ current, goal, deadline, daysRemaining, dailyPace }) => {
    const progress = Math.min(100, Math.max(0, (current / (goal || 1)) * 100));
    const remaining = Math.max(0, goal - current);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 overflow-hidden relative min-h-[300px] flex flex-col justify-center items-center text-center p-6 md:p-10">
            <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-40 bg-indigo-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

            <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col-reverse md:flex-row items-center justify-between gap-8 md:gap-12">
                <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left w-full">
                    <div>
                        <h3 className="text-lg sm:text-2xl font-medium text-gray-500 uppercase tracking-widest mb-1 md:mb-2">Meta de Faturamento</h3>
                        <div className="flex flex-col sm:flex-row items-center sm:items-baseline justify-center md:justify-start gap-2 sm:gap-4">
                            <span className="text-5xl sm:text-7xl lg:text-8xl font-black text-gray-900 tracking-tighter">
                                {formatCurrency(current)}
                            </span>
                            <span className="text-lg sm:text-2xl text-gray-400 font-medium">/ {formatCurrency(goal)}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-blue-100 inline-block shadow-sm">
                            <p className="text-sm sm:text-base text-gray-500 font-medium mb-1">Faltam para atingir a meta</p>
                            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600 tracking-tight">
                                {formatCurrency(remaining)}
                            </p>
                        </div>

                        {!deadline && (
                            <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-100 inline-block shadow-sm">
                                <p className="text-sm sm:text-base text-gray-500 font-medium mb-1">Prazo Final</p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-400 tracking-tight">
                                    Não definido
                                </p>
                                <p className="text-xs text-gray-400 mt-2 font-medium">
                                    Configure nas opções
                                </p>
                            </div>
                        )}

                        {deadline && daysRemaining !== undefined && daysRemaining > 0 && dailyPace !== undefined && (
                            <div className="bg-orange-50/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-orange-100 inline-block shadow-sm">
                                <p className="text-sm sm:text-base text-orange-600 font-medium mb-1">Ritmo Diário Necessário</p>
                                <p className="text-2xl sm:text-3xl font-bold text-orange-700 tracking-tight">
                                    {formatCurrency(dailyPace)}
                                    <span className="text-sm font-normal text-orange-500 ml-1">/dia</span>
                                </p>
                                <p className="text-xs text-orange-400 mt-2 font-medium">
                                    {daysRemaining} dias restantes
                                </p>
                            </div>
                        )}
                        {deadline && daysRemaining !== undefined && daysRemaining <= 0 && (
                            <div className="bg-red-50/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-red-100 inline-block shadow-sm">
                                <p className="text-sm sm:text-base text-red-600 font-medium mb-1">Prazo Final</p>
                                <p className="text-2xl sm:text-3xl font-bold text-red-700 tracking-tight">
                                    Expirado
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0">
                    <div className="relative">
                        <div className="hidden md:block">
                            <CircularProgress
                                progress={progress}
                                size={220}
                                strokeWidth={16}
                                color="text-blue-600"
                                trackColor="text-blue-100"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-4xl font-black text-gray-800">{progress.toFixed(0)}%</span>
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Concluído</span>
                            </div>
                        </div>
                        {/* Smaller version for mobile */}
                        <div className="md:hidden">
                            <CircularProgress
                                progress={progress}
                                size={160}
                                strokeWidth={12}
                                color="text-blue-600"
                                trackColor="text-blue-100"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-gray-800">{progress.toFixed(0)}%</span>
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Concluído</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};
