#!/usr/bin/env node

// Imports statiques au niveau du module
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

const originalLog = console.log;
console.log = (...args) => console.error(...args);

// Variables globales
let server: any;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ]
});

let polls: Map<string, PollResult> = new Map();
let customButtons: Map<string, CustomButton> = new Map();

// Fonctions
async function executeButtonAction(action: any, channel: any, interaction: any): Promise<void> {
  // ... fonction complète sera ajoutée
}

async function initializeServer() {
  const fastmcp = await import('fastmcp');
  const { z } = await import('zod');
  
  server = new fastmcp.FastMCP({
    name: 'discord-server',
    version: '1.0.0'
  });

  // ... tous les outils seront ajoutés ici
}

