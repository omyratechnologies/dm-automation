import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { Public } from "../auth/public.decorator";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser, CurrentWorkspace } from "../auth/decorators";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { GdprService } from "./gdpr.service";

const confirmationCodeSchema = z.string().regex(/^[0-9a-f]{12}$/);

@ApiTags("gdpr")
@Controller()
export class GdprController {
  constructor(private readonly gdpr: GdprService) {}

  /** Meta app-deauthorize callback (x-www-form-urlencoded signed_request). */
  @Public()
  @Post("webhooks/meta/deauthorize")
  @HttpCode(HttpStatus.OK)
  deauthorize(@Body("signed_request") signedRequest?: string) {
    return this.gdpr.deauthorize(signedRequest);
  }

  /** Meta data-deletion callback (x-www-form-urlencoded signed_request). */
  @Public()
  @Post("webhooks/meta/data-deletion")
  @HttpCode(HttpStatus.OK)
  dataDeletion(@Body("signed_request") signedRequest?: string) {
    return this.gdpr.dataDeletion(signedRequest);
  }

  /** Public status used by the confirmation URL returned to Meta. */
  @Public()
  @Get("webhooks/meta/data-deletion/:code")
  @ApiOperation({ summary: "Get Meta data-deletion request status" })
  @ApiOkResponse({
    schema: {
      example: {
        confirmationCode: "a1b2c3d4e5f6",
        status: "completed",
        requestedAt: "2026-08-18T10:00:00.000Z",
        completedAt: "2026-08-18T10:00:01.000Z",
      },
    },
  })
  @ApiNotFoundResponse({ description: "Deletion request not found" })
  dataDeletionStatus(
    @Param("code", new ZodValidationPipe(confirmationCodeSchema)) code: string,
  ) {
    return this.gdpr.dataDeletionStatus(code);
  }

  /** GDPR right-to-erasure at tenant level: purge the whole workspace. */
  @ApiBearerAuth()
  @Delete("workspaces/:workspaceId")
  @Roles("OWNER")
  deleteWorkspace(
    @CurrentUser() user: AuthedRequestUser,
    @CurrentWorkspace() ws: WorkspaceContext,
  ) {
    return this.gdpr.deleteWorkspace(ws, user);
  }

}
