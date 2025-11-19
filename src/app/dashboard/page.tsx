'use client';

import { useState, useEffect } from 'react';
import { Plus, TrendingDown, Footprints, Droplets, Moon, Smile, Apple, Utensils, Coffee, Cookie, ChevronRight, Flame, Target, Calendar, LogOut, X, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Helper function for consistent number formatting
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

interface Profile {
  name: string;
  weight_current: number;
  weight_goal: number;
  weight_initial: number;
}

interface DailyStats {
  steps: number;
  water_glasses: number;
  sleep_hours: number;
  mood: string | null;
}

interface Meal {
  id: string;
  name: string;
  time: string;
  items: string;
  calories: number;
  category: 'green' | 'yellow' | 'orange';
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    steps: 0,
    water_glasses: 0,
    sleep_hours: 0,
    mood: null,
  });
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month'>('today');
  
  // Modal states
  const [showMealModal, setShowMealModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>('');
  
  // Form states
  const [mealForm, setMealForm] = useState({
    name: '',
    items: '',
    calories: '',
    category: 'green' as 'green' | 'yellow' | 'orange',
  });
  
  const [newWeight, setNewWeight] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setNewWeight(profileData.weight_current.toString());
      }

      // Load today's stats
      const today = new Date().toISOString().split('T')[0];
      const { data: statsData } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (statsData) {
        setDailyStats(statsData);
        setSelectedMood(statsData.mood);
      } else {
        // Create initial stats for today
        await supabase.from('daily_stats').insert({
          user_id: user.id,
          date: today,
        });
      }

      // Load today's meals
      const { data: mealsData } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('time', { ascending: true });

      if (mealsData) {
        setMeals(mealsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodChange = async (mood: string) => {
    setSelectedMood(mood);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('daily_stats')
      .update({ mood, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('date', today);
  };

  const updateDailyStat = async (field: 'steps' | 'water_glasses' | 'sleep_hours', increment: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newValue = Math.max(0, dailyStats[field] + increment);
    setDailyStats({ ...dailyStats, [field]: newValue });

    const today = new Date().toISOString().split('T')[0];
    await supabase
      .from('daily_stats')
      .update({ [field]: newValue, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('date', today);
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const { data, error } = await supabase
      .from('meals')
      .insert({
        user_id: user.id,
        date: today,
        name: mealForm.name,
        time: currentTime,
        items: mealForm.items,
        calories: parseInt(mealForm.calories),
        category: mealForm.category,
      })
      .select()
      .single();

    if (!error && data) {
      setMeals([...meals, data]);
      setShowMealModal(false);
      setMealForm({ name: '', items: '', calories: '', category: 'green' });
    }
  };

  const handleUpdateWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const weightValue = parseFloat(newWeight);
    
    const { error } = await supabase
      .from('profiles')
      .update({ weight_current: weightValue })
      .eq('user_id', user.id);

    if (!error) {
      setProfile({ ...profile!, weight_current: weightValue });
      setShowWeightModal(false);
    }
  };

  const openMealModal = (mealType: string) => {
    setSelectedMealType(mealType);
    setMealForm({ ...mealForm, name: mealType });
    setShowMealModal(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const userName = profile?.name || 'Usuário';
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const caloriesGoal = 1800;
  const stepsGoal = 10000;
  const waterGoal = 8;
  const sleepGoal = 8;

  const weightLost = profile ? profile.weight_initial - profile.weight_current : 0;
  const weightRemaining = profile ? profile.weight_current - profile.weight_goal : 0;
  const weightProgress = profile 
    ? ((profile.weight_initial - profile.weight_current) / (profile.weight_initial - profile.weight_goal)) * 100 
    : 0;

  const todayLesson = {
    title: 'Identificando Gatilhos Emocionais',
    duration: 4,
    category: 'TCC',
    progress: 0,
  };

  const moods = [
    { emoji: '😊', label: 'Ótimo', value: 'great' },
    { emoji: '🙂', label: 'Bem', value: 'good' },
    { emoji: '😐', label: 'Normal', value: 'neutral' },
    { emoji: '😕', label: 'Ruim', value: 'bad' },
  ];

  const weeklyStats = {
    weightLost: weightLost,
    avgCalories: totalCalories || 1650,
    avgSteps: dailyStats.steps || 7200,
    lessonsCompleted: 5,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24 md:pb-8">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Olá, {userName}! 👋
            </h1>
            <p className="text-gray-600 text-lg">Vamos continuar sua jornada hoje?</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

        {/* Daily Lesson Card - Hero Style */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-3xl p-8 mb-8 text-white shadow-2xl overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold mb-3">
                  🧠 {todayLesson.category}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
                  {todayLesson.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-white/90">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Hoje
                  </span>
                  <span className="flex items-center gap-1">
                    ⏱️ {todayLesson.duration} min
                  </span>
                </div>
              </div>
            </div>
            
            <button className="group bg-white text-emerald-600 px-8 py-4 rounded-2xl font-bold hover:shadow-2xl transition-all hover:scale-105 flex items-center gap-2">
              Começar Lição
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit">
          {(['today', 'week', 'month'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab === 'today' && 'Hoje'}
              {tab === 'week' && 'Semana'}
              {tab === 'month' && 'Mês'}
            </button>
          ))}
        </div>

        {/* Stats Grid - Circular Progress with Controls */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <CircularStatCard
            icon={<Flame className="w-6 h-6" />}
            label="Calorias"
            value={totalCalories}
            goal={caloriesGoal}
            unit="kcal"
            color="emerald"
            showControls={false}
          />
          <CircularStatCard
            icon={<Footprints className="w-6 h-6" />}
            label="Passos"
            value={dailyStats.steps}
            goal={stepsGoal}
            unit=""
            color="blue"
            showControls={true}
            onIncrement={() => updateDailyStat('steps', 1000)}
            onDecrement={() => updateDailyStat('steps', -1000)}
          />
          <CircularStatCard
            icon={<Droplets className="w-6 h-6" />}
            label="Água"
            value={dailyStats.water_glasses}
            goal={waterGoal}
            unit="copos"
            color="cyan"
            showControls={true}
            onIncrement={() => updateDailyStat('water_glasses', 1)}
            onDecrement={() => updateDailyStat('water_glasses', -1)}
          />
          <CircularStatCard
            icon={<Moon className="w-6 h-6" />}
            label="Sono"
            value={dailyStats.sleep_hours}
            goal={sleepGoal}
            unit="h"
            color="indigo"
            showControls={true}
            onIncrement={() => updateDailyStat('sleep_hours', 0.5)}
            onDecrement={() => updateDailyStat('sleep_hours', -0.5)}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Meals & Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-gray-900">Registrar Refeição</h3>
                <button 
                  onClick={() => openMealModal('Refeição')}
                  className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white hover:scale-110 transition-all shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MealTypeButton 
                  icon={<Coffee className="w-5 h-5" />} 
                  label="Café" 
                  time="Manhã" 
                  onClick={() => openMealModal('Café da Manhã')}
                />
                <MealTypeButton 
                  icon={<Apple className="w-5 h-5" />} 
                  label="Lanche" 
                  time="10h" 
                  onClick={() => openMealModal('Lanche')}
                />
                <MealTypeButton 
                  icon={<Utensils className="w-5 h-5" />} 
                  label="Almoço" 
                  time="12h" 
                  onClick={() => openMealModal('Almoço')}
                />
                <MealTypeButton 
                  icon={<Cookie className="w-5 h-5" />} 
                  label="Jantar" 
                  time="19h" 
                  onClick={() => openMealModal('Jantar')}
                />
              </div>
            </div>

            {/* Recent Meals */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-gray-900">Refeições de Hoje</h3>
                <button className="text-emerald-600 font-semibold text-sm hover:underline">
                  Ver todas
                </button>
              </div>
              {meals.length > 0 ? (
                <div className="space-y-3">
                  {meals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma refeição registrada hoje</p>
                  <p className="text-sm mt-2">Clique em + para adicionar</p>
                </div>
              )}
            </div>

            {/* Weekly Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl shadow-sm border border-blue-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-600" />
                Resumo da Semana
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <WeeklyStat label="Peso perdido" value={`${weightLost.toFixed(1)} kg`} trend="down" />
                <WeeklyStat label="Média de calorias" value={weeklyStats.avgCalories} trend="neutral" />
                <WeeklyStat label="Média de passos" value={formatNumber(weeklyStats.avgSteps)} trend="up" />
                <WeeklyStat label="Lições completas" value={`${weeklyStats.lessonsCompleted}/7`} trend="up" />
              </div>
            </div>
          </div>

          {/* Right Column - Mood & Insights */}
          <div className="space-y-6">
            {/* Mood Tracker */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Smile className="w-5 h-5 text-amber-500" />
                Como você está?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {moods.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => handleMoodChange(mood.value)}
                    className={`p-5 rounded-2xl border-2 transition-all ${
                      selectedMood === mood.value
                        ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-4xl mb-2">{mood.emoji}</div>
                    <div className="text-sm font-semibold text-gray-700">{mood.label}</div>
                  </button>
                ))}
              </div>
              {selectedMood && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-sm text-emerald-800">
                    Ótimo! Registramos como você está se sentindo hoje. 💚
                  </p>
                </div>
              )}
            </div>

            {/* Daily Tip */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-sm border border-amber-200 p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center text-white text-xl">
                  💡
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Dica do Dia</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Beba um copo de água antes das refeições. Isso ajuda na saciedade e hidratação!
                  </p>
                </div>
              </div>
            </div>

            {/* Weight Progress */}
            {profile && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-emerald-500" />
                    Seu Progresso
                  </h3>
                  <button
                    onClick={() => setShowWeightModal(true)}
                    className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm"
                  >
                    Atualizar
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <span className="text-sm font-medium text-gray-600">Peso atual</span>
                    <span className="text-2xl font-bold text-gray-900">{profile.weight_current} kg</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl">
                    <span className="text-sm font-medium text-emerald-700">Meta</span>
                    <span className="text-2xl font-bold text-emerald-600">{profile.weight_goal} kg</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                    <span className="text-sm font-medium text-blue-700">Faltam</span>
                    <span className="text-2xl font-bold text-blue-600">{weightRemaining.toFixed(1)} kg</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                      <span>Início: {profile.weight_initial} kg</span>
                      <span>{Math.round(weightProgress)}% completo</span>
                    </div>
                    <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 shadow-lg" 
                        style={{ width: `${Math.min(weightProgress, 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meal Modal */}
      {showMealModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Adicionar {selectedMealType}</h3>
              <button
                onClick={() => setShowMealModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddMeal} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome da Refeição
                </label>
                <input
                  type="text"
                  value={mealForm.name}
                  onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  placeholder="Ex: Café da Manhã"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Itens
                </label>
                <textarea
                  value={mealForm.items}
                  onChange={(e) => setMealForm({ ...mealForm, items: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none resize-none"
                  placeholder="Ex: Pão integral, queijo branco, café"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Calorias
                </label>
                <input
                  type="number"
                  value={mealForm.calories}
                  onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  placeholder="Ex: 350"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Categoria
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setMealForm({ ...mealForm, category: 'green' })}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      mealForm.category === 'green'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">🟢</div>
                    <div className="text-xs font-semibold">Ótimo</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMealForm({ ...mealForm, category: 'yellow' })}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      mealForm.category === 'yellow'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">🟡</div>
                    <div className="text-xs font-semibold">Bom</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMealForm({ ...mealForm, category: 'orange' })}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      mealForm.category === 'orange'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">🟠</div>
                    <div className="text-xs font-semibold">Moderado</div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all mt-6"
              >
                Adicionar Refeição
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Weight Update Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Atualizar Peso</h3>
              <button
                onClick={() => setShowWeightModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateWeight} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Novo Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-2xl font-bold text-center"
                  placeholder="78.5"
                  required
                />
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 Registre seu peso regularmente para acompanhar seu progresso!
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Salvar Peso
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Circular Stat Card Component
function CircularStatCard({
  icon,
  label,
  value,
  goal,
  unit,
  color,
  showControls = false,
  onIncrement,
  onDecrement,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
  showControls?: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
}) {
  const percentage = Math.min((value / goal) * 100, 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', stroke: 'stroke-emerald-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', stroke: 'stroke-blue-500' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', stroke: 'stroke-cyan-500' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', stroke: 'stroke-indigo-500' },
  };

  const colors = colorClasses[color as keyof typeof colorClasses];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all">
      <div className="flex flex-col items-center">
        {/* Circular Progress */}
        <div className="relative w-28 h-28 mb-4">
          <svg className="transform -rotate-90 w-28 h-28">
            <circle
              cx="56"
              cy="56"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="56"
              cy="56"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className={colors.stroke}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className={`absolute inset-0 flex items-center justify-center ${colors.text}`}>
            {icon}
          </div>
        </div>

        {/* Label & Value */}
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
          <div className="text-xl font-bold text-gray-900">
            {formatNumber(value)}
            {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            de {formatNumber(goal)} {unit}
          </div>
        </div>

        {/* Controls */}
        {showControls && (
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={onDecrement}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <Minus className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={onIncrement}
              className={`w-8 h-8 rounded-lg ${colors.bg} hover:opacity-80 flex items-center justify-center transition-colors`}
            >
              <Plus className={`w-4 h-4 ${colors.text}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Meal Type Button
function MealTypeButton({ icon, label, time, onClick }: { icon: React.ReactNode; label: string; time: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="group flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all hover:shadow-md"
    >
      <div className="text-emerald-600 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="text-center">
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{time}</div>
      </div>
    </button>
  );
}

// Meal Card Component
function MealCard({ meal }: { meal: Meal }) {
  const categoryConfig = {
    green: { 
      bg: 'bg-emerald-50', 
      text: 'text-emerald-700', 
      border: 'border-emerald-200',
      icon: '🟢',
      label: 'Ótimo'
    },
    yellow: { 
      bg: 'bg-amber-50', 
      text: 'text-amber-700', 
      border: 'border-amber-200',
      icon: '🟡',
      label: 'Bom'
    },
    orange: { 
      bg: 'bg-orange-50', 
      text: 'text-orange-700', 
      border: 'border-orange-200',
      icon: '🟠',
      label: 'Moderado'
    },
  };

  const config = categoryConfig[meal.category];

  return (
    <div className="group flex items-center justify-between p-5 rounded-2xl border-2 border-gray-100 hover:border-gray-200 hover:shadow-md transition-all cursor-pointer">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-gray-900">{meal.name}</span>
          <span className="text-xs text-gray-500">{meal.time}</span>
        </div>
        <div className="text-sm text-gray-600">{meal.items}</div>
      </div>
      <div className="text-right ml-4">
        <div className="font-bold text-gray-900 text-lg mb-2">{meal.calories} cal</div>
        <div className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border-2 font-semibold ${config.bg} ${config.text} ${config.border}`}>
          <span>{config.icon}</span>
          {config.label}
        </div>
      </div>
    </div>
  );
}

// Weekly Stat Component
function WeeklyStat({ label, value, trend }: { label: string; value: string | number; trend: 'up' | 'down' | 'neutral' }) {
  const trendConfig = {
    up: { icon: '↗️', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    down: { icon: '↘️', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    neutral: { icon: '→', color: 'text-gray-600', bg: 'bg-gray-50' },
  };

  const config = trendConfig[trend];

  return (
    <div className={`p-4 rounded-2xl ${config.bg} border border-gray-200`}>
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-gray-900">{value}</span>
        <span className="text-lg">{config.icon}</span>
      </div>
    </div>
  );
}
