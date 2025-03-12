import { useEffect } from "react";
import { useEmailNotification } from "./useEmailNotification";
import { useEmailTemplate } from "./useEmailTemplate";
import { useTreatingStore } from "../stores/treatingStore";
import { getAppBaseUrl } from "../lib/urlUtils";
import { supabase } from "../lib/supabase";
import { CalendarDate, getLocalTimeZone } from "@internationalized/date";
import { getUserId } from "../lib/userIdUtils";

// 这个钩子现在只处理邮件通知等特殊逻辑，不再导出store的内容
export function useTreatingCalendar() {
    // 使用Zustand store
    const { 
        debugDate, 
        getPersonForDate,
        persons
    } = useTreatingStore();

    // 添加邮件通知hook
    const { sendNotification: sendEmailNotification } = useEmailNotification();
    const { hostTemplate, teamTemplate } = useEmailTemplate();

    // 从store获取fetchData方法
    const { fetchData } = useTreatingStore.getState();

    // 初始化时加载数据
    useEffect(() => {
        fetchData();
    }, []);

    // 发送主持人通知
    const sendHostNotification = async () => {
        let nextThursday = debugDate;
        const { isThursday } = useTreatingStore.getState();
        
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
                .eq('userId', getUserId())
                .eq('template_type', 'host_notification')
                .maybeSingle();
                
            if (templateError && templateError.code !== 'PGRST116') {
                throw templateError;
            }
            
            // Use template from database or fallback to default
            let subject = 'Reminder: You are scheduled to bring breakfast for the team on {date}';
            let content = `<p>Dear {name},</p>
<p>This is a friendly reminder that you are scheduled to bring breakfast for the team on <strong>{date}</strong> (Thursday morning).</p>
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
                    .update({ hostNotified: true })
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

    // 发送团队通知
    const sendTeamNotification = async () => {
        let nextThursday = debugDate;
        const { isThursday } = useTreatingStore.getState();
        
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
                .eq('userId', getUserId())
                .eq('template_type', 'team_notification')
                .maybeSingle();
                
            if (templateError && templateError.code !== 'PGRST116') {
                throw templateError;
            }
            
            // Use template from database or fallback to default
            let subject = 'Team Notification: Breakfast Schedule for {date}';
            let content = `<p>Dear Team Members,</p>
<p>This is a friendly reminder that <strong>{name}</strong> is scheduled to bring breakfast for the team on <strong>{date}</strong> (Thursday morning).</p>
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
                    .update({ teamNotified: true })
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

    // 只返回邮件通知相关的方法和fetchData
    return {
        sendHostNotification,
        sendTeamNotification,
        fetchData
    };
} 