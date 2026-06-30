import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { RECURRENCE_QUEUE } from '../../../queue/queue.constants';

@Processor(RECURRENCE_QUEUE)
export class BookingRecurrenceProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingRecurrenceProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'expand-recurring-bookings') {
      this.logger.log(`[QUEUE] Processing Recurring Bookings Expansion (Job: ${job.id})`);

      const now = new Date();
      // Look 30 days ahead
      const expansionWindowEnd = new Date(now);
      expansionWindowEnd.setDate(now.getDate() + 30);

      // Find all active parent recurring bookings
      const recurringBookings = await this.prisma.booking.findMany({
        where: {
          status: { in: ['PENDING', 'APPROVED'] },
          recurrence: { not: 'NONE' },
          // Filter to those that haven't ended or end within our window
          OR: [
            { recurrenceEndDate: null },
            { recurrenceEndDate: { gte: now } }
          ],
        },
      });

      let generatedCount = 0;

      for (const parent of recurringBookings) {
        // Simple daily expansion example
        if (parent.recurrence === 'DAILY') {
          // Generate bookings for the next 30 days, skipping days that already exist
          for (let i = 1; i <= 30; i++) {
            const nextDate = new Date(parent.date);
            nextDate.setDate(nextDate.getDate() + i);

            // Stop if past the recurrence end date
            if (parent.recurrenceEndDate && nextDate > parent.recurrenceEndDate) break;

            const newStart = new Date(nextDate);
            newStart.setHours(parent.startTime.getHours(), parent.startTime.getMinutes());

            const newEnd = new Date(nextDate);
            newEnd.setHours(parent.endTime.getHours(), parent.endTime.getMinutes());

            // Check if this instance already exists
            const existing = await this.prisma.booking.findFirst({
              where: {
                roomId: parent.roomId,
                date: nextDate,
                startTime: newStart,
                endTime: newEnd,
                title: parent.title,
                createdById: parent.createdById,
              },
            });

            if (!existing) {
              // Check for conflict
              const conflict = await this.prisma.booking.findFirst({
                where: {
                  roomId: parent.roomId,
                  date: nextDate,
                  status: { in: ['PENDING', 'APPROVED'] },
                  AND: [{ startTime: { lt: newEnd } }, { endTime: { gt: newStart } }],
                },
              });

              if (!conflict) {
                await this.prisma.booking.create({
                  data: {
                    title: parent.title,
                    roomId: parent.roomId,
                    createdById: parent.createdById,
                    date: nextDate,
                    startTime: newStart,
                    endTime: newEnd,
                    status: parent.status, // Inherit pending/approved
                    notes: `Auto-generated recurrence of booking ${parent.id}`,
                    recurrence: 'NONE', // Children don't recurse
                  },
                });
                generatedCount++;
              } else {
                this.logger.warn(`Skipped recurrence for ${parent.title} on ${nextDate.toISOString()} due to conflict.`);
              }
            }
          }
        }
      }

      return { processedParents: recurringBookings.length, generatedCount };
    }
  }
}
