import mongoose from 'mongoose';
import supertest from 'supertest';
import { app } from '../../app';
import * as chatService from '../../services/chat.service';
import * as databaseUtil from '../../utils/database.util';
import { Chat } from '../../types/chat';

/**
 * Spies on the service functions
 */
const saveChatSpy = jest.spyOn(chatService, 'saveChat');
const createMessageSpy = jest.spyOn(chatService, 'createMessage');
const addMessageSpy = jest.spyOn(chatService, 'addMessageToChat');
const getChatSpy = jest.spyOn(chatService, 'getChat');
const addParticipantSpy = jest.spyOn(chatService, 'addParticipantToChat');
const populateDocumentSpy = jest.spyOn(databaseUtil, 'populateDocument');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockingoose = require('mockingoose');

/**
 * Sample test suite for the /chat endpoints
 */
describe('Chat Controller', () => {
  beforeEach(() => {
    mockingoose.resetAll();
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockingoose.resetAll();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
  describe('POST /chat/createChat', () => {
    // TODO: Task 3 Write additional tests for the createChat endpoint
    it('should create a new chat successfully', async () => {
      const validChatPayload = {
        participants: ['user1', 'user2'],
        messages: [{ msg: 'Hello!', msgFrom: 'user1', msgDateTime: new Date('2025-01-01') }],
      };

      const serializedPayload = {
        ...validChatPayload,
        messages: validChatPayload.messages.map(message => ({
          ...message,
          msgDateTime: message.msgDateTime.toISOString(),
        })),
      };

      const chatResponse: Chat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'user2'],
        messages: [
          {
            _id: new mongoose.Types.ObjectId(),
            msg: 'Hello!',
            msgFrom: 'user1',
            msgDateTime: new Date('2025-01-01'),
            user: {
              _id: new mongoose.Types.ObjectId(),
              username: 'user1',
            },
            type: 'direct',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      saveChatSpy.mockResolvedValue(chatResponse);
      populateDocumentSpy.mockResolvedValue(chatResponse);

      const response = await supertest(app).post('/chat/createChat').send(validChatPayload);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        _id: chatResponse._id?.toString(),
        participants: chatResponse.participants.map(participant => participant.toString()),
        messages: chatResponse.messages.map(message => ({
          ...message,
          _id: message._id?.toString(),
          msgDateTime: message.msgDateTime.toISOString(),
          user: {
            ...message.user,
            _id: message.user?._id.toString(),
          },
        })),
        createdAt: chatResponse.createdAt?.toISOString(),
        updatedAt: chatResponse.updatedAt?.toISOString(),
      });

      expect(saveChatSpy).toHaveBeenCalledWith(serializedPayload);
      expect(populateDocumentSpy).toHaveBeenCalledWith(chatResponse._id?.toString(), 'chat');
    });

    it('should return 400 for invalid participants', async () => {
      const invalidPayload = {
        participants: [],
        messages: [],
      };

      const response = await supertest(app).post('/chat/createChat').send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid request body' });
    });

    it('should return 400 for missing participants', async () => {
      const invalidPayload = {
        messages: [],
      };

      const response = await supertest(app).post('/chat/createChat').send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid request body' });
    });

    it('should return 500 when service fails', async () => {
      const validChatPayload = {
        participants: ['user1', 'user2'],
        messages: [],
      };

      saveChatSpy.mockResolvedValue({ error: 'Service error' });

      const response = await supertest(app).post('/chat/createChat').send(validChatPayload);

      expect(response.status).toBe(500);
    });

    it('should return 500 when population fails', async () => {
      const validChatPayload = {
        participants: ['user1', 'user2'],
        messages: [],
      };

      const chatResponse = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1', 'user2'],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      saveChatSpy.mockResolvedValue(chatResponse);
      populateDocumentSpy.mockResolvedValue({ error: 'Population error' });

      const response = await supertest(app).post('/chat/createChat').send(validChatPayload);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /chat/:chatId/addMessage', () => {
    it('should return 400 for invalid message data - missing msg', async () => {
      const chatId = new mongoose.Types.ObjectId();
      const invalidPayload = {
        msgFrom: 'user1',
        msgDateTime: new Date('2025-01-01'),
      };

      const response = await supertest(app).post(`/chat/${chatId}/addMessage`).send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid request body' });
    });

    it('should return 400 for invalid message data - missing msgFrom', async () => {
      const chatId = new mongoose.Types.ObjectId();
      const invalidPayload = {
        msg: 'Hello!',
        msgDateTime: new Date('2025-01-01'),
      };

      const response = await supertest(app).post(`/chat/${chatId}/addMessage`).send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid request body' });
    });

    it('should return 500 when message creation fails', async () => {
      const chatId = new mongoose.Types.ObjectId();
      const messagePayload = {
        msg: 'Hello!',
        msgFrom: 'user1',
        msgDateTime: new Date('2025-01-01'),
      };

      createMessageSpy.mockResolvedValue({ error: 'Message creation failed' });

      const response = await supertest(app).post(`/chat/${chatId}/addMessage`).send(messagePayload);

      expect(response.status).toBe(500);
    });

    it('should return 500 when adding message to chat fails', async () => {
      const chatId = new mongoose.Types.ObjectId();
      const messagePayload = {
        msg: 'Hello!',
        msgFrom: 'user1',
        msgDateTime: new Date('2025-01-01'),
      };

      const messageResponse = {
        _id: new mongoose.Types.ObjectId(),
        ...messagePayload,
        type: 'direct' as const,
      };

      createMessageSpy.mockResolvedValue(messageResponse);
      addMessageSpy.mockResolvedValue({ error: 'Failed to add message to chat' });

      const response = await supertest(app).post(`/chat/${chatId}/addMessage`).send(messagePayload);

      expect(response.status).toBe(500);
    });
  });

  describe('GET /chat/:chatId', () => {
    it('should return 500 when service fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();

      getChatSpy.mockResolvedValue({ error: 'Service error' });

      const response = await supertest(app).get(`/chat/${chatId}`);

      expect(response.status).toBe(500);
    });

    it('should return 500 when population fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const mockFoundChat = {
        _id: new mongoose.Types.ObjectId(),
        participants: ['user1'],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      getChatSpy.mockResolvedValue(mockFoundChat);
      populateDocumentSpy.mockResolvedValue({ error: 'Population error' });

      const response = await supertest(app).get(`/chat/${chatId}`);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /chat/:chatId/addParticipant', () => {
    it('should return 400 for invalid request - missing userId', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const invalidPayload = {};

      const response = await supertest(app)
        .post(`/chat/${chatId}/addParticipant`)
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid request body' });
    });

    it('should return 400 for invalid request - empty userId', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const invalidPayload = { userId: '' };

      const response = await supertest(app)
        .post(`/chat/${chatId}/addParticipant`)
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid request body' });
    });

    it('should return 500 when service fails', async () => {
      const chatId = new mongoose.Types.ObjectId().toString();
      const userId = 'user2';

      addParticipantSpy.mockResolvedValue({ error: 'Service error' });

      const response = await supertest(app).post(`/chat/${chatId}/addParticipant`).send({ userId });

      expect(response.status).toBe(500);
    });
  });
});
