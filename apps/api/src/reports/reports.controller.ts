import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ReportsService } from './reports.service';

class SendReportDto {
  @IsString()
  @IsNotEmpty()
  carrier: string;

  @IsOptional()
  @IsBoolean()
  testMode?: boolean;
}

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Generate carrier complaint reports from intercepted call log' })
  generateReports() {
    return this.reportsService.generateReports();
  }

  @Post('send')
  @ApiOperation({ summary: 'Send complaint email to a carrier abuse desk' })
  async sendReport(@Body() dto: SendReportDto) {
    await this.reportsService.sendReport(dto.carrier, dto.testMode ?? false);
    return { sent: true };
  }
}
