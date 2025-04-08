import { CalendarDate, today, getLocalTimeZone } from "@internationalized/date";
import { useEffect, useState } from "react";

interface DebugControlsProps {
  debugDate: CalendarDate;
  setDebugDate: (date: CalendarDate) => void;
  getMonthName: (month: number) => string;
  fetchData: () => void;
}

export function DebugControls({ debugDate, setDebugDate, getMonthName, fetchData }: DebugControlsProps) {
  // 使用本地状态来跟踪未提交的更改
  const [tempYear, setTempYear] = useState(debugDate.year);
  const [tempMonth, setTempMonth] = useState(debugDate.month);
  const [tempDay, setTempDay] = useState(debugDate.day);
  
  // 当debugDate变化时更新本地状态
  useEffect(() => {
    setTempYear(debugDate.year);
    setTempMonth(debugDate.month);
    setTempDay(debugDate.day);
  }, [debugDate]);

  // 应用日期更改并刷新数据
  const applyDateChange = () => {
    // 确保日期有效
    const daysInMonth = new Date(tempYear, tempMonth, 0).getDate();
    const validDay = Math.min(tempDay, daysInMonth);
    
    const newDate = new CalendarDate(tempYear, tempMonth, validDay);
    setDebugDate(newDate);
    
    // 刷新数据
    fetchData();
  };

  // 重置到今天并刷新数据
  const refreshToToday = () => {
    const todayDate = today(getLocalTimeZone());
    setDebugDate(todayDate);
    setTempYear(todayDate.year);
    setTempMonth(todayDate.month);
    setTempDay(todayDate.day);
    
    // 刷新数据
    fetchData();
  };

  return (
    <div className="bg-red-50 p-3 flex items-center justify-between">
      <div className="text-sm text-red-700 font-medium">Debug Date:</div>
      <div className="flex items-center space-x-2">
        <select
          value={tempYear}
          onChange={(e) => setTempYear(parseInt(e.target.value))}
          className="px-2 py-1 border rounded"
        >
          {Array.from({ length: 5 }, (_, i) => today(getLocalTimeZone()).year + i - 2).map(
            (year) => (
              <option key={year} value={year}>
                {year}
              </option>
            )
          )}
        </select>
        <select
          value={tempMonth}
          onChange={(e) => setTempMonth(parseInt(e.target.value))}
          className="px-2 py-1 border rounded"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
            <option key={month} value={month}>
              {getMonthName(month)}
            </option>
          ))}
        </select>
        <select
          value={tempDay}
          onChange={(e) => setTempDay(parseInt(e.target.value))}
          className="px-2 py-1 border rounded"
        >
          {Array.from(
            { length: new Date(tempYear, tempMonth, 0).getDate() },
            (_, i) => i + 1
          ).map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
        <button
          onClick={applyDateChange}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Apply & Refresh
        </button>
        <button
          onClick={refreshToToday}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          Refresh to Today
        </button>
      </div>

      <div className="text-sm text-red-700">
        Current Debug Date: <strong>{debugDate.toString()}</strong> vs. Actual Date:{" "}
        <strong>{today(getLocalTimeZone()).toString()}</strong>
      </div>
    </div>
  );
} 