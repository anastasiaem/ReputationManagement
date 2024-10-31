# DApp Reputation Management System

A decentralized reputation scoring system built on Stacks blockchain that enables cross-DApp user reputation tracking and management.

## Overview

The DApp Reputation Management System provides a trustless, transparent way to track user behavior and reputation across multiple decentralized applications. This system creates a universal "credit score" for blockchain users, incentivizing positive behavior while maintaining privacy and security.

## Features

- **Decentralized Scoring**: Transparent, on-chain reputation calculation
- **Multi-DApp Support**: Unified reputation tracking across different applications
- **Weighted Scoring**: DApp-specific weight factors for score calculation
- **Privacy-Focused**: Users maintain control over their reputation data
- **Flexible Integration**: Easy integration for new DApps
- **Secure Authentication**: Role-based access control for score reporting

## Architecture

### Smart Contracts

- `reputation-system.clar`: Main contract handling reputation logic
    - User score tracking
    - DApp registration
    - Interaction reporting
    - Score calculation

### Core Components

1. **Score Management**
    - Range: 0-100
    - Initial Score: 50
    - Weighted average calculation
    - Interaction history tracking

2. **DApp Registry**
    - Authorized DApp registration
    - Weight assignment
    - Activity status tracking

3. **Interaction Recording**
    - Timestamped interactions
    - Action type classification
    - Score impact calculation

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/dapp-reputation-system.git
cd dapp-reputation-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Testing

Run the test suite:
```bash
npm test
```

Run specific test categories:
```bash
npm test -- --grep "DApp Registration"
npm test -- --grep "Score Calculation"
```

## Usage

### 1. Deploy the Contract

```bash
stx deploy reputation-system.clar
```

### 2. Register a DApp

```clarity
(contract-call? .reputation-system register-dapp 
    "My DApp" 
    u10)  ;; Weight factor
```

### 3. Report User Interactions

```clarity
(contract-call? .reputation-system report-interaction
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM  ;; User address
    u75                                           ;; Score
    "positive-review")                            ;; Action type
```

### 4. Query User Score

```clarity
(contract-call? .reputation-system get-user-score
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
```

## Integration Guide

### For DApp Developers

1. **Registration**
    - Register your DApp with the system
    - Obtain necessary credentials
    - Set up weight factors

2. **Implementation**
    - Import contract interfaces
    - Implement score reporting
    - Handle user authorization

3. **Best Practices**
    - Regular score updates
    - Fair scoring criteria
    - User privacy consideration

### Example Integration

```typescript
import { Client } from '@stacks/transactions';

async function reportUserAction(
  userAddress: string,
  score: number,
  actionType: string
) {
  const tx = await client.callContract({
    contractAddress,
    contractName: 'reputation-system',
    functionName: 'report-interaction',
    functionArgs: [userAddress, `u${score}`, actionType],
  });
  
  return await tx.wait();
}
```

## Security Considerations

- **Access Control**: Only registered DApps can report scores
- **Score Validation**: Strict bounds checking on reported scores
- **Rate Limiting**: Prevents score manipulation
- **Data Privacy**: Minimal personal data storage
- **Smart Contract Security**: Formal verification and auditing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Error Codes

| Code | Description               |
|------|---------------------------|
| 100  | Unauthorized Access       |
| 101  | Invalid Score            |
| 102  | DApp Not Registered      |

## Future Enhancements

- Score decay over time
- Reputation categories/badges
- Dispute resolution mechanism
- Enhanced privacy features
- Cross-chain compatibility

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Project Link: [https://github.com/your-username/dapp-reputation-system](https://github.com/your-username/dapp-reputation-system)
- Documentation: [https://docs.dapp-reputation.io](https://docs.dapp-reputation.io)

## Acknowledgments

- Stacks Blockchain Team
- Clarity Language Documentation
- DApp Development Community

