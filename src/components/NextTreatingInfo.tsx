import { CalendarDate } from "@internationalized/date";
import { Personnel } from "../types/types";
import { useAuth } from "../contexts/AuthContext";
import { useTeamInfo } from "../hooks/useTeamInfo";
import { useState, useEffect } from "react";
import { getUserId } from "../lib/userIdUtils";
import { showNotification } from "../utils/notification";

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
    const { isTeamCreator } = useTeamInfo();
    const [isCreator, setIsCreator] = useState(false);
    const [checkingCreator, setCheckingCreator] = useState(true);
    
    // 检查用户是否是团队创建者
    useEffect(() => {
        const checkCreatorStatus = async () => {
            if (user) {
                const creator = await isTeamCreator(getUserId());
                setIsCreator(creator);
            } else {
                setIsCreator(false);
            }
            setCheckingCreator(false);
        };
        
        checkCreatorStatus();
    }, [user, isTeamCreator]);
    
    // 权限检查函数
    const checkPermission = () => {
        if (checkingCreator) {
            showNotification('Checking permissions...', 'info');
            return false;
        }
        
        if (!user) {
            showNotification('You need to sign in to send notifications', 'error');
            return false;
        }
        
        if (!isCreator) {
            showNotification('Only the team creator can send notifications', 'error');
            return false;
        }
        
        return true;
    };
    
    // 包装通知发送函数
    const handleSendHostNotification = () => {
        if (checkPermission()) {
            onSendHostNotification();
        }
    };
    
    const handleSendTeamNotification = () => {
        if (checkPermission()) {
            onSendTeamNotification();
        }
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
                        disabled={!user || !isCreator || checkingCreator}
                        title={!isCreator ? "Only team creator can send notifications" : "Send notification to host"}
                    >
                        Host Notification
                    </button>
                    <button 
                        onClick={handleSendTeamNotification}
                        className={`px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm ${(!user || !isCreator) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!user || !isCreator || checkingCreator}
                        title={!isCreator ? "Only team creator can send notifications" : "Send notification to team"}
                    >
                        Team Notification
                    </button>
                </div>
            </div>
        </div>
    );
} 