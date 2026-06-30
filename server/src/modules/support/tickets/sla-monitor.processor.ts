import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { SLA_MONITOR_QUEUE } from '../../../queue/queue.constants';

@Processor(SLA_MONITOR_QUEUE)
export class SlaMonitorProcessor extends WorkerHost {
  private readonly logger = new Logger(SlaMonitorProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'check-sla-breaches') {
      this.logger.log(`[QUEUE] Processing SLA Breach detection (Job: ${job.id})`);

      const now = new Date();
      let breachedCount = 0;

      // 1. Check Response SLA (Tickets that are OPEN and responseDueAt has passed)
      const missedResponseTickets = await this.prisma.ticket.findMany({
        where: {
          status: 'OPEN',
          responseDueAt: { lt: now },
          slaBreached: false, // assuming this means either response or resolution breached
        },
      });

      for (const ticket of missedResponseTickets) {
        this.logger.warn(`[SLA BREACH - RESPONSE] Ticket ${ticket.id} (${ticket.title})`);
        await this.prisma.ticket.update({
          where: { id: ticket.id },
          data: { slaBreached: true },
        });

        // Notify creator and anyone assigned
        await this.notificationsService.create({
          userId: ticket.createdById,
          type: 'TICKET_ESCALATED', // reuse or define new type
          title: 'SLA Breach (Response)',
          body: `Ticket "${ticket.title}" missed its initial response SLA.`,
          metadata: { ticketId: ticket.id },
        });

        breachedCount++;
      }

      // 2. Check Resolution SLA (Tickets that are OPEN or IN_PROGRESS and resolutionDueAt has passed)
      const missedResolutionTickets = await this.prisma.ticket.findMany({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] },
          resolutionDueAt: { lt: now },
          slaBreached: false,
        },
      });

      for (const ticket of missedResolutionTickets) {
        this.logger.warn(`[SLA BREACH - RESOLUTION] Ticket ${ticket.id} (${ticket.title})`);
        await this.prisma.ticket.update({
          where: { id: ticket.id },
          data: { slaBreached: true },
        });

        await this.notificationsService.create({
          userId: ticket.createdById,
          type: 'TICKET_ESCALATED',
          title: 'SLA Breach (Resolution)',
          body: `Ticket "${ticket.title}" missed its resolution SLA.`,
          metadata: { ticketId: ticket.id },
        });

        breachedCount++;
      }

      return { breachedCount };
    }
  }
}
