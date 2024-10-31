import { describe, it, expect, beforeEach } from 'vitest';
import {
  Client,
  Provider,
  Receipt,
  Result,
  Transaction,
} from '@stacks/transactions';
import { StacksMocknet } from '@stacks/network';

describe('Reputation Management System', () => {
  let client: Client;
  let provider: Provider;
  let contractAddress: string;
  let dappAddress: string;
  let userAddress: string;
  
  beforeEach(async () => {
    // Setup mock network and client
    const network = new StacksMocknet();
    provider = await Provider.makeProvider(network);
    client = new Client(provider);
    
    // Generate test addresses
    contractAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    dappAddress = 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    userAddress = 'ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    // Deploy contract
    const deployTx = await client.deployContract({
      contractName: 'reputation-system',
      codeBody: '...', // Contract code would go here
      senderKey: 'contract-owner-private-key',
    });
    await deployTx.wait();
  });
  
  describe('DApp Registration', () => {
    it('should allow contract owner to register a new DApp', async () => {
      const tx = await client.callContract({
        contractAddress,
        contractName: 'reputation-system',
        functionName: 'register-dapp',
        functionArgs: ['Test DApp', 'u10'],
        senderKey: 'contract-owner-private-key',
      });
      
      const receipt: Receipt = await tx.wait();
      expect(receipt.success).toBe(true);
      
      // Verify DApp registration
      const result = await client.callReadOnly({
        contractAddress,
        contractName: 'reputation-system',
        functionName: 'get-dapp-info',
        functionArgs: [dappAddress],
      });
      
      const dappInfo = Result.unwrap(result);
      expect(dappInfo.name).toBe('Test DApp');
      expect(dappInfo.weight).toBe(10n);
      expect(dappInfo.isActive).toBe(true);
    });
    
    it('should reject DApp registration from non-owner', async () => {
      const tx = await client.callContract({
        contractAddress,
        contractName: 'reputation-system',
        functionName: 'register-dapp',
        functionArgs: ['Test DApp', 'u10'],
        senderKey: 'non-owner-private-key',
      });
      
      const receipt: Receipt = await tx.wait();
      expect(receipt.success).toBe(false);
      expect(Result.unwrapErr(receipt.result)).toBe(100); // ERR_UNAUTHORIZED
    });
  });
  
  describe('Interaction Reporting', () => {
    beforeEach(async () => {
      // Register a DApp first
      await client.callContract({
        contractAddress,
        contractName: 'reputation-system',
        functionName: 'register-dapp',
        functionArgs: ['Test DApp', 'u10'],
        senderKey: 'contract-owner-private-key',
      }).then(tx => tx.wait());
    });
    
    it('should allow registered DApp to report interaction', async () => {
      const tx = await client.callContract({
        contractAddress,
        contractName: 'reputation-system',
        functionName: 'report-interaction',
        functionArgs: [userAddress, 'u75', 'positive-review'],
        senderKey: 'dapp-private-key',
      });
      
      const receipt: Receipt = await tx.wait();
      expect(receipt.success).toBe(true);
      
      // Verify user score update
      const scoreResult = await client.callReadOnly({
        contractAddress,
        contractName: 'reputation-system',
        functionName: 'get-user-score',
        functionArgs: [userAddress],
      });
      
      const userScore = Result.unwrap(scoreResult);
      expect(userScore.totalScore).toBeGreaterThan(50n); // Should increase from initial score
      expect(userScore.interactionCount).toBe(1n);
    });
    
    it('should reject invalid scores', async () => {
      const tx = await client.callContract({
        contractAddress,
        contractName: 'reputation-system',
        functionName: 'report-interaction',
        functionArgs: [userAddress, 'u101', 'positive-review'], // Score > MAX_SCORE
        senderKey: 'dapp-private-key',
      });
      
      const receipt: Receipt = await tx.wait();
      expect(receipt.success).toBe(false);
      expect(Result.unwrapErr(receipt.result)).toBe(101); // ERR_INVALID_SCORE
    });
    
    it('should reject reports from unregistered DApps', async () => {
      const tx = await client.callContract({
        contractAddress,
        contractName: 'reputation-system',
        functionName: 'report-interaction',
        functionArgs: [userAddress, 'u75', 'positive-review'],
        senderKey: 'unregistered-dapp-private-key',
      });
      
      const receipt: Receipt = await tx.wait();
      expect(receipt.success).toBe(false);
      expect(Result.unwrapErr(receipt.result)).toBe(102); // ERR_DAPP_NOT_REGISTERED
    });
  });
  
  describe('Score Calculation', () => {
    beforeEach(async () => {
      // Setup: Register DApp and report multiple interactions
      await client.callContract({
        contractAddress,
        contractName: 'reputation-system',
        functionName: 'register-dapp',
        functionArgs: ['Test DApp', 'u10'],
        senderKey: 'contract-owner-private-key',
      }).then(tx => tx.wait());
    });
    
    it('should calculate weighted average score correctly', async () => {
      // Report multiple interactions
      const interactions = [
        { score: 80, type: 'positive-review' },
        { score: 60, type: 'neutral-review' },
        { score: 90, type: 'positive-review' }
      ];
      
      for (const interaction of interactions) {
        await client.callContract({
          contractAddress,
          contractName: 'reputation-system',
          functionName: 'report-interaction',
          functionArgs: [userAddress, `u${interaction.score}`, interaction.type],
          senderKey: 'dapp-private-key',
        }).then(tx => tx.wait());
      }
      
      // Verify final score
      const scoreResult = await client.callReadOnly({
        contractAddress,
        contractName: 'reputation-system',
        functionName: 'get-user-score',
        functionArgs: [userAddress],
      });
      
      const userScore = Result.unwrap(scoreResult);
      expect(userScore.interactionCount).toBe(3n);
      
      // Expected score: (80 + 60 + 90) / 3 = 76.67
      // Note: Actual calculation will be weighted by DApp weight
      expect(userScore.totalScore).toBeGreaterThan(75n);
      expect(userScore.totalScore).toBeLessThan(78n);
    });
    
    it('should handle initial interaction correctly', async () => {
      const tx = await client.callContract({
        contractAddress,
        contractName: 'reputation-system',
        functionName: 'report-interaction',
        functionArgs: [userAddress, 'u70', 'first-review'],
        senderKey: 'dapp-private-key',
      });
      
      const receipt: Receipt = await tx.wait();
      expect(receipt.success).toBe(true);
      
      const scoreResult = await client.callReadOnly({
        contractAddress,
        contractName: 'reputation-system',
        functionName: 'get-user-score',
        functionArgs: [userAddress],
      });
      
      const userScore = Result.unwrap(scoreResult);
      expect(userScore.interactionCount).toBe(1n);
      expect(userScore.totalScore).toBe(70n); // First score should be taken directly
    });
  });
  
  describe('User Score Retrieval', () => {
    it('should return initial score for new users', async () => {
      const result = await client.callReadOnly({
        contractAddress,
        contractName: 'reputation-system',
        functionName: 'get-user-score',
        functionArgs: ['ST4NEWFZFY1DGX8MNSNYVE3VGZJSRTPGZGM'],
      });
      
      const userScore = Result.unwrap(result);
      expect(userScore.totalScore).toBe(50n); // INITIAL_SCORE
      expect(userScore.interactionCount).toBe(0n);
    });
    
    it('should maintain score history accurately', async () => {
      // Register DApp
      await client.callContract({
        contractAddress,
        contractName: 'reputation-system',
        functionName: 'register-dapp',
        functionArgs: ['Test DApp', 'u10'],
        senderKey: 'contract-owner-private-key',
      }).then(tx => tx.wait());
      
      // Report multiple interactions over time
      const interactions = [
        { score: 70, type: 'positive-review' },
        { score: 85, type: 'positive-review' },
        { score: 65, type: 'neutral-review' }
      ];
      
      for (const interaction of interactions) {
        await client.callContract({
          contractAddress,
          contractName: 'reputation-system',
          functionName: 'report-interaction',
          functionArgs: [userAddress, `u${interaction.score}`, interaction.type],
          senderKey: 'dapp-private-key',
        }).then(tx => tx.wait());
        
        // Verify score after each interaction
        const scoreResult = await client.callReadOnly({
          contractAddress,
          contractName: 'reputation-system',
          functionName: 'get-user-score',
          functionArgs: [userAddress],
        });
        
        const userScore = Result.unwrap(scoreResult);
        expect(userScore.lastUpdated).toBeDefined();
        expect(userScore.lastUpdated).toBeGreaterThan(0n);
      }
    });
  });
});
