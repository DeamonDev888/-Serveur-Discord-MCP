/**
 * 🛠️ UTILS - Index
 * ================
 * Export tous les utilitaires partagés.
 */

// Constantes
export { EMBED_TEMPLATES } from '../embeds/templates.js';

// Helpers
export { formatDuration } from '../polls/createPoll.js';

// Types - importés directement depuis les schemas
import type { z } from 'zod';

export type SendMessageParams = z.infer<typeof import('../messages/sendMessage.js').SendMessageSchema>;
export type EditMessageParams = z.infer<typeof import('../messages/editMessage.js').EditMessageSchema>;
export type DeleteMessageParams = z.infer<typeof import('../messages/deleteMessage.js').DeleteMessageSchema>;
export type ReadMessagesParams = z.infer<typeof import('../messages/readMessages.js').ReadMessagesSchema>;
export type AddReactionParams = z.infer<typeof import('../messages/reactions.js').AddReactionSchema>;

export type CreatePollParams = z.infer<typeof import('../polls/createPoll.js').CreatePollSchema>;
export type ListMembersParams = z.infer<typeof import('../members/listMembers.js').ListMembersSchema>;
export type GetUserInfoParams = z.infer<typeof import('../members/userInfo.js').GetUserInfoSchema>;
export type GetServerInfoParams = z.infer<typeof import('../members/serverInfo.js').GetServerInfoSchema>;

// Note: FileUploadParams, CreateWebhookParams, ListWebhooksParams, SendWebhookParams n'existent pas encore
// Ils seront ajoutés quand les fichiers correspondants seront créés
