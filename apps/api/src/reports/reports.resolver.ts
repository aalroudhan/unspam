import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CarrierReport, SendReportInput, SendReportResult } from './reports.types';

@Resolver(() => CarrierReport)
export class ReportsResolver {
  constructor(private readonly reportsService: ReportsService) {}

  @Query(() => [CarrierReport], {
    description: 'Generate carrier complaint reports from intercepted call log',
  })
  reports(): Promise<CarrierReport[]> {
    return this.reportsService.generateReports();
  }

  @Mutation(() => SendReportResult, {
    description: 'Send complaint email to a carrier abuse desk',
  })
  @UseGuards(JwtAuthGuard)
  async sendReport(@Args('input') input: SendReportInput): Promise<SendReportResult> {
    await this.reportsService.sendReport(input.carrier, input.testMode ?? false);
    return { sent: true };
  }
}
