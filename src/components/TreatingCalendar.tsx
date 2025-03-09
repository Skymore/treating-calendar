import { parseDate, today, getLocalTimeZone, CalendarDate } from "@internationalized/date";
import { SortType } from "../types/types";
import { CalendarCell } from "./CalendarCell";
import { useEffect } from "react";
import { useTreatingStore } from "../stores/treatingStore";
import "./TreatingCalendar.css";

interface TreatingCalendarProps {
    className?: string;
}

export default function TreatingCalendar({ className }: TreatingCalendarProps) {
    // 直接从store获取状态和方法
    const {
        // State
        persons,
        schedule,
        focusedDate,
        sortType,
        loading,
        currentMonth,
        currentYear,
        newPersonFormOpen,
        swapMode,
        selectedDates,
        newName,
        newEmail,
        newPhone,
        debugDate,
        // Methods
        setCurrentMonth,
        setCurrentYear,
        setNewPersonFormOpen,
        setSwapMode,
        setNewName,
        setNewEmail,
        setNewPhone,
        isThursday,
        getPersonForDate,
        changeSortType,
        prevMonth,
        nextMonth,
        getMonthName,
        generateCalendar,
        handleDateSelect,
        removePerson,
        addPerson,
        calculateFutureHostingCounts,
        isDateInPast,
        setDebugDate,
        fetchData,
    } = useTreatingStore();

    // 计算日历天数
    const calendarDays = generateCalendar();

    // 计算下一个treating日期和人员
    const nextTreatingInfo = (() => {
        const todayDate = debugDate;
        const upcomingSchedules = schedule
            .filter((s) => {
                const scheduleDate = parseDate(s.date);
                return scheduleDate.compare(todayDate) >= 0;
            })
            .sort((a, b) => {
                const dateA = parseDate(a.date);
                const dateB = parseDate(b.date);
                return dateA.compare(dateB);
            });

        if (upcomingSchedules.length === 0) return null;

        const nextSchedule = upcomingSchedules[0];
        const person = persons.find((p) => p.id === nextSchedule.personnelId) || null;
        const date = parseDate(nextSchedule.date);

        return {
            person,
            date,
            formattedDate: `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`,
        };
    })();


    // 添加调试日志
    useEffect(() => {
        console.log("TreatingCalendar rendered with persons:", persons);
    }, [persons]);

    // 渲染日历单元格
    const renderCalendarCell = (date: CalendarDate) => {
        const isCurrentMonth = date.month === currentMonth;
        const isToday = date.compare(debugDate) === 0;
        const dateStr = date.toString();
        const isSelected = selectedDates.includes(dateStr);
        const isThursdayDate = isThursday(date);
        const person = getPersonForDate(date);
        const isPast = isDateInPast(dateStr);

        return (
            <CalendarCell
                date={date}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                isThursday={isThursdayDate}
                isFocused={focusedDate?.compare(date) === 0}
                isSelected={isSelected}
                isPast={isPast}
                person={person}
                onSelect={() => handleDateSelect(date)}
            />
        );
    };

    // 渲染组件
    if (loading && persons.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg shadow-md ${className || ""}`}>
            {/* Debug Controls - 简化设计 */}
            <div className="bg-red-50 p-2 md:p-4 border-b border-red-100">
                <div className="flex flex-wrap items-center justify-between gap-2 md:gap-4">
                    <div className="flex flex-wrap items-center gap-1 md:gap-2">
                        <span className="text-red-700 font-medium whitespace-nowrap text-xs md:text-sm">Debug Date:</span>
                        <div className="flex space-x-1 md:space-x-2">
                            <select 
                                className="border border-gray-300 rounded-md px-1 md:px-2 py-0.5 md:py-1 bg-white text-xs md:text-sm"
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
                                className="border border-gray-300 rounded-md px-1 md:px-2 py-0.5 md:py-1 bg-white text-xs md:text-sm"
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
                                className="border border-gray-300 rounded-md px-1 md:px-2 py-0.5 md:py-1 bg-white text-xs md:text-sm"
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
                    <div className="flex flex-wrap gap-1 md:gap-2">
                        <button 
                            className="fixed-width-button bg-red-500 text-xs md:text-sm py-1 md:py-1.5"
                            onClick={() => {
                                // 重置为今天并刷新数据
                                setDebugDate(today(getLocalTimeZone()));
                                fetchData();
                            }}
                        >
                            Refresh to Today
                        </button>
                    </div>
                </div>
                <div className="text-red-700 text-[10px] md:text-sm mt-1 md:mt-2">
                    Current Debug: <span className="font-medium">{debugDate.toString()}</span> vs. Actual:{" "}
                    <span className="font-medium">{today(getLocalTimeZone()).toString()}</span>
                </div>
            </div>

            {/* Next Treating Info */}
            <div className="bg-blue-50 p-2 md:p-4 border-b border-blue-100">
                <div className="flex flex-wrap justify-between items-center gap-2 md:gap-4">
                    <div className="space-y-0.5 md:space-y-1">
                        <div className="text-blue-700 font-medium text-xs md:text-sm">Next Treating Day</div>
                        <div className="text-base md:text-xl font-bold">{nextTreatingInfo?.formattedDate || "Unassigned"}</div>
                    </div>
                    <div className="space-y-0.5 md:space-y-1">
                        <div className="text-blue-700 font-medium text-xs md:text-sm">Treating Person</div>
                        <div className="text-base md:text-xl font-bold">{nextTreatingInfo?.person?.name || "Unassigned"}</div>
                    </div>
                    <div className="flex flex-wrap gap-1 md:gap-2">
                        <button className="fixed-width-button bg-blue-500 text-xs md:text-sm py-1 md:py-1.5">
                            Host Notification
                        </button>
                        <button className="fixed-width-button bg-red-500 text-xs md:text-sm py-1 md:py-1.5">
                            Team Notification
                        </button>
                    </div>
                </div>
            </div>

            {/* 日历部分 - 更接近截图样式 */}
            <div className="p-2 md:p-4">
                <div className="flex justify-between items-center mb-2 md:mb-4">
                    <div className="flex items-center mb-2 md:mb-0">
                        <h2 className="text-base md:text-lg font-bold">
                            {getMonthName(currentMonth)} {currentYear}
                        </h2>
                        <div className="flex ml-2 md:ml-4">
                            <button
                                onClick={prevMonth}
                                className="p-1 rounded hover:bg-gray-100"
                                aria-label="Previous month"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 md:h-5 md:w-5 text-gray-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            </button>
                            <button
                                onClick={nextMonth}
                                className="p-1 rounded hover:bg-gray-100 ml-1"
                                aria-label="Next month"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 md:h-5 md:w-5 text-gray-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>
                            <button
                                onClick={() => {
                                    const now = today(getLocalTimeZone());
                                    setCurrentMonth(now.month);
                                    setCurrentYear(now.year);
                                }}
                                className="ml-1 md:ml-2 px-1 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                            >
                                Today
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center">
                        {/* Generate By Name or Random, 添加一个提示*/}
                        <span className="text-gray-500 text-[10px] md:text-xs mr-1 md:mr-2">Generate By </span>
                        <div className="flex items-center">
                            <select
                                value={sortType}
                                onChange={(e) => changeSortType(e.target.value as SortType)}
                                className="border border-gray-300 rounded px-1 md:px-2 py-0.5 md:py-1 bg-white text-xs md:text-sm mr-1 md:mr-2"
                            >
                                <option value={SortType.ByName}>Name</option>
                                <option value={SortType.Random}>Random</option>
                            </select>
                        </div>
                        <button
                            onClick={() => setSwapMode(!swapMode)}
                            className={`px-1 md:px-3 py-0.5 md:py-1 rounded text-[10px] md:text-sm ${
                                swapMode ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                            Swap
                        </button>
                    </div>
                </div>

                {/* 日历网格 */}
                <div className="border border-gray-200 rounded overflow-hidden">
                    {/* 星期标题 */}
                    <div className="grid grid-cols-7 text-center">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                            <div
                                key={day}
                                className={`py-2 font-medium text-sm border-b border-r border-gray-200 ${
                                    day === "Thu" ? "bg-blue-50 text-blue-700" : "text-gray-500"
                                }`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* 日历单元格 */}
                    <div className="grid grid-cols-7">
                        {calendarDays.map((date, i) => (
                            <div
                                key={`${date.year}-${date.month}-${date.day}-${i}`}
                                className="border-b border-r border-gray-200 aspect-square min-h-[40px] md:min-h-[60px]"
                            >
                                {renderCalendarCell(date)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 图例 */}
                <div className="flex gap-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded-full mr-1.5"></div>
                        <span>Today</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-100 border border-green-300 rounded-full mr-1.5"></div>
                        <span>Thursday</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded-full mr-1.5"></div>
                        <span>Other Month</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded-full mr-1.5"></div>
                        <span>Selected</span>
                    </div>
                </div>
            </div>

            {/* 团队成员部分 - 更接近截图样式 */}
            <div className="p-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">Team Members</h2>
                    <button
                        onClick={() => setNewPersonFormOpen(!newPersonFormOpen)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                    >
                        Add
                    </button>
                </div>

                {/* 添加人员表单 */}
                {newPersonFormOpen && (
                    <div className="mb-4 p-4 bg-gray-50 rounded border border-gray-200">
                        <h3 className="font-medium text-sm mb-3">Add New Team Member</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                    placeholder="Full Name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                    placeholder="Email Address"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Phone (Optional)
                                </label>
                                <input
                                    type="tel"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                    placeholder="Phone Number"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-3">
                            <button
                                onClick={addPerson}
                                disabled={!newName.trim() || !newEmail.trim()}
                                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add Member
                            </button>
                        </div>
                    </div>
                )}

                {/* 团队成员表格 */}
                <div className="overflow-x-auto border border-gray-200 rounded">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Past
                                </th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Future
                                </th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {persons && persons.length > 0 ? (
                                persons.map((person) => (
                                    <tr key={person.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            <div className="font-medium text-sm text-gray-900">{person.name}</div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-center">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {person.hostingCount}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-center">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {calculateFutureHostingCounts(person.id)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => removePerson(person.id)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                                        No team members found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 即将到来的日程部分 */}
            <div className="p-4 border-t border-gray-200">
                <h2 className="text-lg font-bold mb-4">Upcoming Schedule</h2>
                <div className="border border-gray-200 rounded divide-y divide-gray-200 overflow-hidden">
                    {schedule
                        .filter((s) => {
                            const scheduleDate = parseDate(s.date);
                            const todayDate = debugDate;
                            return scheduleDate.compare(todayDate) >= 0;
                        })
                        .slice(0, 5)
                        .map((s, index) => {
                            const person = persons.find((p) => p.id === s.personnelId);
                            const date = parseDate(s.date);
                            const day = date.toDate(getLocalTimeZone()).getDay();
                            const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day];

                            return (
                                <div key={s.id} className={`p-3 ${index === 0 ? "bg-blue-50" : "bg-white"}`}>
                                    <div className="text-sm font-medium text-gray-800">
                                        {date.toString()} ({dayName})
                                    </div>
                                    <div className="text-sm mt-1 text-gray-600">
                                        {person ? person.name : "Unassigned"}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
