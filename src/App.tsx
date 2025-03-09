import { useState, useEffect } from "react";
import './App.css';
import TreatingCalendar from './components/TreatingCalendar';
import Settings from './components/Settings';
import TeamInfo from './components/TeamInfo';
import EmailTest from './components/EmailTest';
import { getUserId } from './lib/userIdUtils';
import { useTeamInfo } from './hooks/useTeamInfo';
import ZustandTest from './components/ZustandTest';
import { useTreatingStore } from './stores/treatingStore';

export default function App() {
  // 使用单一状态来控制当前打开的tab
  const [activeTab, setActiveTab] = useState<'none' | 'settings' | 'emailTest' | 'teamInfo' | 'zustandTest'>('none');
  
  // Use the team info hook
  const { teamInfo, loading: teamLoading } = useTeamInfo();
  
  // 直接从store获取数据和方法
  const {
    persons,
    schedule,
    fetchData,
  } = useTreatingStore();

  // 切换tab的函数
  const toggleTab = (tab: 'settings' | 'emailTest' | 'teamInfo' | 'zustandTest') => {
    if (activeTab === tab) {
      setActiveTab('none');
    } else {
      setActiveTab(tab);
    }
  };

  // Handle URL parameters and get team info when component mounts
  useEffect(() => {
    // Read URL parameters and initialize userId
    const id = getUserId();
    console.log('Current userId:', id);
    
    // If URL has teamId parameter, automatically refresh data
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('teamId')) {
      fetchData();
    }
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <header className="mb-6 bg-white shadow-sm rounded-lg p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-blue-600">Thursday Treating Calendar</h1>
            <p className="text-gray-600">
              {teamLoading ? 'Loading...' : (teamInfo?.teamName || 'My Team')} - Manage Thursday treating schedule
            </p>
          </div>
          <div className="flex gap-1 w-full md:w-auto">
            <button 
              className={`px-2 py-1.5 md:px-4 md:py-2 rounded-md font-medium transition-colors text-xs md:text-sm ${
                activeTab === 'teamInfo' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
              }`}
              onClick={() => toggleTab('teamInfo')}
            >
              {activeTab === 'teamInfo' ? 'Close' : 'Team Info'}
            </button>
            <button 
              className={`px-2 py-1.5 md:px-4 md:py-2 rounded-md font-medium transition-colors text-xs md:text-sm ${
                activeTab === 'settings' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
              }`}
              onClick={() => toggleTab('settings')}
            >
              {activeTab === 'settings' ? 'Close' : 'Settings'}
            </button>
            <button 
              className={`px-2 py-1.5 md:px-4 md:py-2 rounded-md font-medium transition-colors text-xs md:text-sm ${
                activeTab === 'emailTest' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-green-50 hover:bg-green-100 text-green-700'
              }`}
              onClick={() => toggleTab('emailTest')}
            >
              {activeTab === 'emailTest' ? 'Close' : 'Email Test'}
            </button>
            {/* 在移动端隐藏Zustand Test按钮 */}
            <button 
              className={`hidden md:block px-2 py-1.5 md:px-4 md:py-2 rounded-md font-medium transition-colors text-xs md:text-sm ${
                activeTab === 'zustandTest' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
              }`}
              onClick={() => toggleTab('zustandTest')}
            >
              {activeTab === 'zustandTest' ? 'Close' : 'Zustand Test'}
            </button>
            <button 
              className="px-2 py-1.5 md:px-4 md:py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 font-medium transition-colors text-xs md:text-sm"
              onClick={() => window.open('https://github.com/Skymore/treating-calendar', '_blank')}
            >
              GitHub
            </button>
          </div>
        </div>
        
        {activeTab === 'teamInfo' && (
          <div className="mt-4">
            <TeamInfo 
              onClose={() => setActiveTab('none')} 
            />
          </div>
        )}
        
        {activeTab === 'zustandTest' && (
          <div className="mt-4">
            <ZustandTest />
          </div>
        )}
        
        <Settings 
          showSettings={activeTab === 'settings'}
          setShowSettings={(show) => setActiveTab(show ? 'settings' : 'none')}
          personnel={persons}
          schedule={schedule}
          fetchData={fetchData}
        />
        
        {activeTab === 'emailTest' && <div><EmailTest /></div>}
      </header>
      
      <main>
        <TreatingCalendar />
      </main>
    </div>
  );
}
