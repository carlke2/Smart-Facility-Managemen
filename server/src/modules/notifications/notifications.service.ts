import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationType } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NOTIFICATION_QUEUE } from '../../queue/queue.constants';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, any>;
  hostId?: string; // used for Visitor notification hack in schema for now
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly notificationQueue: Queue,
  ) {}

  /** Create an in-app notification for a user and enqueue external dispatch */
  async create(params: CreateNotificationParams) {
    const targetUserId = params.userId || params.hostId;
    this.logger.log(`Creating ${params.type} notification for user: ${targetUserId}`);
    
    // 1. Sync: Create In-App Notification Record
    const record = await this.prisma.notification.create({
      data: {
        userId: targetUserId!,
        type: params.type,
        title: params.title,
        body: params.body,
        metadata: params.metadata ?? {},
        isRead: false,
      },
    });

    // 2. Async: Enqueue External Delivery Job (Email/SMS)
    await this.notificationQueue.add('dispatch-notification', {
      userId: targetUserId,
      type: params.type,
      title: params.title,
      body: params.body,
      metadata: params.metadata,
      notificationId: record.id,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });

    return record;
  }


  /** Bulk-create notifications (e.g. notify all coordinators on SLA breach) */
  async createMany(notifications: CreateNotificationParams[]) {
    return this.prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        metadata: n.metadata ?? {},
        isRead: false,
      })),
    });
  }

  /** Get all notifications for a user (unread first, then by date) */
  async findForUser(userId: string, onlyUnread = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(onlyUnread ? { isRead: false } : {}) },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: 100,
    });
  }

  /** Get unread count for a user (for badge display) */
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({ where: { userId, isRead: false } });
    return { count };
  }

  /** Mark a single notification as read */
  async markRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  /** Mark all notifications as read for a user */
  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  // ─── Pre-built notification helpers ──────────────────────────────────────────

  async notifyBookingApproved(userId: string, bookingTitle: string, bookingId: string) {
    return this.create({
      userId,
      type: 'BOOKING_APPROVED',
      title: 'Booking Approved',
      body: `Your booking "${bookingTitle}" has been approved.`,
      metadata: { bookingId },
    });
  }

  async notifyBookingRejected(userId: string, bookingTitle: string, reason: string, bookingId: string) {
    return this.create({
      userId,
      type: 'BOOKING_REJECTED',
      title: 'Booking Rejected',
      body: `Your booking "${bookingTitle}" was rejected. Reason: ${reason}`,
      metadata: { bookingId },
    });
  }

  async notifyTicketAssigned(userId: string, ticketTitle: string, ticketId: string) {
    return this.create({
      userId,
      type: 'TICKET_ASSIGNED',
      title: 'Ticket Assigned to You',
      body: `You have been assigned ticket: "${ticketTitle}".`,
      metadata: { ticketId },
    });
  }

  async notifyTicketEscalated(userId: string, ticketTitle: string, ticketId: string) {
    return this.create({
      userId,
      type: 'TICKET_ESCALATED',
      title: 'Ticket Escalated',
      body: `Ticket "${ticketTitle}" has been escalated and requires attention.`,
      metadata: { ticketId },
    });
  }

  async notifyVisitorArrived(hostId: string, visitorName: string, company: string | null, visitorId: string) {
    return this.create({
      hostId,
      type: 'VISITOR_ARRIVED',
      title: 'Visitor Arrived',
      body: `${visitorName}${company ? ` from ${company}` : ''} has arrived at reception.`,
      metadata: { visitorId },
    } as any);
  }

  async notifyLeaveApproved(userId: string, leaveType: string, leaveId: string) {
    return this.create({
      userId,
      type: 'LEAVE_APPROVED',
      title: 'Leave Approved',
      body: `Your ${leaveType} leave request has been approved.`,
      metadata: { leaveId },
    });
  }

  async notifyLeaveRejected(userId: string, leaveType: string, reviewNote: string | undefined, leaveId: string) {
    return this.create({
      userId,
      type: 'LEAVE_REJECTED',
      title: 'Leave Rejected',
      body: `Your ${leaveType} leave request was rejected.${reviewNote ? ` Note: ${reviewNote}` : ''}`,
      metadata: { leaveId },
    });
  }
}
