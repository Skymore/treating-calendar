# 构建公平的团队轮值系统 - Thursday Treating Calendar 项目分享
# Building a Fair Team Rotation System - Thursday Treating Calendar Project

## 项目背景与需求 | Project Background and Requirements

在团队工作中，经常会有轮流请客、值日或负责某项任务的需求。特别是在我们团队中，我们有一个周四请客的传统。然而，随着团队人员的变动，如何确保公平分配请客任务成为一个需要技术解决的问题。

In team environments, there's often a need for rotating responsibilities such as treating colleagues, daily duties, or handling specific tasks. In our team particularly, we have a tradition of Thursday treats. However, with team personnel changes, ensuring fair distribution of treating duties became a technical challenge that needed to be solved.

为此，我开发了"Thursday Treating Calendar"——一个现代化的React应用，专注于管理团队的每周请客安排，特别是周四的请客活动。

To address this, I developed "Thursday Treating Calendar"—a modern React application focused on managing the team's weekly treating schedule, with special emphasis on Thursday treating events.

## 技术栈选择 | Technology Stack

项目采用了以下技术栈：

The project utilizes the following technology stack:

- **前端框架 | Frontend Framework**: React + TypeScript，利用强类型提高代码质量和开发效率 (leveraging strong typing to improve code quality and development efficiency)
- **构建工具 | Build Tool**: Vite，享受其快速的开发和构建体验 (enjoying its fast development and build experience)
- **后端数据库 | Backend Database**: Supabase，作为Backend-as-a-Service解决方案 (as a Backend-as-a-Service solution)
- **边缘计算 | Edge Computing**: Edge Functions，在CDN边缘节点运行无服务器函数，降低延迟，提高性能 (serverless functions running at CDN edge nodes, reducing latency and improving performance)
- **样式处理 | Styling**: Tailwind CSS，实现快速响应式设计 (implementing quick responsive design)
- **日期处理 | Date Handling**: @internationalized/date，处理复杂的日期计算 (handling complex date calculations)
- **通知系统 | Notification System**: Resend API，发送邮件提醒 (sending email reminders)

## 核心功能与设计理念 | Core Features and Design Philosophy

### 1. 人员管理与自动调度 | Personnel Management and Automatic Scheduling

系统允许添加、删除和管理团队成员，自动生成平衡的请客安排表。这里采用了两种调度方法：

The system allows adding, removing, and managing team members, automatically generating balanced treating schedules. Two scheduling methods are implemented:

- **基于名称的排序 | Name-based Sorting**: 按字母顺序排序，但考虑计算值 (sorts alphabetically by name, but considers calculated values)
- **随机排序 | Random Sorting**: 随机分配，但优先考虑计算值低的成员 (randomly assigns, but prioritizes members with lower calculated values)

### 2. 公平分配系统 - hostOffset机制 | Fair Distribution System - hostOffset Mechanism

这是系统最核心的设计，解决了当新成员加入团队时如何确保公平性的问题：

This is the core design of the system, solving the fairness issue when new members join the team:

```typescript
// Each person has two important values:
// 1. hostingCount: Actual number of times they've treated
// 2. hostOffset: An offset value for fair calculation
const calculatePriority = (person) => {
  return person.hostingCount + person.hostOffset;
}
```

当新成员加入时，他们会获得一个`hostOffset`值，等于现有所有成员中最小的"计算值"（hostingCount + hostOffset）。这确保了：

When new members join, they receive a `hostOffset` value equal to the minimum "calculated value" (hostingCount + hostOffset) among all existing members. This ensures:

1. 新成员不会因为刚加入就获得不公平的优势 (New members don't get an unfair advantage just because they've just joined)
2. 新成员不会一加入就立即承担请客责任 (New members aren't immediately burdened with treating duties upon joining)

举个例子：

Here's an example:

```typescript
// Example scenario:
const teamMembers = [
  { name: 'A', hostingCount: 3, hostOffset: 0 }, // calculated value: 3
  { name: 'B', hostingCount: 2, hostOffset: 0 }, // calculated value: 2
  { name: 'C', hostingCount: 1, hostOffset: 0 }, // calculated value: 1
];

// When new member D joins:
const minCalculatedValue = Math.min(...teamMembers.map(m => m.hostingCount + m.hostOffset)); // = 1
const newMember = { name: 'D', hostingCount: 0, hostOffset: minCalculatedValue }; // offset = 1

// In priority calculation, members are ranked:
// - A: 3 + 0 = 3
// - B: 2 + 0 = 2
// - C: 1 + 0 = 1
// - D: 0 + 1 = 1
```

这种机制创建了一个平衡且公平的轮换系统。

This mechanism creates a balanced and fair rotation system.

### 3. 电子邮件通知 | Email Notifications

为了确保团队成员记得他们的请客任务，系统集成了Resend API发送提醒邮件。Resend API作为现代电子邮件发送解决方案，提供了高可靠性、良好的可交付性和简洁的开发体验，很好地满足了项目的通知需求：

To ensure team members remember their treating duties, the system integrates Resend API to send reminder emails. As a modern email delivery solution, Resend API offers high reliability, good deliverability, and a clean developer experience, perfectly meeting the notification needs of the project:

```typescript
// Email notification system using Resend API
const sendReminder = async (host, date) => {
  // Get template from database
  const template = await getEmailTemplate('reminder');
  
  // Replace placeholders with actual values
  const htmlContent = template.html_content
    .replace('{{hostName}}', host.name)
    .replace('{{date}}', formatDate(date));
    
  // Send email using Resend API
  await resend.emails.send({
    from: 'noreply@example.com',
    to: host.email,
    subject: template.subject,
    html: htmlContent,
  });
}
```

结合Edge Functions，邮件通知系统能够以低延迟高效地处理请求，即使在全球范围内也能保持出色的性能。

Combined with Edge Functions, the email notification system can process requests efficiently with low latency, maintaining excellent performance even on a global scale.

### 4. 数据库设计 | Database Design

项目使用Supabase作为后端，设计了四个主要表：

The project uses Supabase as the backend, with four main tables designed:

1. `personnel`表：存储人员信息及其请客历史记录 (stores personnel information and their treating history)
2. `host_schedule`表：存储请客安排日程 (stores treating schedule)
3. `teams`表：存储团队信息 (stores team information)
4. `email_templates`表：存储可自定义的邮件模板 (stores customizable email templates)

## 部署与运维 | Deployment and Operations

项目采用Vercel进行部署，这提供了简单的CI/CD流程和良好的性能。部署配置相对简单：

The project is deployed using Vercel, which provides a simple CI/CD process and good performance. The deployment configuration is relatively straightforward:

1. 使用Vite作为框架预设 (Using Vite as the framework preset)
2. 设置必要的环境变量 (Setting necessary environment variables)
3. 部署后即可访问 (Accessible after deployment)

项目已成功部署，可通过以下地址访问：[treating.ruit.me](https://treating.ruit.me)

The project has been successfully deployed and can be accessed at: [treating.ruit.me](https://treating.ruit.me)

## 总结与收获 | Conclusion and Takeaways

通过开发这个项目，我不仅解决了团队实际需求，还深入实践了React、TypeScript与Supabase的结合应用。hostOffset机制的设计是整个项目的亮点，它解决了一个看似简单却实际复杂的公平性问题。

Through developing this project, I not only solved a real team need but also deeply practiced the combined application of React, TypeScript, and Supabase. The design of the hostOffset mechanism is the highlight of the entire project, solving a seemingly simple but actually complex fairness problem.

这个项目也让我体会到，技术解决方案应该从实际需求出发，即使是看似简单的轮值安排，也可以通过合理的技术设计使其更加公平和高效。

This project also made me realize that technical solutions should start from practical needs—even seemingly simple rotation arrangements can be made more fair and efficient through sound technical design. 