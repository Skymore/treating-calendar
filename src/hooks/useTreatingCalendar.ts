import { useState, useEffect, useMemo } from "react";
import { parseDate, today, getLocalTimeZone, CalendarDate } from "@internationalized/date";
import { Personnel, HostSchedule, SortType } from "../types/types";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../lib/supabase";
import { useEmailNotification } from "./useEmailNotification";
import { useEmailTemplate } from "./useEmailTemplate";
import { getUserId } from "../lib/userIdUtils";
import { getAppBaseUrl } from "../lib/urlUtils";
import { getPersonnelForTeam, generateScheduleEntries } from "../lib/personnelService";
import { useTeamInfo } from "./useTeamInfo";

export function useTreatingCalendar() {
    // State management
    const [persons, setPersons] = useState<Personnel[]>([]);
    const [schedule, setSchedule] = useState<HostSchedule[]>([]);
    const [focusedDate, setFocusedDate] = useState<CalendarDate>(today(getLocalTimeZone()));
    const [sortType, setSortType] = useState<SortType>(SortType.ByName);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState<number>(today(getLocalTimeZone()).month);
    const [currentYear, setCurrentYear] = useState<number>(today(getLocalTimeZone()).year);
    const [activeTab, setActiveTab] = useState<"calendar" | "people">("calendar");
    const [newPersonFormOpen, setNewPersonFormOpen] = useState(false);
    const [swapMode, setSwapMode] = useState(false);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [userId, setUserId] = useState<string>("");

    // Debug mode state
    const [debugMode, setDebugMode] = useState(false);
    const [debugDate, setDebugDate] = useState<CalendarDate>(today(getLocalTimeZone()));

    // Form state
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPhone, setNewPhone] = useState("");

    // 添加邮件通知hook
    const { sendNotification: sendEmailNotification } = useEmailNotification();
    const { hostTemplate, teamTemplate } = useEmailTemplate();

    // 初始化userId
    useEffect(() => {
        setUserId(getUserId());
    }, []);

    // 自定义today函数，支持调试模式
    const getToday = (): CalendarDate => {
        return debugMode ? debugDate : today(getLocalTimeZone());
    };

    // Check if a date is Thursday
    const isThursday = (date: CalendarDate): boolean => {
        return date.toDate(getLocalTimeZone()).getDay() === 4; // 0 is Sunday, 4 is Thursday
    };

    // Calculate the total treating value (hostingCount + hostOffset)
    const calculateTreatingValue = (person: Personnel): number => {
        return person.hostingCount + person.hostOffset;
    };

    // Fetch treating history
    const fetchAndMarkCompleted = async () => {
        try {
            const date = debugMode ? debugDate : getToday();
            console.log("Fetch and mark completed date:", date.toString());
            // Update completed to true for records that are today or in the past
            const { data: beforeData, error: updateError } = await supabase
                .from("host_schedule")
                .update({ completed: true })
                .eq("userId", userId)
                .lte("date", date.toString())
                .select();

            // Update completed to false for records that are in the future(for debugging)
            const { data: afterData, error: updateError2 } = await supabase
                .from("host_schedule")
                .update({ completed: false })
                .eq("userId", userId)
                .gt("date", date.toString())
                .select();

            if (updateError || updateError2) throw updateError || updateError2;

            console.log("Host schedule history from database beforeData:", beforeData);
            console.log("Host schedule history from database afterData:", afterData);
            return beforeData || afterData;
        } catch (error) {
            console.error("Failed to load host schedule history:", error);
            return [];
        }
    };

    // Calculate actual treating count for each person based on completed treating events
    const calculateActualhostingCounts = async (peopleList: Personnel[]) => {
        try {
            console.log("Calculating actual treating counts for people:", peopleList.map(p => p.name));
            // Get completed treating history
            const treatingHistory: HostSchedule[] = await fetchAndMarkCompleted();

            // Create a count mapping
            const countMap: Record<string, number> = {};

            // Calculate actual treating count for each person
            treatingHistory.forEach((history: HostSchedule) => {
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
            setPersons(updatedPersons);

            // Sync with database
            for (const person of updatedPersons) {
                await supabase.from("personnel").update({ hostingCount: person.hostingCount }).eq("id", person.id);
            }
        } catch (error) {
            console.error("Failed to calculate treating counts:", error);
        }
    };

    // Calculate future treating counts for each person
    const calculateFutureHostingCounts = (personId: string): number => {
        // Filter schedule items that are in the future (not completed) and assigned to this person
        const futureSchedules = schedule.filter(
            (item) => item.personnelId === personId && !item.completed
        );
        
        // Return the count of future treating events
        return futureSchedules.length;
    };

    // Check if a date is in the past
    // This function relies on the 'completed' flag which is updated by fetchAndMarkCompleted
    // It's compatible with debug mode because fetchAndMarkCompleted uses debugDate in debug mode
    const isDateInPast = (dateStr: string): boolean => {
        const scheduleItem = schedule.find(s => s.date === dateStr);
        return scheduleItem ? scheduleItem.completed : false;
    };

    // Get the person assigned to a specific date
    const getPersonForDate = (date: CalendarDate): Personnel | null => {
        const dateStr = date.toString();
        const scheduleItem = schedule.find((s) => s.date === dateStr);
        if (!scheduleItem) return null;

        return persons.find((p) => p.id === scheduleItem.personnelId) || null;
    };

    // Current person for the focused date
    const currentPerson = useMemo(() => {
        return getPersonForDate(focusedDate);
    }, [focusedDate, schedule, persons]);

    // Load data from database
    const fetchData = async () => {
        console.log("Start fetching data...");
        setLoading(true);
        const currentUserId = getUserId();

        try {
            // Get personnel data
            const { data: personnelData, error: personnelError } = await supabase
                .from("personnel")
                .select("*")
                .eq("userId", currentUserId)
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
                .eq("userId", currentUserId)
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

            // Calculate actual treating counts
            await calculateActualhostingCounts(personnelData);
        } catch (error) {
            console.error("Failed to load data:", error);
            alert("Failed to load data. Please refresh the page.");
        } finally {
            // Ensure loading is set to false regardless of success or failure
            setLoading(false);
            console.log("Data loading complete, set loading state to false");
        }
    };

    // Generate schedule
    const generateSchedule = async (peopleList: Personnel[], type: SortType) => {
        if (peopleList.length === 0) {
            setSchedule([]);
            return;
        }

        const currentUserId = getUserId();

        // First calculate actual treating counts
        await calculateActualhostingCounts(peopleList);

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
        } else {
            // Random sort, but prioritize those with lower treating value
            sortedPersons.sort(() => Math.random() - 0.5);
            sortedPersons.sort((a, b) => calculateTreatingValue(a) - calculateTreatingValue(b));
        }

        // Generate schedules for the next 6 months (every Thursday)
        const schedules: HostSchedule[] = [];
        const dbSchedules = [];
        let currentDate = getToday();
        let personIndex = 0;

        // Find the next Thursday
        while (!isThursday(currentDate)) {
            const nextDate = currentDate.toDate(getLocalTimeZone());
            nextDate.setDate(nextDate.getDate() + 1);
            currentDate = new CalendarDate(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
        }

        // Generate schedules for the next 6 months
        for (let i = 0; i < 26; i++) {
            // About 6 months, once a week
            const dateStr = currentDate.toString();
            const personnelId = sortedPersons[personIndex].id;
            const hostSchedule: HostSchedule = {
                id: uuidv4(),
                userId: currentUserId,
                date: dateStr,
                personnelId: personnelId,
                completed: false,
                notified: false,
            };

            schedules.push(hostSchedule);
            dbSchedules.push(hostSchedule);

            // Cycle to the next person
            personIndex = (personIndex + 1) % sortedPersons.length;

            // Move to next Thursday
            const nextDate = currentDate.toDate(getLocalTimeZone());
            nextDate.setDate(nextDate.getDate() + 7);
            currentDate = new CalendarDate(
                nextDate.getFullYear(),
                nextDate.getMonth() + 1, // getMonth() 返回0-11
                nextDate.getDate()
            );
        }

        console.log("Generated schedules:", schedules);

        try {
            // Clear existing schedules from today onwards
            const { error: deleteError } = await supabase
                .from("host_schedule")
                .delete()
                .eq("userId", currentUserId)
                .gte("date", getToday().toString());

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
    };

    // Change sorting method
    const changeSortType = (type: SortType) => {
        setSortType(type);
        // Directly use current person list to generate schedule without balancing
        generateSchedule(persons, type);
    };

    // Send notification
    const sendNotification = async () => {
        let nextThursday = getToday();
        while (!isThursday(nextThursday)) {
            const nextDate = nextThursday.toDate(getLocalTimeZone());
            nextDate.setDate(nextDate.getDate() + 1);
            nextThursday = new CalendarDate(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
        }

        const nextPerson = getPersonForDate(nextThursday);
        if (!nextPerson) {
            alert("No person found for next Thursday.");
            return;
        }

        try {
            // In a real application, call a backend API to send emails
            // Here we just update the notification status
            const { error } = await supabase
                .from("host_schedule")
                .update({ notified: true })
                .eq("date", nextThursday.toString());

            if (error) throw error;

            alert(
                `Notification sent to everyone:\nNext Thursday (${nextThursday.toString()}) treating person: ${
                    nextPerson.name
                }`
            );
        } catch (error) {
            console.error("Failed to send notification:", error);
            alert("Failed to send notification. Please try again.");
        }
    };

    // Send host notification
    const sendHostNotification = async () => {
        let nextThursday = getToday();
        while (!isThursday(nextThursday)) {
            const nextDate = nextThursday.toDate(getLocalTimeZone());
            nextDate.setDate(nextDate.getDate() + 1);
            nextThursday = new CalendarDate(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
        }

        const nextPerson = getPersonForDate(nextThursday);
        if (!nextPerson) {
            alert("No person found for next Thursday.");
            return;
        }

        try {
            // Get formatted date
            const formattedDate = nextThursday.toString();
            
            // Fetch host template from database
            const { data: templateData, error: templateError } = await supabase
                .from('email_templates')
                .select('*')
                .eq('template_type', 'host_notification')
                .single();
                
            if (templateError && templateError.code !== 'PGRST116') {
                throw templateError;
            }
            
            // Use template from database or fallback to default
            let subject = 'Reminder: You are scheduled to treat the team on {date}';
            let content = `<p>Dear {name},</p>
<p>This is a friendly reminder that you are scheduled to treat the team on <strong>{date}</strong> (Thursday).</p>
<p>Please make necessary preparations. If you have any questions or cannot fulfill this duty on the scheduled date, please contact the team lead as soon as possible to arrange an alternative.</p>
<p>Thank you for your cooperation!</p>`;
            
            if (templateData) {
                subject = templateData.subject;
                content = templateData.html_content;
            } else if (hostTemplate) {
                subject = hostTemplate.subject;
                content = hostTemplate.html_content;
            }
            
            // Replace template variables
            subject = subject
                .replace('{name}', nextPerson.name)
                .replace('{date}', formattedDate)
                .replace('{email}', nextPerson.email)
                .replace('{team}', 'Development Team');
                
            content = content
                .replace('{name}', nextPerson.name)
                .replace('{date}', formattedDate)
                .replace('{email}', nextPerson.email)
                .replace('{team}', 'Development Team');
            
            // Send email notification
            const result = await sendEmailNotification(
                nextPerson.email,
                subject,
                content,
                "View Calendar",
                getAppBaseUrl() + window.location.pathname + window.location.search
            );

            if (result.success) {
                // Update notification status in database
                const { error } = await supabase
                    .from("host_schedule")
                    .update({ notified: true })
                    .eq("date", nextThursday.toString());

                if (error) throw error;

                alert(`Host notification sent successfully to ${nextPerson.name}.`);
            } else {
                throw new Error(result.error || "Failed to send email");
            }
        } catch (error) {
            console.error("Failed to send host notification:", error);
            alert("Failed to send notification to host. Please try again.");
        }
    };

    // Send team notification
    const sendTeamNotification = async () => {
        let nextThursday = getToday();
        while (!isThursday(nextThursday)) {
            const nextDate = nextThursday.toDate(getLocalTimeZone());
            nextDate.setDate(nextDate.getDate() + 1);
            nextThursday = new CalendarDate(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
        }

        const nextPerson = getPersonForDate(nextThursday);
        if (!nextPerson) {
            alert("No person found for next Thursday.");
            return;
        }

        try {
            // Get all team emails
            const teamEmails = persons.map(person => person.email);
            
            // Get formatted date
            const formattedDate = nextThursday.toString();
            
            // Fetch team template from database
            const { data: templateData, error: templateError } = await supabase
                .from('email_templates')
                .select('*')
                .eq('template_type', 'team_notification')
                .single();
                
            if (templateError && templateError.code !== 'PGRST116') {
                throw templateError;
            }
            
            // Use template from database or fallback to default
            let subject = 'Team Notification: Treating Schedule for {date}';
            let content = `<p>Dear Team Members,</p>
<p>This is a friendly reminder that <strong>{name}</strong> is scheduled to treat the team on <strong>{date}</strong> (Thursday).</p>
<p>Please remember to join!</p>
<p>Have a great day!</p>`;
            
            if (templateData) {
                subject = templateData.subject;
                content = templateData.html_content;
            } else if (teamTemplate) {
                subject = teamTemplate.subject;
                content = teamTemplate.html_content;
            }
            
            // Replace template variables
            subject = subject
                .replace('{name}', nextPerson.name)
                .replace('{date}', formattedDate)
                .replace('{email}', nextPerson.email)
                .replace('{team}', 'Development Team');
                
            content = content
                .replace('{name}', nextPerson.name)
                .replace('{date}', formattedDate)
                .replace('{email}', nextPerson.email)
                .replace('{team}', 'Development Team');
            
            // Send email notification
            const result = await sendEmailNotification(
                teamEmails,
                subject,
                content,
                "View Calendar",
                getAppBaseUrl() + window.location.pathname + window.location.search
            );

            if (result.success) {
                // Update notification status in database
                const { error } = await supabase
                    .from("host_schedule")
                    .update({ notified: true })
                    .eq("date", nextThursday.toString());

                if (error) throw error;

                alert(`Team notification sent successfully to all team members.`);
            } else {
                throw new Error(result.error || "Failed to send email");
            }
        } catch (error) {
            console.error("Failed to send team notification:", error);
            alert("Failed to send notification to team. Please try again.");
        }
    };

    // Navigate to previous month
    const prevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    // Navigate to next month
    const nextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    // Get month name from number
    const getMonthName = (month: number): string => {
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
    };

    // Generate calendar view
    const generateCalendar = () => {
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
    };

    // Add swap treating order between two people
    const swapPersons = async (date1: string, date2: string) => {
        try {
            const currentUserId = getUserId();
            
            // Check if either date is in the past
            if (isDateInPast(date1) || isDateInPast(date2)) {
                alert("Cannot swap past dates. Only future dates can be swapped.");
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
                    .eq("userId", currentUserId)
                    .eq("date", update.date);

                if (error) throw error;
            }

            // Update local state
            setSchedule([...schedule]);

            // Recalculate treating counts
            await calculateActualhostingCounts(persons);

            alert("Successfully swapped treating order between two people!");
        } catch (error) {
            console.error("Failed to swap treating order:", error);
            alert("Failed to swap treating order. Please try again.");
        }
    };

    // Handle date selection
    const handleDateSelect = (date: CalendarDate) => {
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
    };

    // Remove a person
    const removePerson = async (id: string) => {
        try {
            const currentUserId = getUserId();
            
            // Delete from database
            const { error } = await supabase
                .from("personnel")
                .delete()
                .eq("userId", currentUserId)
                .eq("id", id);

            if (error) throw error;

            // Update local state
            const updatedPersons = persons.filter((p) => p.id !== id);
            setPersons(updatedPersons);

            // Directly use updated person list to generate schedule
            generateSchedule(updatedPersons, sortType);
        } catch (error) {
            console.error("Failed to delete person:", error);
            alert("Failed to delete person. Please try again.");
        }
    };

    // Add a new person
    const addPerson = async () => {
        if (!newName.trim() || !newEmail.trim()) return;
        const currentUserId = getUserId();

        // Calculate current minimum 'calculated value'
        const minCalculatedValue = persons.length > 0 ? Math.min(...persons.map((p) => calculateTreatingValue(p))) : 0;

        const id = uuidv4();
        const newPerson: Personnel = {
            id,
            userId: currentUserId,
            name: newName.trim(),
            email: newEmail.trim(),
            phone: newPhone.trim() || undefined,
            hostingCount: 0,
            lastHosted: "",
            hostOffset: minCalculatedValue, // Set hostOffset to current minimum calculated value
        };

        try {
            // Add to database
            const { error } = await supabase.from("personnel").insert({
                id,
                userId: currentUserId,
                name: newPerson.name,
                email: newPerson.email,
                phone: newPerson.phone,
                hostingCount: 0,
                hostOffset: minCalculatedValue,
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
            await generateSchedule(updatedPersons, sortType);
        } catch (error) {
            console.error("Failed to add person:", error);
            alert("Failed to add person. Please try again.");
        }
    };

    // Initialize data on mount
    useEffect(() => {
        console.log("Component mounted, calling fetchData...");
        fetchData();
    }, []);

    // 当debug模式或debug日期变化时，重新更新completed标志
    useEffect(() => {
        if (schedule.length > 0) {
            console.log("Debug mode or date changed, updating completed flags...");
            fetchAndMarkCompleted().then(() => {
                console.log("Completed flags updated according to debug settings");
            });
        }
    }, [debugMode, debugDate]);

    // Calculate calendar days
    const calendarDays = useMemo(() => generateCalendar(), [currentMonth, currentYear]);

    // Get the next upcoming treating day and person
    const nextTreatingInfo = useMemo(() => {
        const todayDate = getToday();
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
    }, [schedule, persons, debugMode, debugDate]);

    return {
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
        currentPerson,
        userId,

        // Methods
        setFocusedDate,
        setSortType,
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
        generateSchedule,
        changeSortType,
        sendNotification,
        sendHostNotification,
        sendTeamNotification,
        prevMonth,
        nextMonth,
        getMonthName,
        generateCalendar,
        swapPersons,
        handleDateSelect,
        removePerson,
        addPerson,
        calculateFutureHostingCounts,
        isDateInPast,
    };
} 