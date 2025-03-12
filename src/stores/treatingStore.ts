import { create } from "zustand";
import { Personnel, HostSchedule, SortType } from "../types/types";
import { CalendarDate, today, getLocalTimeZone, parseDate } from "@internationalized/date";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabase";
import { getUserId } from "../lib/userIdUtils";
import { showNotification } from "../utils/notification";
import { User, Session } from "@supabase/supabase-js";

// 定义store的状态类型
interface TreatingState {
    // 状态
    persons: Personnel[];
    schedule: HostSchedule[];
    loading: boolean;
    currentMonth: number;
    currentYear: number;
    activeTab: "calendar" | "people";
    focusedDate: CalendarDate;
    sortType: SortType;
    newPersonFormOpen: boolean;
    swapMode: boolean;
    selectedDates: string[];
    debugDate: CalendarDate;
    debugMode: boolean;
    newName: string;
    newEmail: string;
    newPhone: string;
    userId: string;
    isCreator: boolean;
    
    user: User | null;
    session: Session | null;

    // 基础状态操作
    setPersons: (persons: Personnel[] | ((prev: Personnel[]) => Personnel[])) => void;
    setSchedule: (schedule: HostSchedule[] | ((prev: HostSchedule[]) => HostSchedule[])) => void;
    setLoading: (loading: boolean) => void;
    setCurrentMonth: (month: number) => void;
    setCurrentYear: (year: number) => void;
    setActiveTab: (tab: "calendar" | "people") => void;
    setFocusedDate: (date: CalendarDate) => void;
    setSortType: (type: SortType) => void;
    setNewPersonFormOpen: (open: boolean) => void;
    setSwapMode: (mode: boolean) => void;
    setSelectedDates: (dates: string[] | ((prev: string[]) => string[])) => void;
    setDebugDate: (date: CalendarDate) => void;
    setDebugMode: (mode: boolean) => void;
    setNewName: (name: string) => void;
    setNewEmail: (email: string) => void;
    setNewPhone: (phone: string) => void;
    setUserId: (id: string) => void;
    setUser: (user: User | null) => void;
    setSession: (session: Session | null) => void;

    // 业务逻辑方法
    isThursday: (date: CalendarDate) => boolean;
    calculateTreatingValue: (person: Personnel) => number;
    getPersonForDate: (date: CalendarDate | null) => Personnel | null;
    calculateFutureHostingCounts: (personId: string) => number;
    isDateInPast: (dateStr: string) => boolean;
    fetchData: () => Promise<void>;
    generateSchedule: (peopleList: Personnel[], type: SortType, date: CalendarDate) => Promise<void>;
    changeSortType: (type: SortType) => void;
    prevMonth: () => void;
    nextMonth: () => void;
    getMonthName: (month: number) => string;
    generateCalendar: () => CalendarDate[];
    swapPersons: (date1: string, date2: string) => Promise<void>;
    handleDateSelect: (date: CalendarDate) => void;
    removePerson: (id: string) => Promise<void>;
    addPerson: () => Promise<void>;

    // 内部方法
    fetchAndMarkCompleted: () => Promise<[HostSchedule[], HostSchedule[]]>;
    calculateActualhostingCounts: (peopleList: Personnel[], date: CalendarDate) => Promise<void>;

    // 检查用户是否有权限执行某个操作
    checkPermission: (action: string) => boolean;
    checkCreatorStatus: () => Promise<void>;
}

// 创建store
export const useTreatingStore = create<TreatingState>((set, get) => {
    // 不要在这里直接调用React Hook
    return {
        // 状态
        persons: [],
        schedule: [],
        loading: true,
        currentMonth: new Date().getMonth() + 1,
        currentYear: new Date().getFullYear(),
        activeTab: "calendar",
        focusedDate: today(getLocalTimeZone()),
        sortType: SortType.ByName,
        newPersonFormOpen: false,
        swapMode: false,
        selectedDates: [],
        debugDate: today(getLocalTimeZone()),
        debugMode: false,
        newName: "",
        newEmail: "",
        newPhone: "",
        userId: getUserId(),
        isCreator: false,
        user: null,
        session: null,

        // 基础状态操作
        setPersons: (persons) => set((state) => ({ persons: typeof persons === 'function' ? persons(state.persons) : persons })),
        setSchedule: (schedule) => set((state) => ({ schedule: typeof schedule === 'function' ? schedule(state.schedule) : schedule })),
        setLoading: (loading) => set({ loading }),
        setCurrentMonth: (month) => set({ currentMonth: month }),
        setCurrentYear: (year) => set({ currentYear: year }),
        setActiveTab: (tab) => set({ activeTab: tab }),
        setFocusedDate: (date) => set({ focusedDate: date }),
        setSortType: (type) => set({ sortType: type }),
        setNewPersonFormOpen: (open) => set({ newPersonFormOpen: open }),
        setSwapMode: (mode) => set({ swapMode: mode }),
        setSelectedDates: (dates) => set((state) => ({ selectedDates: typeof dates === 'function' ? dates(state.selectedDates) : dates })),
        setDebugDate: (date) => set({ debugDate: date }),
        setDebugMode: (mode) => set({ debugMode: mode }),
        setNewName: (name) => set({ newName: name }),
        setNewEmail: (email) => set({ newEmail: email }),
        setNewPhone: (phone) => set({ newPhone: phone }),
        setUserId: (id) => {
            set({ userId: id });
            get().checkCreatorStatus();
        },
        setUser: (user) => set({ user }),
        setSession: (session) => set({ session }),

        isThursday: (date: CalendarDate) => {
            return date.toDate(getLocalTimeZone()).getDay() === 4; // 0 is Sunday, 4 is Thursday
        },

        calculateTreatingValue: (person: Personnel) => {
            return person.hostingCount + person.hostOffset;
        },

        getPersonForDate: (date: CalendarDate | null) => {
            if (!date) return null;

            const { persons, schedule } = get();
            const dateStr = date.toString();
            const scheduleItem = schedule.find((s) => s.date === dateStr);
            if (!scheduleItem) return null;

            return persons.find((p) => p.id === scheduleItem.personnelId) || null;
        },

        calculateFutureHostingCounts: (personId: string) => {
            const { schedule } = get();
            // Filter schedule items that are in the future (not completed) and assigned to this person
            const futureSchedules = schedule.filter(
                (item) => item.personnelId === personId && parseDate(item.date).compare(get().debugDate) >= 0
            );

            // Return the count of future treating events
            return futureSchedules.length;
        },

        isDateInPast: (dateStr: string) => {
            const { schedule } = get();
            const scheduleItem = schedule.find((s) => s.date === dateStr);
            return scheduleItem ? scheduleItem.date < get().debugDate.toString() : false;
        },

        fetchData: async () => {
            const { setLoading, setPersons, setSchedule, userId } = get();
            console.log(`Start fetching data, date: ${get().debugDate.toString()}`);
            setLoading(true);

            try {
                // Get personnel data
                const { data: personnelData, error: personnelError } = await supabase
                    .from("personnel")
                    .select("*")
                    .eq("userId", userId)
                    .order("name");

                if (personnelError) throw personnelError;

                console.log("Personnel data from database:", personnelData);

                if (!personnelData || personnelData.length === 0) {
                    console.log("No personnel data retrieved or data is empty");
                    setPersons([]);
                } else {
                    console.log("Personnel data:", personnelData);
                    setPersons(personnelData);
                }

                // Get schedule data
                const { data: scheduleData, error: scheduleError } = await supabase
                    .from("host_schedule")
                    .select("*")
                    .eq("userId", userId)
                    .order("date");

                if (scheduleError) throw scheduleError;

                console.log("Schedule data from database:", scheduleData);

                if (!scheduleData || scheduleData.length === 0) {
                    console.log("No schedule data retrieved or data is empty");
                    setSchedule([]);
                } else {
                    console.log("Schedule data:", scheduleData);
                    setSchedule(scheduleData);
                }

                // 更新completed标志
                await get().fetchAndMarkCompleted();
            } catch (error) {
                console.error("Failed to load data:", error);
                alert("Failed to load data. Please refresh the page.");
            } finally {
                // Ensure loading is set to false regardless of success or failure
                setLoading(false);
                console.log("Data loading complete, set loading state to false");
            }
        },

        // 内部方法，不导出到接口
        fetchAndMarkCompleted: async () => {
            const { userId, debugDate } = get();
            try {
                console.log(`Fetch and mark completed, date: ${debugDate.toString()}`);
                // Update completed to true for records that are today or in the past
                const { data: beforeData, error: updateError } = await supabase
                    .from("host_schedule")
                    .update({ completed: true })
                    .eq("userId", userId)
                    .lte("date", debugDate.toString())
                    .select();

                // Update completed to false for records that are in the future
                const { data: afterData, error: updateError2 } = await supabase
                    .from("host_schedule")
                    .update({ completed: false })
                    .eq("userId", userId)
                    .gt("date", debugDate.toString())
                    .select();

                if (updateError || updateError2) throw updateError || updateError2;

                console.log("Host schedule history from database beforeData:", beforeData);
                console.log("Host schedule history from database afterData:", afterData);

                // 更新hostingCount
                await get().calculateActualhostingCounts(get().persons, get().debugDate);

                return [beforeData, afterData];
            } catch (error) {
                console.error("Failed to load host schedule history:", error);
                return [[], []];
            }
        },

        // 内部方法，不导出到接口
        calculateActualhostingCounts: async (peopleList: Personnel[], date: CalendarDate) => {
            const { setPersons, userId } = get();
            try {
                console.log(
                    `Calculating actual treating counts for people: ${peopleList.map(
                        (p) => p.name
                    )}, date: ${date.toString()}`
                );

                // Get completed treating history
                const { data: beforeData, error: historyError } = await supabase
                    .from("host_schedule")
                    .select("*")
                    .eq("userId", userId)
                    .eq("completed", true);

                if (historyError) throw historyError;

                // Create a count mapping
                const countMap: Record<string, number> = {};

                // Calculate actual treating count for each person
                beforeData.forEach((history: HostSchedule) => {
                    const personnelId = history.personnelId;
                    countMap[personnelId] = (countMap[personnelId] || 0) + 1;
                });

                console.log("Treating count mapping:", countMap);

                if (!peopleList || peopleList.length === 0) {
                    console.log("No personnel data, cannot update treating counts");
                    return;
                }

                // Update treating count for each person
                const updatedPersons = peopleList.map((person) => ({
                    ...person,
                    hostingCount: countMap[person.id] || 0,
                }));

                console.log("Updated personnel data:", updatedPersons);
                // 使用函数式更新
                setPersons(updatedPersons);

                // Sync with database
                for (const person of updatedPersons) {
                    await supabase.from("personnel").update({ hostingCount: person.hostingCount }).eq("id", person.id);
                }
                console.log("Treating counts updated in database");
            } catch (error) {
                console.error("Failed to calculate treating counts:", error);
            }
        },

        // 检查用户是否有权限执行某个操作
        checkPermission: (action: string) => {
            // 如果用户是创建者，则允许所有操作
            if (get().isCreator) {
                return true;
            }
            
            // 如果不是创建者，则根据操作类型决定是否允许
            // 这里可以定义哪些操作是所有用户都可以执行的
            const allowedForAll = [
                // 允许所有用户执行的操作列表
                'view calendar',
                'view people',
                'export data'
                // 可以根据需要添加更多操作
            ];
            
            return allowedForAll.includes(action);
        },
        
        // 检查用户是否是团队创建者
        checkCreatorStatus: async () => {
            try {
                // 使用store中存储的用户信息
                const { user, userId } = get();
                
                console.log('Checking creator status:', { userId, user: user ? 'exists' : 'null' });
                
                if (!user) {
                    console.log('No user found, setting isCreator to false');
                    set({ isCreator: false });
                    return;
                }
                
                if (!user.id) {
                    console.log('User exists but has no ID, setting isCreator to false');
                    set({ isCreator: false });
                    return;
                }
                
                // 这里应该通过API调用来检查用户是否是创建者
                console.log('Querying team_creators table with:', { team_id: userId, auth_user_id: user.id });
                
                const { data, error } = await supabase
                    .from('team_creators')
                    .select('*')
                    .eq('team_id', userId)
                    .eq('auth_user_id', user.id)
                    .maybeSingle();
                
                if (error) {
                    console.error('Error querying team_creators:', error);
                    set({ isCreator: false });
                    return;
                }
                
                console.log('Query result:', data);
                
                if (data) {
                    console.log('User is creator, setting isCreator to true');
                    set({ isCreator: true });
                    return;
                }
                
                // 如果没有找到记录，则不是创建者
                console.log('No creator record found, setting isCreator to false');
                set({ isCreator: false });
            } catch (err) {
                console.error('Error checking creator status:', err);
                set({ isCreator: false });
            }
        },

        generateSchedule: async (peopleList: Personnel[], type: SortType, date: CalendarDate) => {
            const { setSchedule, isThursday, calculateTreatingValue, userId, isCreator } = get();

            // 检查权限
            if (!isCreator) {
                showNotification('Only the team creator can generate schedules', 'error');
                return;
            }

            if (peopleList.length === 0) {
                setSchedule([]);
                return;
            }

            // 先计算treating counts
            await get().calculateActualhostingCounts(peopleList, date);

            let sortedPersons = [...peopleList];
            if (type === SortType.ByName) {
                // First sort by treating value, then by name
                sortedPersons.sort((a, b) => {
                    const valueA = calculateTreatingValue(a);
                    const valueB = calculateTreatingValue(b);
                    if (valueA === valueB) {
                        return a.name.localeCompare(b.name);
                    }
                    return valueA - valueB;
                });
            } else if (type === SortType.ByAddOrder) {
                // Sort by creation time (if available), then by ID as fallback
                // But still prioritize those with lower treating value
                sortedPersons.sort((a, b) => {
                    const valueA = calculateTreatingValue(a);
                    const valueB = calculateTreatingValue(b);
                    if (valueA === valueB) {
                        // 优先使用 createdAt 字段排序
                        if (a.createdAt && b.createdAt) {
                            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                        }
                        // 如果没有 createdAt 字段，则使用 ID 作为备选
                        return a.id.localeCompare(b.id);
                    }
                    return valueA - valueB;
                });
            } else {
                // Random sort, but prioritize those with lower treating value
                sortedPersons.sort(() => Math.random() - 0.5);
                sortedPersons.sort((a, b) => calculateTreatingValue(a) - calculateTreatingValue(b));
            }

            // Generate schedules for the next 6 months (every Thursday)
            const schedules: HostSchedule[] = [];
            const dbSchedules = [];
            let currentDate = get().debugDate;
            let personIndex = 0;

            // Find the next Thursday
            while (!isThursday(currentDate)) {
                const nextDate = currentDate.toDate(getLocalTimeZone());
                nextDate.setDate(nextDate.getDate() + 1);
                currentDate = new CalendarDate(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
            }

            // Generate schedules for the next 6 months
            for (let i = 0; i < 52; i++) {
                // About 6 months, once a week
                const dateStr = currentDate.toString();
                const personnelId = sortedPersons[personIndex].id;
                const hostSchedule: HostSchedule = {
                    id: uuidv4(),
                    userId: userId,
                    date: dateStr,
                    personnelId: personnelId,
                    completed: false,
                    hostNotified: false,
                    teamNotified: false,
                };

                schedules.push(hostSchedule);
                dbSchedules.push(hostSchedule);

                // Cycle to the next person
                personIndex = (personIndex + 1) % sortedPersons.length;

                // Move to next Thursday
                const nextDate = currentDate.toDate(getLocalTimeZone());
                nextDate.setDate(nextDate.getDate() + 7);
                currentDate = new CalendarDate(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
            }

            console.log("Generated schedules:", schedules);

            try {
                // Clear existing schedules from today onwards
                const { error: deleteError } = await supabase
                    .from("host_schedule")
                    .delete()
                    .eq("userId", userId)
                    .gte("date", get().debugDate.toString());

                if (deleteError) throw deleteError;

                // Add new schedules
                const { error: insertError } = await supabase.from("host_schedule").insert(dbSchedules);

                if (insertError) throw insertError;

                // Update local state
                console.log("Updating local state with new schedules:", schedules);
                setSchedule(schedules);
            } catch (error) {
                console.error("Failed to update schedule:", error);
                alert("Failed to update schedule. Please try again.");
            }
        },

        changeSortType: (type: SortType) => {
            const { setSortType, persons, debugDate, generateSchedule } = get();
            setSortType(type);
            // Directly use current person list to generate schedule without balancing
            generateSchedule(persons, type, debugDate);
        },

        prevMonth: () => {
            const { currentMonth, currentYear, setCurrentMonth, setCurrentYear } = get();
            if (currentMonth === 1) {
                setCurrentMonth(12);
                setCurrentYear(currentYear - 1);
            } else {
                setCurrentMonth(currentMonth - 1);
            }
        },

        nextMonth: () => {
            const { currentMonth, currentYear, setCurrentMonth, setCurrentYear } = get();
            if (currentMonth === 12) {
                setCurrentMonth(1);
                setCurrentYear(currentYear + 1);
            } else {
                setCurrentMonth(currentMonth + 1);
            }
        },

        getMonthName: (month: number) => {
            const monthNames = [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
            ];
            return monthNames[month - 1];
        },

        generateCalendar: () => {
            const { currentMonth, currentYear } = get();
            // Using the current month and year from state instead of today
            const year = currentYear;
            const month = currentMonth;

            // First day of month
            const firstDayOfMonth = new CalendarDate(year, month, 1);
            // Day of week for the first day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
            const firstDayOfWeek = firstDayOfMonth.toDate(getLocalTimeZone()).getDay();

            // Days in current month
            const daysInMonth = new Date(year, month, 0).getDate();

            // Days to show from previous month
            const daysFromPrevMonth = firstDayOfWeek;

            // Last day of previous month
            let prevMonth = month - 1;
            let prevMonthYear = year;
            if (prevMonth < 1) {
                prevMonth = 12;
                prevMonthYear = year - 1;
            }
            const daysInPrevMonth = new Date(prevMonthYear, prevMonth, 0).getDate();

            // Generate calendar data
            const calendarDays: CalendarDate[] = [];

            // Add days from previous month
            for (let i = 0; i < daysFromPrevMonth; i++) {
                const day = daysInPrevMonth - daysFromPrevMonth + i + 1;
                calendarDays.push(new CalendarDate(prevMonthYear, prevMonth, day));
            }

            // Add days from current month
            for (let day = 1; day <= daysInMonth; day++) {
                calendarDays.push(new CalendarDate(year, month, day));
            }

            // Add days from next month to fill a 6-week grid (42 days)
            const remainingDays = 42 - calendarDays.length;
            let nextMonth = month + 1;
            let nextMonthYear = year;
            if (nextMonth > 12) {
                nextMonth = 1;
                nextMonthYear = year + 1;
            }

            for (let day = 1; day <= remainingDays; day++) {
                calendarDays.push(new CalendarDate(nextMonthYear, nextMonth, day));
            }

            return calendarDays;
        },

        swapPersons: async (date1: string, date2: string) => {
            const { schedule, setSchedule, isDateInPast, persons, debugDate, calculateActualhostingCounts, userId, isCreator } = get();

            try {
                // 检查权限
                if (!isCreator) {
                    showNotification('Only the team creator can swap personnel', 'error');
                    return;
                }

                // Check if either date is in the past
                if (isDateInPast(date1) || isDateInPast(date2)) {
                    showNotification('Cannot swap past dates. Only future dates can be swapped.', 'error');
                    return;
                }

                // Get schedules for two dates
                const schedule1 = schedule.find((s) => s.date === date1);
                const schedule2 = schedule.find((s) => s.date === date2);

                if (!schedule1 || !schedule2) {
                    alert("Cannot find schedule for specified date");
                    return;
                }

                // Swap personnel IDs
                const tempPersonnelId = schedule1.personnelId;
                schedule1.personnelId = schedule2.personnelId;
                schedule2.personnelId = tempPersonnelId;

                // Update host_schedule table
                const updates = [
                    {
                        personnelId: schedule1.personnelId,
                        date: date1,
                    },
                    {
                        personnelId: schedule2.personnelId,
                        date: date2,
                    },
                ];

                // Update host_schedule table
                for (const update of updates) {
                    const { error } = await supabase
                        .from("host_schedule")
                        .update({ personnelId: update.personnelId })
                        .eq("userId", userId)
                        .eq("date", update.date);

                    if (error) throw error;
                }

                // Update local state
                setSchedule([...schedule]);

                // Recalculate treating counts
                await calculateActualhostingCounts(persons, debugDate);

                showNotification('Successfully swapped treating order between two people!', 'success');
            } catch (error) {
                console.error("Failed to swap treating order:", error);
                showNotification('Failed to swap treating order. Please try again.', 'error');
            }
        },

        handleDateSelect: (date: CalendarDate) => {
            const {
                swapMode,
                isThursday,
                schedule,
                isDateInPast,
                selectedDates,
                setSelectedDates,
                setFocusedDate,
                setSwapMode,
                swapPersons,
            } = get();

            if (!swapMode) {
                setFocusedDate(date);
                return;
            }

            const dateStr = date.toString();

            // Check if it's Thursday
            if (!isThursday(date)) {
                alert("Can only select Thursdays for swapping");
                return;
            }

            // Check if there's personnel assigned to this date
            const scheduleItem = schedule.find((s) => s.date === dateStr);
            if (!scheduleItem) {
                alert("No personnel assigned to this date");
                return;
            }

            // Check if the date is in the past (completed)
            if (isDateInPast(dateStr)) {
                alert("Cannot swap past dates. Only future dates can be swapped.");
                return;
            }

            // If this date is already selected, deselect it
            if (selectedDates.includes(dateStr)) {
                setSelectedDates(selectedDates.filter((d) => d !== dateStr));
                return;
            }

            // If two dates already selected, replace the first one
            if (selectedDates.length >= 2) {
                setSelectedDates([dateStr, selectedDates[1]]);
                return;
            }

            // Add to selected dates
            setSelectedDates([...selectedDates, dateStr]);

            // If one date already selected, ask to swap with the new selection
            if (selectedDates.length === 1) {
                const confirmSwap = window.confirm("Swap treating personnel between these two dates?");
                if (confirmSwap) {
                    swapPersons(selectedDates[0], dateStr);
                    setSelectedDates([]);
                    setSwapMode(false);
                }
            }
        },

        removePerson: async (id: string) => {
            const { persons, setPersons, debugDate, generateSchedule, sortType, userId, isCreator } = get();

            try {
                // 检查权限
                if (!isCreator) {
                    showNotification('Only the team creator can remove team members', 'error');
                    return;
                }

                // Delete from database
                const { error } = await supabase.from("personnel").delete().eq("userId", userId).eq("id", id);

                if (error) throw error;

                // Update local state
                const updatedPersons = persons.filter((p) => p.id !== id);
                setPersons(updatedPersons);

                // Directly use updated person list to generate schedule
                await generateSchedule(updatedPersons, sortType, debugDate);
                
                showNotification('Team member removed successfully', 'success');
            } catch (error) {
                console.error("Failed to delete person:", error);
                showNotification('Failed to delete person. Please try again.', 'error');
            }
        },

        addPerson: async () => {
            const {
                newName,
                newEmail,
                newPhone,
                persons,
                setPersons,
                calculateTreatingValue,
                debugDate,
                generateSchedule,
                sortType,
                setNewName,
                setNewEmail,
                setNewPhone,
                setNewPersonFormOpen,
                userId,
            } = get();

            if (!newName.trim() || !newEmail.trim()) return;

            try {
                // 检查权限
                if (!get().isCreator) {
                    showNotification('Only the team creator can add team members', 'error');
                    return;
                }

                // Calculate current minimum 'calculated value'
                const minCalculatedValue = persons.length > 0 ? Math.min(...persons.map((p) => calculateTreatingValue(p))) : 0;

                const id = uuidv4();
                const createdAt = new Date().toISOString(); // 记录创建时间
                const newPerson: Personnel = {
                    id,
                    userId: userId,
                    name: newName.trim(),
                    email: newEmail.trim(),
                    phone: newPhone.trim() || undefined,
                    hostingCount: 0,
                    lastHosted: "",
                    hostOffset: minCalculatedValue, // Set hostOffset to current minimum calculated value
                    createdAt, // 添加创建时间
                };

                // Add to database
                const { error } = await supabase.from("personnel").insert({
                    id,
                    userId: userId,
                    name: newPerson.name,
                    email: newPerson.email,
                    phone: newPerson.phone,
                    hostingCount: 0,
                    hostOffset: minCalculatedValue,
                    createdAt, // 添加创建时间
                });

                if (error) throw error;

                // Update local state - ensure using new array to trigger re-render
                console.log("Persons before adding new person:", persons);
                const updatedPersons = [...persons, newPerson];
                console.log("Persons after adding new person:", updatedPersons);
                setPersons(updatedPersons);
                setNewName("");
                setNewEmail("");
                setNewPhone("");
                setNewPersonFormOpen(false);

                // Generate new schedule
                await generateSchedule(updatedPersons, sortType, debugDate);
                
                showNotification('Team member added successfully', 'success');
            } catch (error) {
                console.error("Failed to add person:", error);
                showNotification('Failed to add person. Please try again.', 'error');
            }
        },
    };
});

// 添加一个方法来设置用户信息
export const setTreatingStoreUser = (user: User | null, session: Session | null) => {
    console.log('Setting treating store user:', { 
        user: user ? { id: user.id, email: user.email } : 'null',
        session: session ? 'exists' : 'null'
    });
    
    const store = useTreatingStore.getState();
    
    // 使用setState方法更新状态
    store.setUser(user);
    store.setSession(session);
    
    // 如果用户信息变化，重新检查创建者状态
    if (user) {
        console.log('User exists, checking creator status');
        store.checkCreatorStatus();
    } else {
        console.log('No user, setting isCreator to false');
        useTreatingStore.setState({ isCreator: false });
    }
};
