import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('health')
  @Roles(Role.ADMIN)
  checkHealth() {
    return { status: 'ok', module: 'AiGateway' };
  }

  @Post('insights/:id/accept')
  @Roles(Role.ADMIN, Role.PM, Role.SECRETARY, Role.TEAM_LEAD)
  acceptInsight(@Param('id') insightId: string, @Request() req: any) {
    return this.aiService.acceptInsight(insightId, req.user.userId);
  }

  @Post('insights/:id/override')
  @Roles(Role.ADMIN, Role.PM, Role.SECRETARY, Role.TEAM_LEAD)
  overrideInsight(
    @Param('id') insightId: string,
    @Body('overrideReason') overrideReason: string,
    @Request() req: any,
  ) {
    return this.aiService.overrideInsight(insightId, req.user.userId, overrideReason);
  }

  @Post('insights/:id/ignore')
  @Roles(Role.ADMIN, Role.PM, Role.SECRETARY, Role.TEAM_LEAD)
  ignoreInsight(@Param('id') insightId: string) {
    return this.aiService.ignoreInsight(insightId);
  }
}
