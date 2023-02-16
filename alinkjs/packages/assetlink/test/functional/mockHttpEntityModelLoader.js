import HttpEntityModelLoader from '@/HttpEntityModelLoader';
jest.mock('@/HttpEntityModelLoader');

import models from '../models.json';

HttpEntityModelLoader.mockImplementation(() => ({
    loadModels: jest.fn().mockImplementation(async () => models),
}));