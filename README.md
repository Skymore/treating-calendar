# Thursday Treating Calendar

A modern React application to manage team's weekly treating schedule, focusing on Thursdays.

## Features

- **Personnel Management**: Add, remove, and manage team members
- **Automatic Scheduling**: Generate balanced treating schedules
- **Smart Allocation**: Prioritize members with fewer treating counts
- **Thursday Highlights**: Special focus on Thursdays as treating days
- **Email Notifications**: Send reminders to team members via Resend API
- **Fair Distribution System**: Uses hostOffset mechanism to ensure fairness when new members join 
- **Team Information Management**: Create and manage team information
- **Debug Mode**: Special debug controls for testing

## Tech Stack

- React + TypeScript
- Vite as build tool
- Supabase for backend database
- Tailwind CSS for styling
- @internationalized/date for date handling
- Resend API for email notifications

## Database Structure

The application uses the following tables in Supabase:

1. `personnel` table:
   - `id`: UUID (primary key)
   - `name`: String
   - `email`: String
   - `phone`: String (optional)
   - `hostingCount`: Integer (number of times treated)
   - `lastHosted`: Timestamp with timezone (when the person last treated)
   - `hostOffset`: Integer (offset value for fair scheduling when joining mid-cycle)
   - `userId`: UUID (foreign key to teams table)

2. `host_schedule` table:
   - `id`: UUID (primary key)
   - `personnelId`: UUID (foreign key to personnel)
   - `date`: Date string
   - `notified`: Boolean
   - `completed`: Boolean
   - `team_id`: UUID (foreign key to teams table)

3. `teams` table:
   - `userId`: UUID (primary key)
   - `teamName`: String
   - `createdAt`: Timestamp with timezone

4. `email_templates` table:
   - `id`: UUID (primary key)
   - `template_type`: String
   - `template_name`: String
   - `subject`: String
   - `html_content`: String
   - `text_content`: String
   - `created_at`: Timestamp with timezone
   - `updated_at`: Timestamp with timezone
   - `userId`: UUID (foreign key to teams table)

### The hostOffset Mechanism

The system implements a fair treating distribution algorithm using a `hostOffset` mechanism:

- Each person has two values: `hostingCount` (actual number of times they've treated) and `hostOffset` (an offset value)
- When determining treating order, the system uses a "calculated value" = `hostingCount + hostOffset`
- New members receive a `hostOffset` equal to the minimum "calculated value" of all existing members
- This ensures that new members don't get unfair advantage by joining mid-cycle
- It also ensures they aren't immediately burdened with treating duties upon joining

Example scenario:
1. Team has members A, B, and C with hosting counts of 3, 2, and 1 respectively (all joined at the beginning with `hostOffset = 0`)
2. When new member D joins, the minimum "calculated value" is 1 (from member C)
3. Member D gets assigned `hostOffset = 1` and `hostingCount = 0`
4. In the ordering calculation, members are ranked:
   - A: 3 + 0 = 3
   - B: 2 + 0 = 2
   - C: 1 + 0 = 1
   - D: 0 + 1 = 1
5. Members C and D have equal priority (both have calculated value 1), followed by B, then A
6. This creates a balanced and fair rotation system for everyone

## Getting Started

### Prerequisites

- Node.js 14+ and npm
- Supabase account and project with tables set up as described above
- Resend API account (for email notifications)

### Installation

1. Clone this repository
```bash
git clone [repository-url]
cd thursday-treating-calendar
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```
Then edit the `.env` file to add your credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key
```

4. Set up the database tables

5. Start the development server
```bash
npm run dev
```

## Usage

1. **Create Team**: Start by creating a team with name and email
2. **Add Team Members**: Add personnel with their name, email, and optional phone number
3. **Generate Schedule**: Choose between name-based or random scheduling
4. **View Calendar**: Browse the calendar to see treating assignments
5. **Send Notifications**: Notify team members about upcoming treating duties
6. **Test Emails**: Test email notifications through the Email Test panel

### Scheduling Logic

The application uses two scheduling methods with the fairness mechanism:

1. **Name-based**: Sorts team members alphabetically by name, but uses the calculated value (hostingCount + hostOffset) to ensure fair rotation
2. **Random**: Randomly sorts members but prioritizes those with the lowest calculated value

Both methods ensure fair rotation by keeping track of each person's treating count and applying appropriate offsets for new members.

## Deployment to Vercel

You can easily deploy this application to Vercel by following these steps:

### Prerequisites
- A Vercel account
- Git repository with your project code

### Steps for Deployment

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Log in to your Vercel account and click "New Project"

3. Import your Git repository

4. Configure the project:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. Add Environment Variables:
   - VITE_SUPABASE_URL: your_supabase_url
   - VITE_SUPABASE_ANON_KEY: your_supabase_anon_key
   - RESEND_API_KEY: your_resend_api_key
   - VITE_APP_URL: your_production_url (e.g., https://your-app-domain.com)

6. Click "Deploy"

7. After the deployment is complete, you can access your application at the provided Vercel URL
