import { NextResponse } from 'next/server';
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

// Use Edge Runtime for longer timeout
export const runtime = 'edge';

// Get Helius API key from environment variable
const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
if (!HELIUS_API_KEY) {
  throw new Error('HELIUS_API_KEY environment variable is not set');
}

// Connect to Solana devnet using Helius RPC
const connection = new Connection(`https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
});

// Get treasury private key from environment variable
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY;
if (!TREASURY_PRIVATE_KEY) {
  throw new Error('TREASURY_PRIVATE_KEY environment variable is not set');
}

// Convert base58 private key to Uint8Array
const treasuryKeypair = Keypair.fromSecretKey(bs58.decode(TREASURY_PRIVATE_KEY));

export async function POST(request: Request) {
  try {
    const { playerAddress } = await request.json();

    if (!playerAddress) {
      return NextResponse.json(
        { error: 'Player address is required' },
        { status: 400 }
      );
    }

    // Create transaction to transfer 0.01 SOL
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: treasuryKeypair.publicKey,
        toPubkey: new PublicKey(playerAddress),
        lamports: 10000000, // 0.01 SOL
      })
    );

    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = treasuryKeypair.publicKey;

    // Sign transaction with treasury keypair
    transaction.sign(treasuryKeypair);

    // Send transaction without waiting for confirmation
    const signature = await connection.sendRawTransaction(transaction.serialize());

    return NextResponse.json({
      success: true,
      signature,
      message: 'Transaction sent successfully. Please check status separately.'
    });
  } catch (error) {
    console.error('Error processing reward claim:', error);
    return NextResponse.json(
      { error: 'Failed to process reward claim' },
      { status: 500 }
    );
  }
} 