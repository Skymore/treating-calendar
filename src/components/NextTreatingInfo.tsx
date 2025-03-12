import { CalendarDate } from "@internationalized/date";
import { Personnel } from "../types/types";
import { useAuth } from "../contexts/AuthContext";
import { useTreatingStore } from "../stores/treatingStore";

interface NextTreatingInfoProps {
    nextTreatingInfo: {
        person: Personnel | null;
        date: CalendarDate;
        formattedDate: string;
    } | null;
    onSendHostNotification: () => void;
    onSendTeamNotification: () => void;
}

export function NextTreatingInfo({ 
    nextTreatingInfo, 
    onSendHostNotification, 
    onSendTeamNotification 
}: NextTreatingInfoProps) {
    const { user } = useAuth();
    const { isCreator } = useTreatingStore();
    
    const handleSendHostNotification = () => {
        onSendHostNotification();
    };
    
    const handleSendTeamNotification = () => {
        onSendTeamNotification();
    };

    if (!nextTreatingInfo) {
        return (
            <div className="bg-blue-50 p-4 border-b border-blue-100">
                <div className="text-center text-blue-700">
                    No upcoming breakfast days scheduled
                </div>
            </div>
        );
    }

    return (
        <div className="bg-blue-50 p-4 border-b border-blue-100">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="space-y-1">
                    <div className="text-blue-700 font-medium text-sm">Next Breakfast Day</div>
                    <div className="text-xl font-bold">{nextTreatingInfo.formattedDate}</div>
                </div>
                <div className="space-y-1">
                    <div className="text-blue-700 font-medium text-sm">Breakfast Person</div>
                    <div className="text-xl font-bold">{nextTreatingInfo.person?.name || "Unassigned"}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={handleSendHostNotification}
                        className={`px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm ${(!user || !isCreator) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!user || !isCreator}
                        title={!user ? "Please login first" : !isCreator ? "Only team creator can send notifications" : "Send notification to host"}
                    >
                        Host Notification
                    </button>
                    <button 
                        onClick={handleSendTeamNotification}
                        className={`px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm ${(!user || !isCreator) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!user || !isCreator}
                        title={!user ? "Please login first" : !isCreator ? "Only team creator can send notifications" : "Send notification to team"}
                    >
                        Team Notification
                    </button>
                </div>
            </div>
        </div>
    );
} 