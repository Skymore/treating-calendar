import { parseDate, today, getLocalTimeZone, CalendarDate } from "@internationalized/date";
import { SortType } from "../types/types";
import { useTreatingCalendar } from "../hooks/useTreatingCalendar";
import { CalendarCell } from "./CalendarCell";
import { NextTreatingInfo } from "./NextTreatingInfo";
import { DebugControls } from "./DebugControls";

interface TreatingCalendarProps {
    className?: string;
}

export default function TreatingCalendar({ className }: TreatingCalendarProps) {
    // Use the custom hook to get all logic and state
    const {
        // State
        persons,
        schedule,
        focusedDate,
        sortType,
        loading,
        currentMonth,
        currentYear,
        activeTab,
        newPersonFormOpen,
        swapMode,
        selectedDates,
        debugMode,
        debugDate,
        newName,
        newEmail,
        newPhone,
        calendarDays,
        nextTreatingInfo,
        // currentPerson,

        // Methods
        // setFocusedDate,
        // setSortType,
        setCurrentMonth,
        setCurrentYear,
        setActiveTab,
        setNewPersonFormOpen,
        setSwapMode,
        setSelectedDates,
        setDebugMode,
        setDebugDate,
        setNewName,
        setNewEmail,
        setNewPhone,
        getToday,
        isThursday,
        calculateTreatingValue,
        getPersonForDate,
        fetchData,
        // generateSchedule,
        changeSortType,
        // sendNotification,
        prevMonth,
        nextMonth,
        getMonthName,
        // swapPersons,
        handleDateSelect,
        removePerson,
        addPerson,
        calculateFutureHostingCounts,
        isDateInPast,
        sendHostNotification,
        sendTeamNotification,
    } = useTreatingCalendar();

    // Render calendar cell
    const renderCalendarCell = (date: CalendarDate) => {
        const isThursdayDate = isThursday(date);
        const person = getPersonForDate(date);
        const isCurrentMonth = date.month === currentMonth;
        const isToday = date.compare(getToday()) === 0;
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

    // Modify loading condition rendering
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
                            {getMonthName(currentMonth)} {currentYear}
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
                            <div key={`${date.year}-${date.month}-${date.day}-${i}`} className="border-b border-r p-1 min-h-[60px] md:min-h-[80px]">
                                {renderCalendarCell(date)}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="p-4 border-t">
                        <div className="text-sm text-gray-700">
                            <div className="font-medium mb-2">Legend:</div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                <div className="flex items-center">
                                    <div className="w-4 h-4 bg-blue-50 border border-gray-200 mr-2"></div>
                                    <span>Thursday (Treating Day)</span>
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
                </div>
            )}

            {/* People management view */}
            {activeTab === "people" && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-y-4">
                        <h2 className="text-xl font-bold text-gray-800">Team Members</h2>

                        <div className="flex overflow-x-auto whitespace-nowrap pb-2 w-full md:w-auto">
                            <button
                                onClick={() => changeSortType(SortType.ByName)}
                                className={`px-2 py-1.5 md:px-3 md:py-2 rounded-md text-xs md:text-sm mr-2 ${
                                    sortType === SortType.ByName
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-gray-100 text-gray-700"
                                }`}
                                title="Generate 6-month schedule ordered by name"
                            >
                                Name-Based
                            </button>
                            <button
                                onClick={() => changeSortType(SortType.Random)}
                                className={`px-2 py-1.5 md:px-3 md:py-2 rounded-md text-xs md:text-sm mr-2 ${
                                    sortType === SortType.Random
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-gray-100 text-gray-700"
                                }`}
                                title="Generate 6-month schedule with randomized order"
                            >
                                Random
                            </button>
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

                    {/* People table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-600 tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-600 tracking-wider hidden md:table-cell">
                                        Email
                                    </th>
                                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-gray-600 tracking-wider hidden md:table-cell">
                                        Phone
                                    </th>
                                    <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs md:text-sm font-medium text-gray-600 tracking-wider">
                                        Treats
                                    </th>
                                    <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs md:text-sm font-medium text-gray-600 tracking-wider">
                                        Future
                                    </th>
                                    <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs md:text-sm font-medium text-gray-600 tracking-wider hidden md:table-cell">
                                        Offset
                                    </th>
                                    <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs md:text-sm font-medium text-gray-600 tracking-wider hidden md:table-cell">
                                        Value
                                    </th>
                                    <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs md:text-sm font-medium text-gray-600 tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {persons && persons.length > 0 ? (
                                    persons.map((person) => (
                                        <tr key={person.id} className="hover:bg-gray-50">
                                            <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                                <div className="font-medium text-sm md:text-base text-gray-900">{person.name}</div>
                                                <div className="text-xs text-gray-500 md:hidden">{person.email}</div>
                                            </td>
                                            <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                                                {person.email}
                                            </td>
                                            <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                                                {person.phone || "—"}
                                            </td>
                                            <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-center">
                                                <span className="px-1.5 md:px-2 py-0.5 md:py-1 inline-flex text-xs md:text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {person.hostingCount}
                                                </span>
                                            </td>
                                            <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-center">
                                                <span className="px-1.5 md:px-2 py-0.5 md:py-1 inline-flex text-xs md:text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {calculateFutureHostingCounts(person.id)}
                                                </span>
                                            </td>
                                            <td className="px-2 md:px-6 py-3 md:py-4 text-center hidden md:table-cell">
                                                <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-gray-100 text-gray-800 text-xs md:text-sm">
                                                    {person.hostOffset}
                                                </span>
                                            </td>
                                            <td className="px-2 md:px-6 py-3 md:py-4 text-center hidden md:table-cell">
                                                <span className="px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs md:text-sm">
                                                    {calculateTreatingValue(person)}
                                                </span>
                                            </td>
                                            <td className="px-2 md:px-6 py-3 md:py-4 whitespace-nowrap text-center text-xs md:text-sm">
                                                <button
                                                    onClick={() => removePerson(person.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-2 md:px-6 py-8 md:py-12 text-center text-gray-500">
                                            <div className="mx-auto w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-12 w-12 md:h-16 md:w-16 text-gray-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1}
                                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                                    />
                                                </svg>
                                            </div>
                                            <p className="text-base md:text-lg">No team members added yet</p>
                                            <p className="mt-1 text-xs md:text-sm">
                                                Click the "Add Person" button to add your first team member.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Schedule information */}
                    {persons.length > 0 && (
                        <div className="p-4 border-t">
                            <h3 className="font-medium text-gray-800 mb-2">Upcoming Schedule</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                                {schedule
                                    .filter((s) => {
                                        const scheduleDate = parseDate(s.date);
                                        const todayDate = getToday();
                                        return scheduleDate.compare(todayDate) >= 0;
                                    })
                                    .slice(0, 6)
                                    .map((s, index) => {
                                        const person = persons.find((p) => p.id === s.personnelId);
                                        const date = parseDate(s.date);

                                        return (
                                            <div
                                                key={`schedule-${s.date}-${index}`}
                                                className="border rounded-md p-3 bg-white shadow-sm"
                                            >
                                                <div className="text-xs font-medium text-gray-500 mb-1">Thursday</div>
                                                <div className="font-bold text-sm md:text-base text-gray-800">
                                                    {`${date.year}-${String(date.month).padStart(2, "0")}-${String(
                                                        date.day
                                                    ).padStart(2, "0")}`}
                                                </div>
                                                <div className="mt-2 flex items-center">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                                    <div className="font-medium truncate text-sm md:text-base">
                                                        {person ? person.name : "Unassigned"}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
