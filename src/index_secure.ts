#!/usr/bin/env node

const originalLog = console.log;
console.log = (...args) => console.error(...args);
import {
  Client,
  GatewayIntentBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  AttachmentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActivityType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';

// Import des configurations et utils
import { botConfig } from './config.js';
import { logger } from './utils/logger.js';
import {
  loadPolls,
  savePolls,
  addPoll,
  updatePoll,
  deletePoll,
  getPoll,
  cleanExpiredPolls
} from './utils/pollPersistence.js';
import {
  loadCustomButtons,
  saveCustomButtons,
  addCustomButton,
  deleteCustomButton,
  getCustomButton,
  cleanOldButtons,
  CustomButton
} from './utils/buttonPersistence.js';

// Import des outils
import {
  CreatePollSchema,
  createPollEmbed,
  createResultsEmbed,
  PollResult,
  getPollButtons
} from './tools/polls';

import {
  FileUploadSchema,
  createAttachmentFromFile,
  createFileUploadEmbed
} from './tools/fileUpload';

import {
  CreateEmbedSchema,
  EMBED_TEMPLATES,
  createEmbedFromTemplate,
  validateEmbed
} from './tools/embedBuilder';

import {
  CodePreviewSchema,
  createCodePreviewMessages,
  validateLanguage
} from './tools/codePreview';

import {
  InteractionSchema,
  buildActionRows,
  validateComponents
} from './tools/interactions';

import {
  SendMessageSchema,
  EditMessageSchema,
  DeleteMessageSchema,
  ReadMessagesSchema,
  AddReactionSchema,
  sendMessage,
  editMessage,
  deleteMessage,
  readMessages,
  addReaction,
  formatHistoryAsMarkdown
} from './tools/messageManager';

// Import des outils serveur fragmentés
import {
  GetServerInfoSchema,
  getServerInfo,
  formatServerInfoMarkdown
} from './tools/serverInfo';

import {
  GetChannelsSchema,
  getChannels,
  formatChannelsMarkdown
} from './tools/channelManager';

import {
  ListMembersSchema,
  listMembers,
  formatMembersMarkdown
} from './tools/memberManager';

import {
  GetUserInfoSchema,
  getUserInfo,
  formatUserInfoMarkdown
} from './tools/userManager';

