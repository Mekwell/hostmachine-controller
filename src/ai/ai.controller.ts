import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { ReportIssueDto } from './dto/report-issue.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('report')
  @UseGuards(ApiKeyGuard)
  async reportIssue(
    @Headers('x-node-id') nodeId: string,
    @Body() report: ReportIssueDto,
  ) {
    return this.aiService.analyzeAndRemediate(nodeId, report);
  }
}
