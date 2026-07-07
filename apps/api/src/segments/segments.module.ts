import { Module } from "@nestjs/common";
import { SegmentsController } from "./segments.controller";
import { SegmentsService } from "./segments.service";
import { SegmentQueryService } from "./segment-query.service";

@Module({
  controllers: [SegmentsController],
  providers: [SegmentsService, SegmentQueryService],
  exports: [SegmentQueryService],
})
export class SegmentsModule {}
