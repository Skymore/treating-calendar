import { useState, useEffect } from "react";
import './App.css';
import TreatingCalendar from './components/TreatingCalendar';
import Settings from './components/Settings';
import TeamInfo from './components/TeamInfo';
import { useTreatingCalendar } from './hooks/useTreatingCalendar';
import EmailTest from './components/EmailTest';
import { getUserId } from './lib/userIdUtils';
import { useTeamInfo } from './hooks/useTeamInfo';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [showEmailTest, setShowEmailTest] = useState(false);
  const [showTeamInfo, setShowTeamInfo] = useState(false);
  
  // Use the team info hook
  const { teamInfo, loading: teamLoading } = useTeamInfo();
  
  // Use treating calendar hook to get data
  const {
    persons,
    schedule,
    fetchData
  } = useTreatingCalendar();

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Thursday Treating Calendar</h1>
            <p className="text-gray-600">
              {teamLoading ? 'Loading...' : (teamInfo?.teamName || 'My Team')} - Manage your team's Thursday treating schedule
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded-md text-purple-700 font-medium transition-colors"
              onClick={() => setShowTeamInfo(!showTeamInfo)}
            >
              {showTeamInfo ? 'Close Team Info' : 'Team Info'}
            </button>
            <button 
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-md text-blue-700 font-medium transition-colors"
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? 'Close Settings' : 'Settings'}
            </button>
            <button 
              className="px-4 py-2 bg-green-50 hover:bg-green-100 rounded-md text-green-700 font-medium transition-colors"
              onClick={() => setShowEmailTest(!showEmailTest)}
            >
              {showEmailTest ? 'Close Email Test' : 'Email Test'}
            </button>
            <button 
              className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-gray-700 font-medium transition-colors"
              onClick={() => window.open('https://github.com/yourusername/thursday-treating-calendar', '_blank')}
            >
              GitHub
            </button>
          </div>
        </div>
        
        {showTeamInfo && (
          <div className="mt-4">
            <TeamInfo 
              onClose={() => setShowTeamInfo(false)} 
            />
          </div>
        )}
        
        <Settings 
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          personnel={persons}
          schedule={schedule}
          fetchData={fetchData}
        />
        
        {showEmailTest && <EmailTest />}
      </header>
      
      <main>
        <TreatingCalendar />
      </main>
      
      <footer className="mt-8 pt-4 border-t text-center text-gray-500 text-sm">
        <div className="flex justify-between items-center">
          <div>
            &copy; {new Date().getFullYear()} Rui Tao's Treating Calendar
          </div>
        </div>
      </footer>
    </div>
  );
}
