import { parseDate, today, getLocalTimeZone, CalendarDate } from "@internationalized/date";
import { SortType } from "../types/types";
import { CalendarCell } from "./CalendarCell";
import { useEffect, useState } from "react";
import { useTreatingStore } from "../stores/treatingStore";
import { useTreatingCalendar } from "../hooks/useTreatingCalendar";
import { DebugControls } from "./DebugControls";
import { NextTreatingInfo } from "./NextTreatingInfo";
import "./TreatingCalendar.css";

interface TreatingCalendarProps {
    className?: string;
}

export default function TreatingCalendar({ className }: TreatingCalendarProps) {
    // 从 useTreatingCalendar 获取邮件发送方法
    const { sendHostNotification, sendTeamNotification } = useTreatingCalendar();
    
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
        debugMode,
        // Methods
        setCurrentMonth,
        setCurrentYear,
        setNewPersonFormOpen,
        setSwapMode,
        setSelectedDates,
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
        setDebugMode,
        fetchData,
    } = useTreatingStore();

    // 添加 activeTab 状态
    const [activeTab, setActiveTab] = useState<"calendar" | "people">("calendar");
    
    // 添加视图类型状态
    const [viewType, setViewType] = useState<"month" | "year">("month");

    // 获取今天日期的辅助函数
    const getToday = () => {
        return debugMode ? debugDate : today(getLocalTimeZone());
    };

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
        const isThursdayDate = isThursday(date);
        const person = getPersonForDate(date);
        const isCurrentMonth = date.month === currentMonth;
        const isToday = date.compare(debugDate) === 0;
        const dateStr = date.toString();
        const isSelected = selectedDates.includes(dateStr);
        const isFocused = date.toString() === focusedDate.toString();
        const isPast = isDateInPast(dateStr);

        return (
            <CalendarCell
                date={date}
                isThursday={isThursdayDate}
                person={person}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                isFocused={isFocused}
                isSelected={isSelected}
                isPast={isPast}
                onSelect={handleDateSelect}
            />
        );
    };

    // 渲染组件
    if (loading && persons.length === 0) {
        return (
            <div className="h-96 w-full flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-3 text-gray-600">Loading calendar data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`treating-calendar ${className || ""}`}>
            {/* Main header with navigation tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                <div className="flex flex-wrap border-b">
                    <button
                        className={`px-3 py-2 md:px-5 md:py-3 text-sm md:text-base font-medium ${
                            activeTab === "calendar"
                                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                                : "text-gray-600 hover:bg-gray-50"
                        }`}
                        onClick={() => setActiveTab("calendar")}
                    >
                        Calendar View
                    </button>
                    <button
                        className={`px-3 py-2 md:px-5 md:py-3 text-sm md:text-base font-medium ${
                            activeTab === "people"
                                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                                : "text-gray-600 hover:bg-gray-50"
                        }`}
                        onClick={() => {
                            setActiveTab("people");
                        }}
                    >
                        Manage People
                    </button>

                    {/* 添加调试模式按钮 */}
                    <button
                        className={`px-3 py-2 md:px-5 md:py-3 text-sm md:text-base font-medium ${
                            debugMode
                                ? "bg-red-50 text-red-700 border-b-2 border-red-500"
                                : "text-gray-600 hover:bg-gray-50"
                        }`}
                        onClick={() => {
                            const newDebugMode = !debugMode;
                            setDebugMode(newDebugMode);
                            // If turning debug mode OFF, reset to today and refresh data
                            if (!newDebugMode) {
                                const todayDate = today(getLocalTimeZone());
                                setDebugDate(todayDate);
                                // Also reset calendar view to current month/year
                                setCurrentMonth(todayDate.month);
                                setCurrentYear(todayDate.year);
                                // Refresh data
                                fetchData();
                            }
                        }}
                    >
                        Debug {debugMode ? "ON" : "OFF"}
                    </button>
                </div>

                {/* 调试日期控制区域 */}
                {debugMode && (
                    <DebugControls
                        debugDate={debugDate}
                        setDebugDate={setDebugDate}
                        getMonthName={getMonthName}
                        fetchData={fetchData}
                    />
                )}

                {/* Loading data indicator */}
                {loading && (
                    <div className="bg-yellow-50 text-yellow-800 p-2 text-center text-sm">
                        <span className="inline-block mr-2 animate-pulse">⟳</span>
                        Loading data...
                    </div>
                )}

                {/* Next treating info banner */}
                <NextTreatingInfo
                    nextTreatingInfo={nextTreatingInfo}
                    onSendHostNotification={sendHostNotification}
                    onSendTeamNotification={sendTeamNotification}
                />
            </div>

            {/* Calendar view content */}
            {activeTab === "calendar" && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b gap-y-4">
                        <h2 className="text-xl font-bold text-gray-800">
                            {viewType === "month" ? `${getMonthName(currentMonth)} ${currentYear}` : `${currentYear}`}
                        </h2>

                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            <div className="flex rounded-md shadow-sm">
                                <button
                                    onClick={prevMonth}
                                    className="px-3 py-2 border border-r-0 rounded-l-md bg-white hover:bg-gray-50"
                                >
                                    &larr;
                                </button>
                                <button
                                    onClick={() => {
                                        const now = getToday();
                                        setCurrentMonth(now.month);
                                        setCurrentYear(now.year);
                                    }}
                                    className="px-3 py-2 border bg-white hover:bg-gray-50"
                                >
                                    Today
                                </button>
                                <button
                                    onClick={nextMonth}
                                    className="px-3 py-2 border border-l-0 rounded-r-md bg-white hover:bg-gray-50"
                                >
                                    &rarr;
                                </button>
                            </div>

                            <div className="flex space-x-2">
                                <select
                                    value={currentMonth}
                                    onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                                    className="px-3 py-2 border rounded-md bg-white"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                        <option key={month} value={month}>
                                            {getMonthName(month)}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={currentYear}
                                    onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                                    className="px-3 py-2 border rounded-md bg-white"
                                >
                                    {Array.from({ length: 6 }, (_, i) => today(getLocalTimeZone()).year + i - 2).map(
                                        (year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <button
                                onClick={() => setViewType(viewType === "month" ? "year" : "month")}
                                className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                {viewType === "month" ? "Year View" : "Month View"}
                            </button>

                            <button
                                onClick={() => {
                                    setSwapMode(!swapMode);
                                    setSelectedDates([]);
                                }}
                                className={`px-3 py-2 rounded-md ${
                                    swapMode ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"
                                }`}
                            >
                                {swapMode ? "Exit Swap" : "Swap Order"}
                            </button>
                        </div>
                    </div>

                    {swapMode && (
                        <div className="bg-green-50 p-3 text-sm text-green-800 border-b">
                            <p>
                                Swap mode enabled: Please select two Thursdays to swap.
                                {selectedDates.length > 0 ? ` Selected ${selectedDates.length} date(s)` : ""}
                            </p>
                        </div>
                    )}

                    {/* 月视图 */}
                    {viewType === "month" && (
                        <>
                            {/* Calendar grid */}
                            <div className="grid grid-cols-7 border-b">
                                {/* Weekday headers */}
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                                    <div
                                        key={day}
                                        className={`p-2 text-center text-xs md:text-sm font-medium ${
                                            i === 4 ? "bg-blue-50 text-blue-800" : "text-gray-500"
                                        }`}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar days */}
                            <div className="grid grid-cols-7 auto-rows-fr">
                                {calendarDays.map((date, i) => (
                                    <div
                                        key={`${date.year}-${date.month}-${date.day}-${i}`}
                                        className="border-b border-r p-1 min-h-[60px] md:min-h-[80px]"
                                    >
                                        {renderCalendarCell(date)}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* 年视图 */}
                    {viewType === "year" && (
                        <div className="p-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                                    // 获取当月所有的星期四
                                    const thursdays: CalendarDate[] = [];
                                    
                                    // 计算当月的天数
                                    const daysInMonth = new Date(currentYear, month, 0).getDate();
                                    
                                    // 遍历当月的每一天，找出所有星期四
                                    for (let day = 1; day <= daysInMonth; day++) {
                                        const date = new CalendarDate(currentYear, month, day);
                                        // 检查是否是星期四
                                        if (isThursday(date)) {
                                            thursdays.push(date);
                                        }
                                    }

                                    return (
                                        <div 
                                            key={month} 
                                            className={`border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                                                month === currentMonth ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                            }`}
                                            onClick={() => {
                                                setCurrentMonth(month);
                                                setViewType("month");
                                            }}
                                        >
                                            <div className="bg-gray-50 p-3 border-b">
                                                <h3 className="font-medium text-gray-800">{getMonthName(month)}</h3>
                                            </div>
                                            <div className="p-3">
                                                {thursdays.length > 0 ? (
                                                    <ul className="space-y-2">
                                                        {thursdays.map((thursday) => {
                                                            const person = getPersonForDate(thursday);
                                                            return (
                                                                <li key={thursday.toString()} className="text-sm">
                                                                    <span className="text-gray-600">{thursday.day}: </span>
                                                                    <span className="font-medium text-gray-800">
                                                                        {person ? person.name : "Unassigned"}
                                                                    </span>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-gray-500">No Thursdays in this month</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="p-4 border-t">
                        <div className="text-sm text-gray-700">
                            <div className="font-medium mb-2">Legend:</div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                <div className="flex items-center">
                                    <div className="w-4 h-4 bg-blue-50 border border-gray-200 mr-2"></div>
                                    <span>Thursday (Breakfast Day)</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-4 h-4 flex items-center justify-center">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    </div>
                                    <span className="ml-2">Today</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-4 h-4 border-2 border-blue-400 mr-2"></div>
                                    <span>Selected Date</span>
                                </div>
                                {swapMode && (
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 border-2 border-green-500 mr-2"></div>
                                        <span>Swap Selection</span>
                                    </div>
                                )}
                            </div>
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
            )}

            {/* People management view */}
            {activeTab === "people" && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-y-4">
                        <h2 className="text-xl font-bold text-gray-800">Team Members</h2>

                        <div className="flex flex-col w-full md:w-auto gap-2">
                            <div className="flex flex-nowrap items-center overflow-x-auto">
                                <span className="text-gray-700 text-sm whitespace-nowrap mr-2">Schedule by:</span>
                                <button
                                    onClick={() => {
                                        changeSortType(SortType.ByName);
                                        alert("Schedule generated by name order");
                                    }}
                                    className={`px-1.5 py-1 md:px-2 md:py-1.5 rounded-md text-xs mr-1 ${
                                        sortType === SortType.ByName
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-700"
                                    }`}
                                    title="Generate 12-month schedule ordered by name"
                                >
                                    Name
                                </button>
                                <button
                                    onClick={() => {
                                        changeSortType(SortType.Random);
                                        alert("Schedule generated in random order");
                                    }}
                                    className={`px-1.5 py-1 md:px-2 md:py-1.5 rounded-md text-xs mr-1 ${
                                        sortType === SortType.Random
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-700"
                                    }`}
                                    title="Generate 12-month schedule with randomized order"
                                >
                                    Random
                                </button>
                                <button
                                    onClick={() => {
                                        changeSortType(SortType.ByAddOrder);
                                        alert("Schedule generated by addition order");
                                    }}
                                    className={`px-1.5 py-1 md:px-2 md:py-1.5 rounded-md text-xs ${
                                        sortType === SortType.ByAddOrder
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-700"
                                    }`}
                                    title="Generate 12-month schedule ordered by when members were added"
                                >
                                    Order
                                </button>
                            </div>
                            <button
                                onClick={() => setNewPersonFormOpen(!newPersonFormOpen)}
                                className="px-2 py-1.5 md:px-3 md:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs md:text-sm"
                            >
                                {newPersonFormOpen ? "Cancel" : "Add Person"}
                            </button>
                        </div>
                    </div>

                    {/* New person form */}
                    {newPersonFormOpen && (
                        <div className="p-4 bg-blue-50 border-b">
                            <div className="max-w-3xl mx-auto">
                                <h3 className="font-medium text-blue-800 mb-3">Add New Team Member</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="Full Name"
                                            className="w-full px-3 py-2 border rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            placeholder="Email Address"
                                            className="w-full px-3 py-2 border rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone (Optional)
                                        </label>
                                        <input
                                            type="tel"
                                            value={newPhone}
                                            onChange={(e) => setNewPhone(e.target.value)}
                                            placeholder="Phone Number"
                                            className="w-full px-3 py-2 border rounded-md"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={addPerson}
                                        className="px-3 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm md:text-base"
                                        disabled={!newName.trim() || !newEmail.trim()}
                                    >
                                        Add to Team
                                    </button>
                                </div>
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
                                    <th className="hidden md:table-cell px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
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
                                            <td className="hidden md:table-cell px-4 py-2 whitespace-nowrap text-center">
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-gray-100 text-gray-700">
                                                    {person.email}
                                                </span>
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
                                                    className="px-2 py-1 text-xs rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                                            No team members found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
