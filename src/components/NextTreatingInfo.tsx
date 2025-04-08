import { CalendarDate } from "@internationalized/date";
import { Personnel } from "../types/types";

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
  if (!nextTreatingInfo) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 relative">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-indigo-500">Next Treating Day</div>
          <div className="text-lg font-bold">{nextTreatingInfo.formattedDate} (Thursday)</div>
        </div>

        <div className="hidden md:block flex-grow mx-6 border-b border-dashed border-blue-200"></div>

        <div>
          <div className="text-sm font-medium text-indigo-500">Treating Person</div>
          <div className="text-lg font-bold">{nextTreatingInfo.person?.name || "Unassigned"}</div>
        </div>

        <div className="mt-3 md:mt-0 md:ml-6 flex flex-wrap gap-2">
          <button
            onClick={onSendHostNotification}
            className="px-2 py-1.5 md:px-3 md:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-150 text-xs md:text-sm"
            title="Send notification to the host only"
          >
            Host Notification
          </button>
          <button
            onClick={onSendTeamNotification}
            className="px-2 py-1.5 md:px-3 md:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition duration-150 text-xs md:text-sm"
            title="Send notification to the entire team"
          >
            Team Notification
          </button>
        </div>
      </div>
    </div>
  );
} 