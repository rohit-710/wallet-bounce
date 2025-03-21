# Wallet Bounce Game

A fun and interactive game built with Next.js and Matter.js where players can earn SOL rewards by bouncing a ball. The game features a leaderboard system and integrates with Solana blockchain for reward distribution.

## Features

- Interactive ball bouncing game with physics-based mechanics
- Real-time score tracking
- Leaderboard system with persistent storage
- Solana blockchain integration for rewards
- Modern UI with smooth animations and transitions
- Responsive design with beautiful pastel theme

## Prerequisites

- Node.js (v16 or higher)
- Yarn package manager
- Solana CLI tools
- A Solana wallet (e.g., Phantom, Solflare)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd breakwallet
```

2. Install dependencies:
```bash
yarn install
```

3. Get your project ID from Reown Cloud:
   - Visit [Reown Cloud](https://cloud.reown.com)
   - Create a new project or select an existing one
   - Copy your project ID from the dashboard

4. Create a `.env.local` file in the root directory with the following variables:
```env
# Treasury private key (base58 encoded)
TREASURY_PRIVATE_KEY=your_private_key_here

# Reown Cloud project ID
REOWN_PROJECT_ID=your_project_id_here
```

## Configuration

### Environment Variables

- `TREASURY_PRIVATE_KEY`: The private key of the treasury wallet in base58 format. This wallet will be used to distribute rewards to players.
- `REOWN_PROJECT_ID`: Your project ID from Reown Cloud. This is required for wallet integration.

### Game Settings

The game has several configurable parameters in `components/Game.tsx`:

- `REWARD_AMOUNT`: Amount of SOL to reward players (default: 0.01 SOL)
- Ball physics parameters (speed, friction, etc.)
- Canvas dimensions and game boundaries

## Development

Start the development server:

```bash
yarn dev
```

The application will be available at `http://localhost:3000`

## Game Mechanics

1. Connect your Solana wallet
2. Use your mouse to control the racket
3. Keep the ball bouncing as long as possible
4. Try to achieve a high score
5. Claim SOL rewards when you achieve a new high score

## Technical Stack

- **Frontend Framework**: Next.js
- **Physics Engine**: Matter.js
- **Blockchain**: Solana
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Wallet Integration**: Reown AppKit

## Dependencies

Key dependencies include:

- `@solana/web3.js`: Solana blockchain interaction
- `matter-js`: Physics engine for game mechanics
- `@reown/appkit`: Wallet integration
- `tailwindcss`: Styling
- `next`: React framework
