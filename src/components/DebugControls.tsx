import { CalendarDate } from "@internationalized/date";

interface DebugControlsProps {
    debugDate: CalendarDate;
    setDebugDate: (date: CalendarDate) => void;
    getMonthName: (month: number) => string;
    fetchData: () => void;
}

export function DebugControls({ debugDate, setDebugDate, getMonthName, fetchData }: DebugControlsProps) {
    return (
        <div className="bg-red-50 p-3 border-b border-red-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-red-700 font-medium text-sm">Debug Date:</span>
                    <div className="flex space-x-2">
                        <select 
                            className="border border-gray-300 rounded px-2 py-1 bg-white text-sm"
                            value={debugDate.year}
                            onChange={(e) => {
                                const newYear = parseInt(e.target.value);
                                const newDate = new CalendarDate(newYear, debugDate.month, debugDate.day);
                                setDebugDate(newDate);
                            }}
                        >
                            {Array.from({ length: 10 }, (_, i) => debugDate.year - 5 + i).map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <select 
                            className="border border-gray-300 rounded px-2 py-1 bg-white text-sm"
                            value={debugDate.month}
                            onChange={(e) => {
                                const newMonth = parseInt(e.target.value);
                                const newDate = new CalendarDate(debugDate.year, newMonth, 
                                    // 确保日期有效（例如，如果是2月，不能选择30日）
                                    Math.min(debugDate.day, new Date(debugDate.year, newMonth, 0).getDate())
                                );
                                setDebugDate(newDate);
                                fetchData();
                            }}
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                <option key={month} value={month}>{getMonthName(month)}</option>
                            ))}
                        </select>
                        <select 
                            className="border border-gray-300 rounded px-2 py-1 bg-white text-sm"
                            value={debugDate.day}
                            onChange={(e) => {
                                const newDay = parseInt(e.target.value);
                                const newDate = new CalendarDate(debugDate.year, debugDate.month, newDay);
                                setDebugDate(newDate);
                            }}
                        >
                            {Array.from({ length: new Date(debugDate.year, debugDate.month, 0).getDate() }, (_, i) => i + 1).map(day => (
                                <option key={day} value={day}>{day}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button 
                    className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    onClick={() => {
                        // Reset to today and refresh data
                        const today = new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
                        setDebugDate(today);
                        fetchData();
                    }}
                >
                    Reset to Today
                </button>
            </div>
        </div>
    );
} 