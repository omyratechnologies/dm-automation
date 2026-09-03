import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CurrentUser, CurrentWorkspace } from "../auth/decorators";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { ContactsService } from "./contacts.service";
import { RequireCapabilities, WorkspaceScoped } from "../auth/capabilities.decorator";
import { IdempotentCommand } from "../common/idempotency";

const listQuerySchema = z.object({
  search: z.string().min(1).max(100).optional(),
  tag: z.string().min(1).max(50).optional(),
  cursor: z.string().uuid().optional(),
});

const updateContactSchema = z
  .object({
    tags: z.array(z.string().min(1).max(50)).max(20).optional(),
    optedOut: z.boolean().optional(),
  })
  .refine((v) => v.tags !== undefined || v.optedOut !== undefined, {
    message: "At least one of tags or optedOut is required",
  });

@ApiTags("contacts")
@ApiBearerAuth()
@Controller("workspaces/:workspaceId/contacts")
@WorkspaceScoped()
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get()
  @RequireCapabilities("leads.read")
  list(
    @CurrentWorkspace() ws: WorkspaceContext,
    @Query(new ZodValidationPipe(listQuerySchema))
    query: z.infer<typeof listQuerySchema>,
  ) {
    return this.contacts.list(ws.id, query);
  }

  // Declared before ":id" so "tags" isn't captured as a contact id.
  @Get("tags")
  @RequireCapabilities("leads.read")
  async tags(@CurrentWorkspace() ws: WorkspaceContext) {
    const result = await this.contacts.distinctTags(ws.id);
    return result.tags;
  }

  @Get(":id")
  @RequireCapabilities("leads.read")
  get(@CurrentWorkspace() ws: WorkspaceContext, @Param("id") id: string) {
    return this.contacts.get(ws.id, id);
  }

  @Patch(":id")
  @RequireCapabilities("leads.write")
  @IdempotentCommand()
  update(
    @CurrentUser() user: AuthedRequestUser,
    @CurrentWorkspace() ws: WorkspaceContext,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateContactSchema))
    body: z.infer<typeof updateContactSchema>,
  ) {
    return this.contacts.update(ws, user.id, id, body);
  }
}
