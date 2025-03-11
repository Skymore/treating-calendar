# Setting Up Weekly Wednesday Email Notifications
# 设置每周三自动邮件通知

This document explains how to set up automatic team treating reminder emails that are sent every Wednesday morning at 9:00 AM.

本文档说明如何设置每周三早晨9点自动发送团队treating提醒邮件。

## Feature Overview
## 功能概述

This functionality uses Supabase Edge Functions and Vercel Cron Jobs to implement scheduled email sending:

该功能使用Supabase Edge Functions和Vercel Cron Jobs来实现定时发送邮件的功能：

1. Vercel Cron Job triggers every Wednesday morning at 9:00 AM
2. The Cron Job calls the Supabase Edge Function
3. The Edge Function queries treating information for all teams and sends email notifications

1. 每周三早晨9点触发Vercel Cron Job
2. Cron Job调用Supabase Edge Function
3. Edge Function查询所有团队的treating信息，并发送邮件通知

## Key Features
## 主要特性

- **Dual Notifications**: Sends notifications to both the treating host and all team members
- **Separate Controls**: Teams can enable/disable host and team notifications independently
- **Template Support**: Uses custom email templates for each team
- **Duplicate Prevention**: Records notification status to avoid sending duplicates
- **Test Mode**: Allows testing notifications without updating the database
- **Force Resend**: Can force resend notifications even if they have been sent before
- **Notification Control**: Teams can enable or disable automatic notifications in Settings

- **双重通知**：同时向treating主持人和所有团队成员发送通知
- **独立控制**：团队可以独立启用/禁用主持人和团队成员的通知
- **模板支持**：使用团队自定义的邮件模板
- **避免重复**：记录通知状态，避免重复发送
- **测试模式**：可以在不更新数据库的情况下测试通知
- **强制重发**：可以强制重新发送已通知过的提醒
- **通知控制**：团队可以在设置中启用或禁用自动通知

## Notification Settings
## 通知设置

By default, automatic notifications are **disabled** for all teams. To enable notifications:

默认情况下，所有团队的自动通知功能均为**禁用**状态。要启用通知：

1. Go to the Settings panel in the application
2. Click on the "Notification Settings" tab
3. Toggle the switches to enable automatic notifications for your team
   - You can enable/disable host notifications and team notifications separately

1. 在应用程序中进入设置面板
2. 点击"Notification Settings"选项卡
3. 切换开关以启用团队的自动通知
   - 您可以分别启用/禁用主持人通知和团队成员通知

Even with automatic notifications disabled, you can still manually send notifications from the calendar page.

即使禁用了自动通知，您仍然可以通过日历页面手动发送通知。

## Deployment Steps
## 部署步骤

### Step 1: Deploy the Supabase Edge Function
### 步骤1：部署Supabase Edge Function

1. Make sure Supabase CLI is installed and logged in
1. 确保已安装Supabase CLI并登录
```bash
# Install using npm (recommended, avoids global installation issues)
# 使用npm安装(推荐，避免全局安装问题)
npm install supabase --save-dev

# Or use npx directly
# 或使用npx直接运行
npx supabase login
```

2. Link to your Supabase project
2. 链接到你的Supabase项目
```bash
npx supabase link --project-ref <your-project-id>
```

3. Deploy the Edge Function
3. 部署Edge Function
```bash
npx supabase functions deploy send-weekly-notification --project-ref <your-project-id>
```

4. Set up Supabase secrets
4. 设置Supabase密钥
```bash
npx supabase secrets set FUNCTION_SECRET_KEY=<your-key> --project-ref <your-project-id>
npx supabase secrets set RESEND_API_KEY=<your-resend-api-key> --project-ref <your-project-id>
npx supabase secrets set APP_URL=<your-app-url> --project-ref <your-project-id>
```

### Step 2: Set Environment Variables in Vercel
### 步骤2：在Vercel上设置环境变量

Add the following environment variables in the Environment Variables section of your Vercel project:

在Vercel项目的Environment Variables中添加以下环境变量：

- `FUNCTION_SECRET_KEY`: Key used to access the Supabase Edge Function
- `CRON_SECRET`: Key used to protect the Cron API endpoint
- Make sure that existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are also set correctly

- `FUNCTION_SECRET_KEY`: 用于访问Supabase Edge Function的密钥
- `CRON_SECRET`: 用于保护Cron API端点的密钥
- 确保已有的`VITE_SUPABASE_URL`和`VITE_SUPABASE_ANON_KEY`也正确设置

### Step 3: Deploy to Vercel
### 步骤3：部署到Vercel

1. Commit your code to your Git repository
2. Deploy to Vercel

1. 提交代码到你的Git仓库
2. 部署到Vercel

After deployment, Vercel will automatically set up the Cron Job according to the configuration in `vercel.json`, which will trigger every Wednesday morning at 9:00 AM.

部署后，Vercel会根据`vercel.json`中的配置自动设置Cron Job，每周三早晨9点触发。

## Testing
## 测试

You can test the notification functionality using the following methods:

你可以使用以下几种方式测试通知功能：

### Method 1: Using the Test Script
### 方法1：使用测试脚本

The project provides a test script that can manually trigger notifications:

项目提供了一个测试脚本，可以手动触发通知：

```bash
# Normal test (only sends notifications that haven't been sent yet)
# 普通测试（仅发送未通知状态的邮件）
npm run test-notification

# Force resend all notifications, even if they have been sent before
# 强制重新发送所有通知，即使已经发送过
npm run test-notification -- --force
```

The test script will display detailed notification results, including:
- Number of host notifications sent
- Number of team notifications sent
- Any errors that occurred

测试脚本会显示详细的通知结果，包括：
- 发送的主持人通知数量
- 发送的团队通知数量
- 任何发生的错误

### Method 2: Testing via API
### 方法2：通过API手动测试

You can call the API endpoint directly to test:

你可以直接调用API端点来测试：

```
GET /api/trigger-weekly-notification
Headers: Authorization: Bearer <your-CRON_SECRET-value>
```

### Method 3: Testing via Supabase Dashboard
### 方法3：通过Supabase Dashboard测试

1. Log into the Supabase Dashboard
2. Navigate to Functions > send-weekly-notification
3. Use the test interface and add the following request body:

1. 登录Supabase Dashboard
2. 导航到Functions > send-weekly-notification
3. 使用界面测试功能，添加以下请求体：
```json
{
  "isScheduledExecution": true,
  "isTest": true,
  "forceResend": false
}
```

## Parameter Description
## 参数说明

The Edge Function supports the following parameters:

Edge Function支持以下参数：

- `isScheduledExecution`: Marks the request as coming from a scheduled task (must be true)
- `isTest`: Test mode, will not update notification status in the database
- `forceResend`: Forces resending notifications, even if they have been sent before

- `isScheduledExecution`: 标记请求来自定时任务(必须为true)
- `isTest`: 测试模式，不会更新数据库中的通知状态
- `forceResend`: 强制重新发送通知，即使已经通知过

## Logging and Monitoring
## 日志和监控

The Edge Function outputs detailed logs, including:
- Running mode and parameters
- Number of teams found
- Processing status for each team
- Number of team members and valid email addresses
- Success or failure details for sending

Edge Function会输出详细日志，包括：
- 运行模式和参数
- 找到的团队数量
- 每个团队的处理状态
- 团队成员数量和有效邮箱数量
- 发送成功或失败的详情

These logs can be viewed in the Function logs section of the Supabase Dashboard.

这些日志可以在Supabase Dashboard的Function日志中查看。

## Troubleshooting
## 故障排除

If automatic emails are not working, check the following points:

如果自动邮件不工作，请检查以下几点：

1. Confirm all environment variables are set correctly
2. Check the Vercel Cron Job logs
3. Check the Supabase Edge Function logs
4. Verify that the Resend API key is valid
5. Ensure there is correct treating schedule data in the database
6. Verify that email templates exist and are correct
7. Observe whether it's the host notification (hostNotification) or team notification (teamNotification) that's failing
8. Verify that automatic notifications are enabled for the team in Settings (disabled by default)

1. 确认所有环境变量正确设置
2. 检查Vercel Cron Job日志
3. 检查Supabase Edge Function日志
4. 验证Resend API密钥是否有效
5. 确保数据库中有正确的treating安排数据
6. 验证邮件模板是否存在和正确
7. 观察具体是主持人通知(hostNotification)还是团队通知(teamNotification)发送失败
8. 确认团队在设置中已启用自动通知功能（默认为禁用状态）

### Common Issues
### 常见问题

1. **No team notifications sent**: Could be because the `teamNotified` field is already `true` in the database; try testing with the `--force` option
2. **Sending failures**: Check if the Resend API key is valid and team member email addresses are correct
3. **Domain verification error**: If using a custom sender address, you need to verify the domain on Resend; otherwise use the default `onboarding@resend.dev`
4. **No notifications for a specific team**: Check if the team has enabled notifications in Settings (default is disabled)

1. **没有发送团队通知**: 可能是因为数据库中的`teamNotified`字段已为`true`，尝试使用`--force`选项测试
2. **发送失败**: 检查Resend API密钥是否有效，以及团队成员邮箱是否正确
3. **域名验证错误**: 如果使用自定义发件人地址，需要在Resend上验证域名；否则使用默认的`onboarding@resend.dev`
4. **特定团队没有收到通知**: 检查团队是否在设置中启用了通知功能（默认为禁用）

## Security Considerations
## 安全注意事项

- Keep `FUNCTION_SECRET_KEY` and `CRON_SECRET` private
- Consider changing these keys periodically
- Monitor usage to detect unusual activity

- 保持`FUNCTION_SECRET_KEY`和`CRON_SECRET`的私密性
- 考虑定期更换这些密钥
- 监控使用情况以检测异常活动

## Update History
## 更新历史

- 2025-03-10: Added notification control feature, teams can now enable/disable notifications in Settings
- 2025-03-08: Added force resend functionality, enhanced logging
- 2025-03-08: Resolved domain verification issue, using Resend default domain
- 2025-03-08: Added test mode to avoid updating database during testing

- 2025-03-10: 添加通知控制功能，团队现在可以在设置中启用/禁用通知
- 2025-03-08: 添加强制重新发送功能，增强日志记录
- 2025-03-08: 解决域名验证问题，使用Resend默认域名
- 2025-03-08: 添加测试模式，避免在测试时更新数据库 