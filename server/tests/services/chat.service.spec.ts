/* eslint-disable @typescript-eslint/no-var-requires */
import mongoose from 'mongoose';

import ChatModel from '../../models/chat.model';
import MessageModel from '../../models/messages.model';
import UserModel from '../../models/users.model';
import {
  saveChat,
  createMessage,
  addMessageToChat,
  getChat,
  addParticipantToChat,
  getChatsByParticipants,
} from '../../services/chat.service';
import { Chat, CreateChatPayload } from '../../types/chat';
import { Message } from '../../types/message';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockingoose = require('mockingoose');

describe('Chat service', () => {
  beforeEach(() => {
    mockingoose.resetAll();
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockingoose.resetAll();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  // ----------------------------------------------------------------------------
  // 1. saveChat
  // ----------------------------------------------------------------------------
  describe('saveChat', () => {
    // TODO: Task 3 - Write tests for the saveChat function
    it('should create chat without messages', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const mockChatPayload: CreateChatPayload = {
        participants: [testUserId.toString()],
        messages: [],
      };

      const expectedChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: [testUserId],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockingoose(ChatModel).toReturn(expectedChat, 'create');

      const result = await saveChat(mockChatPayload);
      if ('error' in result) {
        throw new Error(`Expected a Chat, got error: ${result.error}`);
      }

      expect(result).toHaveProperty('_id');
      expect(Array.isArray(result.participants)).toBe(true);
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.participants).toEqual([testUserId]);
      expect(result.messages).toEqual([]);
    });

    it('should return error if message creation fails', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const mockChatPayload: CreateChatPayload = {
        participants: [testUserId.toString()],
        messages: [
          { msg: 'Hello!', msgFrom: 'testUser', msgDateTime: new Date('2025-01-01T00:00:00Z') },
        ],
      };

      jest.spyOn(MessageModel, 'create').mockRejectedValueOnce(new Error('Database error'));

      const result = await saveChat(mockChatPayload);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Error when saving a chat');
      }
    });

    it('should return error if chat creation fails', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const mockChatPayload: CreateChatPayload = {
        participants: [testUserId.toString()],
        messages: [],
      };

      jest.spyOn(ChatModel, 'create').mockRejectedValueOnce(new Error('Database error'));

      const result = await saveChat(mockChatPayload);
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Error when saving a chat');
      }
    });

    it('should successfully save a chat and verify its body (ignore exact IDs)', async () => {
      const testUserId = new mongoose.Types.ObjectId();
      const mockChatPayload: CreateChatPayload = {
        participants: [testUserId.toString()],
        messages: [
          {
            msg: 'Hello!',
            msgFrom: 'testUser',
            msgDateTime: new Date('2025-01-01T00:00:00Z'),
          },
        ],
      };

      const messageId = new mongoose.Types.ObjectId();

      // 2) Mock message creation
      mockingoose(MessageModel).toReturn(
        {
          _id: messageId,
          msg: 'Hello!',
          msgFrom: 'testUser',
          msgDateTime: new Date('2025-01-01T00:00:00Z'),
          type: 'direct',
        },
        'create',
      );

      // 3) Mock chat creation
      mockingoose(ChatModel).toReturn(
        {
          _id: new mongoose.Types.ObjectId(),
          participants: [testUserId],
          messages: [messageId],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        'create',
      );

      // 4) Call the service
      const result = await saveChat(mockChatPayload);

      // 5) Verify no error
      if ('error' in result) {
        throw new Error(`Expected a Chat, got error: ${result.error}`);
      }

      expect(result).toHaveProperty('_id');
      expect(Array.isArray(result.participants)).toBe(true);
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.participants[0]?.toString()).toEqual(expect.any(String));
      expect(result.messages[0]?.toString()).toEqual(expect.any(String));
    });
  });

  // ----------------------------------------------------------------------------
  // 2. createMessage
  // ----------------------------------------------------------------------------
  describe('createMessage', () => {
    // TODO: Task 3 - Write tests for the createMessage function
    const mockMessage: Message = {
      msg: 'Hey!',
      msgFrom: 'userX',
      msgDateTime: new Date('2025-01-01T10:00:00.000Z'),
      type: 'direct',
    };

    it('should create a message successfully if user exists', async () => {
      // Mock the user existence check
      mockingoose(UserModel).toReturn(
        { _id: new mongoose.Types.ObjectId(), username: 'userX' },
        'findOne',
      );

      // Mock the created message
      const mockCreatedMsg = {
        _id: new mongoose.Types.ObjectId(),
        ...mockMessage,
      };
      mockingoose(MessageModel).toReturn(mockCreatedMsg, 'create');

      const result = await createMessage(mockMessage);

      if ('error' in result) {
        throw new Error(`Expected a Message, got error: ${result.error}`);
      }

      expect(result).toMatchObject({
        msg: 'Hey!',
        msgFrom: 'userX',
        msgDateTime: new Date('2025-01-01T10:00:00.000Z'),
        type: 'direct',
      });
    });

    it('should return error when message creation fails', async () => {
      jest.spyOn(MessageModel, 'create').mockRejectedValueOnce(new Error('Database error'));

      const result = await createMessage(mockMessage);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Error when saving a message');
      }
    });
  });

  // ----------------------------------------------------------------------------
  // 3. addMessageToChat
  // ----------------------------------------------------------------------------
  describe('addMessageToChat', () => {
    // TODO: Task 3 - Write tests for the addMessageToChat function
    it('should add a message ID to an existing chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId = new mongoose.Types.ObjectId().toString();
      const testUserId = new mongoose.Types.ObjectId();

      const mockUpdatedChat: Chat = {
        _id: new mongoose.Types.ObjectId(),
        participants: [testUserId.toString()],
        messages: [new mongoose.Types.ObjectId()],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Chat;

      // Mock findByIdAndUpdate
      mockingoose(ChatModel).toReturn(mockUpdatedChat, 'findOneAndUpdate');

      const result = await addMessageToChat(chatId, messageId);
      if ('error' in result) {
        throw new Error('Expected a chat, got an error');
      }

      expect(result.messages).toEqual(mockUpdatedChat.messages);
    });

    it('should return error when chat not found', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId = new mongoose.Types.ObjectId().toString();

      mockingoose(ChatModel).toReturn(null, 'findOneAndUpdate');

      const result = await addMessageToChat(chatId, messageId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Chat not found');
      }
    });

    it('should return error when database update fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const messageId = new mongoose.Types.ObjectId().toString();

      mockingoose(ChatModel).toReturn(new Error('Database error'), 'findOneAndUpdate');

      const result = await addMessageToChat(chatId, messageId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Error when adding a message to a chat');
      }
    });
  });

  // ----------------------------------------------------------------------------
  // 4. getChat
  // ----------------------------------------------------------------------------
  describe('getChat', () => {
    const chatId = new mongoose.Types.ObjectId().toString();

    it('should return error when chat not found', async () => {
      mockingoose(ChatModel).toReturn(null, 'findById');

      const result = await getChat(chatId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Chat not found');
      }
    });

    it('should return error when database query fails', async () => {
      mockingoose(ChatModel).toReturn(new Error('Database error'), 'findById');

      const result = await getChat(chatId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Chat not found');
      }
    });
  });

  // ----------------------------------------------------------------------------
  // 5. addParticipantToChat
  // ----------------------------------------------------------------------------
  describe('addParticipantToChat', () => {
    // TODO: Task 3 - Write tests for the addParticipantToChat function
    it('should add a participant to existing chat', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const testUserId = new mongoose.Types.ObjectId();
      const newUserId = new mongoose.Types.ObjectId();

      const mockUpdatedChat: Chat = {
        _id: new mongoose.Types.ObjectId(),
        participants: [testUserId.toString(), newUserId.toString()],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Chat;

      mockingoose(ChatModel).toReturn(mockUpdatedChat, 'findOneAndUpdate');

      const result = await addParticipantToChat(chatId, newUserId.toString());
      if ('error' in result) {
        throw new Error('Expected a chat, got an error');
      }
      expect(result._id).toEqual(mockUpdatedChat._id);
      expect(result).toHaveProperty('participants');
      expect(Array.isArray(result.participants)).toBe(true);
    });

    it('should return error when chat not found', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const userId = 'newUser';

      mockingoose(ChatModel).toReturn(null, 'findOneAndUpdate');

      const result = await addParticipantToChat(chatId, userId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Chat not found');
      }
    });

    it('should return error when database update fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const userId = 'newUser';

      mockingoose(ChatModel).toReturn(new Error('Database error'), 'findOneAndUpdate');

      const result = await addParticipantToChat(chatId, userId);

      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Error when adding a participant to a chat');
      }
    });
  });

  describe('getChatsByParticipants', () => {
    it('should retrieve chats by participants', async () => {
      const user1Id = new mongoose.Types.ObjectId();
      const user2Id = new mongoose.Types.ObjectId();
      const user3Id = new mongoose.Types.ObjectId();

      const mockChats: Chat[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          participants: [user1Id.toString(), user2Id.toString()],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          participants: [user1Id.toString(), user3Id.toString()],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockingoose(ChatModel).toReturn([mockChats[0]], 'find');

      const result = await getChatsByParticipants([user1Id.toString(), user2Id.toString()]);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('_id');
      expect(result[0]).toHaveProperty('participants');
      expect(result[0]).toHaveProperty('messages');
    });

    it('should retrieve chats by participants where the provided list is a subset', async () => {
      const user1Id = new mongoose.Types.ObjectId();
      const user2Id = new mongoose.Types.ObjectId();
      const user3Id = new mongoose.Types.ObjectId();

      const mockChats: Chat[] = [
        {
          _id: new mongoose.Types.ObjectId(),
          participants: [user1Id.toString(), user2Id.toString()],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          participants: [user1Id.toString(), user3Id.toString()],
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockingoose(ChatModel).toReturn([mockChats[0], mockChats[1]], 'find');

      const result = await getChatsByParticipants([user1Id.toString()]);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('_id');
      expect(result[1]).toHaveProperty('_id');
    });

    it('should return an empty array if no chats are found', async () => {
      const user1Id = new mongoose.Types.ObjectId();
      mockingoose(ChatModel).toReturn([], 'find');

      const result = await getChatsByParticipants([user1Id.toString()]);
      expect(result).toHaveLength(0);
    });

    it('should return an empty array if a database error occurs', async () => {
      const user1Id = new mongoose.Types.ObjectId();
      jest.spyOn(ChatModel, 'find').mockRejectedValueOnce(new Error('database error'));

      const result = await getChatsByParticipants([user1Id.toString()]);
      expect(result).toHaveLength(0);
    });
  });
});
