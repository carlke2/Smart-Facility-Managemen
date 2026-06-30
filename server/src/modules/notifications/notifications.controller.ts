import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /notifications — get all notifications for the current user */
  @Get()
  findMyNotifications(
    @Request() req: any,
    @Query('unread') unread?: string,
  ) {
    return this.notificationsService.findForUser(req.user.id, unread === 'true');
  }

  /** GET /notifications/unread-count — badge count */
  @Get('unread-count')
  getUnreadCount(@Request() req: any) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  /** PATCH /notifications/:id/read — mark single notification as read */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.notificationsService.markRead(id, req.user.id);
  }

  /** PATCH /notifications/read-all — mark all as read */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@Request() req: any) {
    return this.notificationsService.markAllRead(req.user.id);
  }
}
