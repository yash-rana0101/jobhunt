import { prisma } from "@job-hunter/database";

/**
 * Creates default follow-up reminders (Day 3, 7, 14) for a new application.
 */
export async function createDefaultReminders(applicationId: string): Promise<void> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });

  if (!application) return;

  const now = new Date();

  // Day 3
  const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  await prisma.applicationReminder.create({
    data: {
      applicationId,
      reminderType: "DAY_3",
      title: `3-Day Follow Up: ${application.job.company}`,
      description: `Check response status or send first follow-up for the ${application.job.title} position.`,
      dueDate: day3,
      status: "PENDING",
    },
  });

  // Day 7
  const day7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await prisma.applicationReminder.create({
    data: {
      applicationId,
      reminderType: "DAY_7",
      title: `7-Day Follow Up: ${application.job.company}`,
      description: `Connect with hiring manager/recruiters on LinkedIn for ${application.job.title}.`,
      dueDate: day7,
      status: "PENDING",
    },
  });

  // Day 14
  const day14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  await prisma.applicationReminder.create({
    data: {
      applicationId,
      reminderType: "DAY_14",
      title: `14-Day Check-in: ${application.job.company}`,
      description: `Assess response rates and proceed with outreach for ${application.job.title}.`,
      dueDate: day14,
      status: "PENDING",
    },
  });
}

/**
 * Creates a custom reminder for an application.
 */
export async function createCustomReminder(
  applicationId: string,
  title: string,
  description: string | null,
  dueDate: Date,
): Promise<void> {
  await prisma.applicationReminder.create({
    data: {
      applicationId,
      reminderType: "CUSTOM",
      title,
      description,
      dueDate,
      status: "PENDING",
    },
  });
}
